# Nutrivision

Nutrivision is a demo application that combines a Flask backend with a React frontend to provide AI assisted meal planning and nutrition tracking. The project integrates Azure OpenAI for natural language features and recipe image generation.

## Features
- Recipe generation with ingredient validation
- Menstrual cycle tracking and personalized recommendations
- Intelligent meal suggestions and nutrition plans
- Daily meal logging
- Azure OpenAI integration for GPT and DALL·E capabilities

## Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows use venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set required environment variables:
   ```bash
   export AZURE_OPENAI_KEY=your-key
   export AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
   export AZURE_OPENAI_DEPLOYMENT=your-deployment
   export AZURE_OPENAI_API_VERSION=2024-12-01-preview
   ```
   If the OpenAI Python package or network access is not available, the
   backend will automatically fall back to mock responses so the demo can
   still run offline.
5. Start the Flask server:
   ```bash
   flask --app app.py run
   ```
   The backend listens on port `5001` by default.

## Frontend Setup
1. In a new terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   The required `@tailwindcss/postcss` plugin is already listed in
   `package.json` and will be installed automatically.
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend runs on `http://localhost:3000` and proxies API calls to the backend.

## Running Backend and Frontend Together
Run the backend and frontend commands in separate terminals so both servers stay active. With both processes running you can visit `http://localhost:3000` to use the application while the backend at `http://localhost:5001` handles the API requests.

