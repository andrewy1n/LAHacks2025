import os
from urllib.parse import urlparse
from dotenv import load_dotenv
import requests
import jwt
import time
from git import Repo
import tempfile

load_dotenv()

installation_id = 65359170
app_id = os.getenv("GITHUB_APP_ID")
private_key_path = "reporeleaf.2025-04-26.private-key.pem"

def generate_jwt():
    now = int(time.time())
    payload = {
        "iat": now,
        "exp": now + (10 * 60),  # Expires in 10 mins
        "iss": app_id
    }
    with open(private_key_path, "r") as key_file:
        private_key = key_file.read()
    return jwt.encode(payload, private_key, algorithm="RS256")

def get_installation_access_token(jwt_token, installation_id):
    """Get installation access token using JWT"""
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github+json"
    }
    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
    response = requests.post(url, headers=headers)
    response.raise_for_status()
    return response.json()["token"]

def parse_github_url(github_url):
    """Extract owner and repo from GitHub URL"""
    parsed = urlparse(github_url)
    path_parts = parsed.path.strip('/').split('/')
    if len(path_parts) >= 2:
        return path_parts[0], path_parts[1]
    raise ValueError("Invalid GitHub repository URL")

def create_and_push_branch(github_url, new_branch_name, base_branch="main"):
    """
    Create and push a new branch to a GitHub repository
    :param github_url: Full GitHub repository URL (e.g., https://github.com/owner/repo)
    :param new_branch_name: Name of the new branch to create
    :param base_branch: Branch to base the new branch from (default: main)
    """
    # Authenticate
    jwt_token = generate_jwt()
    access_token = get_installation_access_token(jwt_token, installation_id)
    # Parse repository info
    owner, repo = parse_github_url(github_url)
    
    # Create authenticated git URL
    auth_github_url = f"https://x-access-token:{access_token}@github.com/{owner}/{repo}.git"
    
    # Create temporary directory for the clone
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Clone the repository
            repo = Repo.clone_from(auth_github_url, temp_dir)
            
            repo.git.checkout(base_branch)
            repo.git.pull()
            new_branch = repo.create_head(new_branch_name)
            new_branch.checkout()
            
            # Push the new branch
            origin = repo.remote(name='origin')
            origin.push(new_branch_name)
            
            print(f"Successfully created and pushed branch '{new_branch_name}' to {github_url}")
            return True
        except Exception as e:
            print(f"Error creating branch: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    repo_url = "https://github.com/andrewy1n/LAHacks2025"


    create_and_push_branch(
        github_url=repo_url,
        new_branch_name="new-feature-branch"
    )