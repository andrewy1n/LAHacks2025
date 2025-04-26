 
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
 
url = "https://api.asi1.ai/v1/chat/completions"
api_key = os.getenv("AS1_API_KEY")
 
payload = json.dumps({
  "model": "asi1-mini",
  "messages": [
    {
      "role": "user",
      "content": "Hi, tell me about giraffes"
    }
  ],
  "temperature": 0,
  "stream": True,
  "max_tokens": 0
})
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': f'Bearer {api_key}'
}
 
response = requests.request("POST", url, headers=headers, data=payload)
 
print(response.text)
 