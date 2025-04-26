import json
import re

def parse_gemini_response(response: str):
    try:
        # 1. Extract the text content from the response
        response_text = response
        
        # 2. Clean the response text
        # Remove markdown code block markers if present
        if response_text.startswith('```json'):
            json_str = response_text[7:-3].strip()  # Remove ```json and trailing ```
        elif response_text.startswith('```'):
            json_str = response_text[3:-3].strip()  # Remove ``` and trailing ```
        else:
            json_str = response_text.strip()
        
        print(json_str)
        # 3. Parse the JSON
        return json.loads(json_str)
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}. Content: {json_str}")
    except AttributeError as e:
        raise ValueError(f"Unexpected response format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to parse Gemini response: {str(e)}")
    
print(parse_gemini_response("""```json
{
  "dockerfile": "# Use an official Python runtime as a parent image\nFROM python:3.9-slim\n\n# Set the working directory in the container\nWORKDIR /app\n\n# Copy the current directory contents into the container at /app\nCOPY . /app/\n\n# Install any needed packages specified in requirements.txt\n# Assuming core dependencies are numpy (from README) and codecarbon (for tracking)\n# If a requirements.txt file exists, uncomment the following line and comment out the direct install:\n# COPY requirements.txt .\n# RUN pip install --no-cache-dir -r requirements.txt\nRUN pip install --no-cache-dir numpy codecarbon\n\n# Make port 80 available to the world outside this container (if needed, e.g., for a web interface - likely not needed for this script)\n# EXPOSE 80 \n\n# Define environment variables (if necessary)\n# ENV NAME World\n\n# Run main.py when the container launches\n# This command assumes main.py handles data loading/downloading and starts the training\nCMD [\"python\", \"main.py\"]",
  "codecarbon_integration": "To integrate CodeCarbon for tracking emissions during training, modify the main script (`main.py`) as follows:\n\n1.  **Import CodeCarbon:** Add this line at the beginning of your `main.py` file:\n    ```python\n    from codecarbon import track_emissions\n    ```\n\n2.  **Decorate the Training Function:** Identify the function where the main training loop occurs. If the training logic is directly in the main execution block (`if __name__ == \"__main__\":`), it's recommended to refactor it into a dedicated function.\n    Add the `@track_emissions` decorator directly above the definition of this main training function. For example:\n\n    ```python\n    # Example structure - adapt to your actual code\n    import numpy as np\n    # ... other imports ...\n    from codecarbon import track_emissions\n    from src.model import NeuralNetwork # Replace with actual imports\n    from src.utils import load_mnist # Replace with actual imports\n\n    @track_emissions\n    def train_mnist_model(epochs, batch_size, learning_rate):\n        print(\"Loading and preparing data...\")\n        # (X_train, y_train), (X_test, y_test) = load_mnist()\n        # ... data preprocessing ...\n        \n        print(\"Initializing model...\")\n        # model = NeuralNetwork(...) # Initialize your model\n        # optimizer = Adam(...) # Initialize your optimizer\n\n        print(f\"Starting training for {epochs} epochs...\")\n        # ... Your training loop here ...\n        # for epoch in range(epochs):\n        #     for batch in range(num_batches):\n        #         # ... get batch data ...\n        #         # ... forward pass ...\n        #         # ... backward pass ...\n        #         # ... update weights ...\n        #     print(f\"Epoch {epoch+1}/{epochs} completed.\")\n        \n        print(\"Training finished.\")\n        # ... evaluation steps ...\n        # return trained_model\n\n    if __name__ == \"__main__\":\n        # Define hyperparameters\n        EPOCHS = 5\n        BATCH_SIZE = 128\n        LEARNING_RATE = 0.001\n\n        # Run the decorated training function\n        train_mnist_model(epochs=EPOCHS, batch_size=BATCH_SIZE, learning_rate=LEARNING_RATE)\n        print(\"Script finished.\")\n    ```\n\n    Ensure you replace the placeholder comments and function calls with your actual data loading, preprocessing, model initialization, and training loop logic within the `train_mnist_model` function (or your equivalent function).",
  "run_command": "# 1. Build the Docker image (run this in the directory containing the Dockerfile and your project code)\n docker build -t mnist-numpy-carbon .\n\n# 2. Run the training script inside the container\n# This command starts the container, runs 'python main.py', and CodeCarbon will track emissions.\n# The container will be removed automatically after execution (--rm).\ndocker run --rm mnist-numpy-carbon"
}
```"""))