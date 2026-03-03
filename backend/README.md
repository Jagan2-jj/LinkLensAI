# Backend Setup for AI Agent

This backend provides the AI assistant endpoint for the LinkedIn Profile Analyzer frontend.

## 1. Environment Variables

Create a `.env` file in this directory with the following content:

```
OPENAI_API_KEY=your_openai_api_key_here
```

- Get your OpenAI API key from https://platform.openai.com/account/api-keys
- Never commit your real `.env` file to version control.

## 2. Install Dependencies

```
npm install
```

## 3. Run the Backend Server

```
node server.js
```

The backend will start on [http://localhost:3001](http://localhost:3001).

## 4. Test the AI Agent

- Use the AI Agent widget in the frontend.
- If you see errors, check the backend terminal for missing API key or other issues.

---

For any issues, ensure your `.env` file is present and the backend is running on the correct port. 