# Fix for API Chat 500 Error

## Issue
The `/api/chat` endpoint is returning a 500 error because the `OPENAI_API_KEY` environment variable is not configured.

## Root Cause
- The chat API at `src/app/api/chat/route.ts` requires an OpenAI API key
- The key is checked at line 213: `const apiKey = process.env.OPENAI_API_KEY;`
- If missing, it returns a 500 error with message "AI service not configured"

## Solution
Create a `.env` file with the required OpenAI API key configuration.

## Status
- ✅ Issue identified: Missing OPENAI_API_KEY
- ✅ Created .env file with proper configuration
- ✅ Added OPENAI_API_KEY placeholder to .env file

## Next Steps
The user needs to:
1. Add a valid OpenAI API key to the `.env` file (replace "sk-..." with actual key)
2. Restart the development server for the environment variables to take effect