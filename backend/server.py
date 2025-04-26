from typing import Union
import subprocess
import os
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from git import Repo, GitCommandError

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}

async def analysis_generator(github_url: str):
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Clone the repository using GitPython
            repo = Repo.clone_from(github_url, temp_dir)
            
            yield f"Successfully cloned repository: {github_url}\n\n"
            yield "Files in repository:\n"
            yield "------------------\n"
            
            # Walk through the repository and list all files
            for root, dirs, files in os.walk(repo.working_dir):
                # Skip the .git directory
                if '.git' in root:
                    continue
                    
                # Get the relative path from the temp directory
                rel_path = os.path.relpath(root, temp_dir)
                if rel_path == '.':
                    rel_path = ''
                
                # Print files in this directory
                for file in files:
                    if rel_path:
                        yield f"{rel_path}/{file}\n"
                    else:
                        yield f"{file}\n"
            
            yield "\nRepository analysis complete.\n"
            
        except GitCommandError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to clone repository: {str(e)}"
            )


@app.get("/analyze")
async def analyze_repository(github_url: str):
    try:
        return StreamingResponse(
            analysis_generator(github_url),
            media_type="text/plain"
        )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )