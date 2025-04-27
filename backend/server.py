import os
import shutil
import sqlite3
import tempfile
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from git import Repo, GitCommandError
from google import genai
import json
import re
from pathlib import Path
from pydantic import BaseModel
from estimator import estimate
from github_auth import create_and_push_branch
from parser import parse

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Initialize SQLite database
conn = sqlite3.connect('files.db')
c = conn.cursor()
c.execute('''
    CREATE TABLE IF NOT EXISTS files (
        file_path TEXT PRIMARY KEY,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
conn.commit()
conn.close()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("sustainability_guidelines.txt", "r") as f:
    SUSTAINABILITY_GUIDELINES = f.read()

def extract_json_from_llm_response(response: str):
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", response)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError as e:
                print("JSON parsing error:", e)
        return None

def extract_codeblock_content(text):
    pattern = r'```(?:[a-zA-Z]*)\n?(.*?)\n?```'
    matches = re.findall(pattern, text, re.DOTALL)
    return matches[0].strip() if matches else text

async def generate_optimized_code(original_content: str, issue: Dict) -> str | None:
    prompt = f"""
    Optimize this code based on sustainability suggestions:
    Issues Dictionary For Given Code: {issue}
    
    Original code:
    {original_content}
    
    Return only the optimized code without explanations.
    Preserve functionality while implementing improvements.
    """
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error generating optimized code: {str(e)}")
        return None

async def generate_code(repo_path: str, frontend_dir: str, issues: List[Dict[str, Any]]):
    CODE_EXTENSIONS = {'.html', '.css', '.js', '.ts', '.jsx', '.tsx'}
    
    for issue in issues:
        filename = issue["file"]
        if filename is None:
            continue
        file_ext = Path(filename).suffix.lower()
        
        if file_ext not in CODE_EXTENSIONS:
            yield f"data: Skipping {filename} - not a code file\n\n"
            continue
            
        yield f"data: Generating code suggestions for {filename}\n\n"
        
        try:
            full_path = os.path.join(repo_path, frontend_dir, filename)
            if not os.path.exists(full_path):
                yield f"data: File not found: {filename}\n\n"
                continue

            content = await asyncio.to_thread(
                Path(full_path).read_text, 
                encoding='utf-8'
            )

            yield f"data: issue: {issue}\n\n"
            
            optimized = await generate_optimized_code(content, issue)
            if optimized:
                yield f"data: path: {os.path.join(frontend_dir, filename)}\n\n"
                yield f"data: original: {content}\n\n"
                yield f"data: optimized: {extract_codeblock_content(optimized)}\n\n"
                
                # # Save to database
                # with sqlite3.connect('files.db') as conn:
                #     c = conn.cursor()
                #     c.execute('INSERT OR REPLACE INTO files (file_path, content) VALUES (?, ?)', 
                #              (filename, optimized))
                #     conn.commit()
            else:
                yield f"data: Failed to generate optimized code for {filename}\n\n"

        except Exception as e:
            yield f"data: Error processing {filename}: {str(e)}\n\n"

async def analysis_generator(github_url: str):
    temp_dir = tempfile.mkdtemp(prefix="repo_analysis_")
    repo_name = github_url.rstrip('/').split('/')[-1].replace('.git', '')
    repo_path = os.path.join(temp_dir, repo_name)

    # Create a keep-alive task
    async def keep_alive():
        while True:
            await asyncio.sleep(15)
            yield "data: 🔄 Still analyzing...\n\n"

    # Start the keep-alive task
    keep_alive_task = keep_alive()

    try:
        yield "data: Cloning repository...\n\n"
        await asyncio.to_thread(Repo.clone_from, github_url, repo_path)
        yield "data: Repository cloned successfully\n\n"

        # Find the frontend directory
        frontend_dir = '.'
        for root, dirs, _ in os.walk(repo_path):
            if 'package.json' in os.listdir(root):
                frontend_dir = os.path.relpath(root, repo_path)
                break
        
        if not frontend_dir:
            frontend_dir = repo_path
            
        yield f"data: Using directory: {frontend_dir}\n\n"

        issues = []
        async for msg in parse(os.path.join(repo_path, frontend_dir)):
            # Send keep-alive message if available
            try:
                keep_alive_msg = await keep_alive_task.__anext__()
                yield keep_alive_msg
            except StopAsyncIteration:
                pass

            if msg["type"] == "progress":
                yield f"data: {msg['message']}\n\n"
            elif msg["type"] == "metrics":
                metrics = msg["data"]
                carbon_per_view = estimate(metrics["total_bytes"])
                yield f"data: carbon_per_view: {carbon_per_view['carbon_per_view']}\n\n"
            elif msg["type"] == "issue":
                issues.append(msg["data"])
                yield f"data: issue: {json.dumps(msg['data'])}\n\n"
            elif msg["type"] == "result":
                metrics = msg["metrics"]
                issues = msg["issues"]
                yield f"data: metrics: {json.dumps(metrics)}\n\n"
                yield f"data: issues: {json.dumps(issues)}\n\n"
        
        async for msg in generate_code(repo_path, frontend_dir, issues):
            # Send keep-alive message if available
            try:
                keep_alive_msg = await keep_alive_task.__anext__()
                yield keep_alive_msg
            except StopAsyncIteration:
                pass

            if msg.startswith("issue:") or msg.startswith("path:") or msg.startswith("original:") or msg.startswith("optimized:"):
                yield f"data: {msg}"
            else:
                yield msg
        
        yield "data: 🎉 All done!\n\n"

    except GitCommandError as e:
        yield f"data: ❌ Git error: {str(e)}\n\n"
    except Exception as e:
        yield f"data: ❌ Server error: {str(e)}\n\n"
    finally:
        await asyncio.to_thread(shutil.rmtree, temp_dir)
        yield "data: Cleaned up temporary files\n\n"

@app.get("/analyze")
async def analyze_repository(github_url: str):
    response = StreamingResponse(
        analysis_generator(github_url),
        media_type="text/event-stream",
    )

    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response

@app.post("/save-file")
async def save_file(file_path: str, content: str):
    with sqlite3.connect('files.db') as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS files (
                file_path TEXT PRIMARY KEY,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        c.execute('INSERT OR REPLACE INTO files (file_path, content) VALUES (?, ?)', 
                 (file_path, content))
        conn.commit()
    return {"message": "File saved successfully"}

@app.post("/create-branch")
async def create_branch(github_url: str, installation_id: str):
    await asyncio.to_thread(create_and_push_branch, github_url, "sustainability-improvements", installation_id= int(installation_id))
    return {"message": "Branch created successfully"}