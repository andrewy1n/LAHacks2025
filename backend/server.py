import os
import shutil
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from git import Repo, GitCommandError
from google import genai
import json
import re
from pathlib import Path
from pydantic import BaseModel

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))


class SustainabilitySuggestion(BaseModel):
    description: str
    urgency: str

class GeminiAnalysisResponse(BaseModel):
    file_path: str
    suggestions: list[SustainabilitySuggestion]

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

async def analyze_file_with_gemini(file_path: str, content: str) -> GeminiAnalysisResponse | None:
    prompt = f"""
    Analyze this file for sustainability improvements based on these guidelines:
    {SUSTAINABILITY_GUIDELINES}
    
    File path: {file_path}
    File content:
    {content}
    """
    try:
        # Wrap synchronous Gemini call in thread
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.0-flash-lite",
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': GeminiAnalysisResponse,
            },
        )
        return response.parsed
    except Exception as e:
        print(f"Error analyzing {file_path}: {str(e)}")
        return None

async def generate_optimized_code(original_content: str, suggestions: list[SustainabilitySuggestion]) -> str | None:
    prompt = f"""
    Optimize this code based on sustainability suggestions:
    {json.dumps([s.model_dump() for s in suggestions])}
    
    Original code:
    {original_content}
    
    Return only the optimized code without explanations.
    Preserve functionality while implementing improvements.
    """
    try:
        # Wrap synchronous Gemini call in thread
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error generating optimized code: {str(e)}")
        return None

async def process_repository(repo_path: str):
    # Get files asynchronously
    def collect_files():
        files = []
        for root, _, filenames in os.walk(repo_path):
            if '.git' in root:
                continue
            for filename in filenames:
                file_ext = Path(filename).suffix.lower()
                if file_ext in ('.html', '.css', '.js', '.ts', '.jsx', '.tsx'):
                    full_path = Path(root, filename)
                    rel_path = str(full_path.relative_to(repo_path))
                    files.append((str(root), filename, rel_path))
        return files

    file_list = await asyncio.to_thread(collect_files)

    for root, filename, rel_path in file_list:
        yield f"data: Analyzing {rel_path}\n\n"

        try:
            # Async file read
            content = await asyncio.to_thread(
                Path(root, filename).read_text, 
                encoding='utf-8'
            )
            
            analysis = await analyze_file_with_gemini(rel_path, content)
            if not (analysis and analysis.suggestions):
                yield f"data: No suggestions for {rel_path}\n\n"
                continue

            yield f"data: Got {len(analysis.suggestions)} suggestion(s) for {rel_path}\n\n"
            
            optimized = await generate_optimized_code(content, analysis.suggestions)
            if optimized:
                yield f"data: Optimized code generated for {rel_path}\n\n"
                yield f"__PATCH__\n{optimized}\n\n"
            else:
                yield f"data: Failed to generate optimized code for {rel_path}\n\n"

        except Exception as e:
            yield f"data: Error processing {rel_path}: {str(e)}\n\n"

async def analysis_generator(github_url: str):
    temp_dir = tempfile.mkdtemp(prefix="repo_analysis_")
    repo_name = github_url.rstrip('/').split('/')[-1].replace('.git', '')
    repo_path = os.path.join(temp_dir, repo_name)

    try:
        yield "data: Cloning repository...\n\n"
        # Clone repo in thread
        await asyncio.to_thread(Repo.clone_from, github_url, repo_path)
        yield "data: Repository cloned successfully\n\n"

        # Process files with async generator
        async for msg in process_repository(repo_path):
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