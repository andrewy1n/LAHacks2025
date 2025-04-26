import httpx
import asyncio

async def test_analyze():
    # Test with a public GitHub repository
    github_url = "https://github.com/andrewy1n/LAHacks2025.git"
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Testing repository: {github_url}")
            response = await client.get(
                "http://localhost:8000/analyze",
                params={"github_url": github_url}
            )
            
            print(f"Status code: {response.status_code}")
            print("Response:")
            print(response.text)
            
        except httpx.HTTPError as e:
            print(f"HTTP Error occurred: {str(e)}")
            if hasattr(e, 'response'):
                print(f"Response status: {e.response.status_code}")
                print(f"Response text: {e.response.text}")
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            import traceback
            print("Full traceback:")
            print(traceback.format_exc())

if __name__ == "__main__":
    # Run the async function
    asyncio.run(test_analyze()) 