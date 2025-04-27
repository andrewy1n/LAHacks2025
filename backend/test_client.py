import httpx
import asyncio
from datetime import datetime

def timestamp():
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]

async def test_analyze():
    # Test with a public GitHub repository
    github_url = "https://github.com/andrewy1n/DiamondHacks2025"
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
        try:
            print(f"[{timestamp()}] Testing repository: {github_url}")
            async with client.stream(
                "GET",
                "http://localhost:8000/analyze",
                params={"github_url": github_url}
            ) as response:
                print(f"[{timestamp()}] Status code: {response.status_code}")
                print(f"[{timestamp()}] Streaming response (Ctrl+C to stop):\n")
                
                async for chunk in response.aiter_text():
                    for line in chunk.split('\n'):
                        if line.strip():  # Only print non-empty lines
                            print(f"[{timestamp()}] {line}")
            
            print(f"\n[{timestamp()}] Stream completed")
            
        except httpx.HTTPError as e:
            print(f"\n[{timestamp()}] HTTP Error occurred: {str(e)}")
            if hasattr(e, 'response'):
                print(f"[{timestamp()}] Response status: {e.response.status_code}")
                try:
                    print(f"[{timestamp()}] Response text: {e.response.text}")
                except:
                    print(f"[{timestamp()}] Could not read response text")
        except Exception as e:
            print(f"\n[{timestamp()}] Error occurred: {str(e)}")
            import traceback
            print(f"[{timestamp()}] Full traceback:")
            print(traceback.format_exc())

if __name__ == "__main__":
    print(f"[{timestamp()}] Starting test...")
    try:
        asyncio.run(test_analyze())
    except KeyboardInterrupt:
        print(f"\n[{timestamp()}] Test interrupted by user")
    print(f"[{timestamp()}] Test completed")