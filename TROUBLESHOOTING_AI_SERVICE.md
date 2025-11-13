# Troubleshooting AI Service Connection Errors

This document contains solutions for common AI service connection errors in the Marketing Hub application.

## Error: "Failed to connect to AI service. Please try again."

This is a generic error that can occur for several reasons. The application now provides more specific error messages based on the underlying issue.

### Common Causes and Solutions

#### 1. Missing API Key
**Error Message:** "AI service not configured. Please set OPENAI_API_KEY in your environment variables."

**Solution:**
- Ensure `OPENAI_API_KEY` is set in your environment variables
- For local development, add it to `.env.local`:
  ```
  OPENAI_API_KEY=sk-your-api-key-here
  ```
- For production (Vercel), add it in the Vercel dashboard under Settings > Environment Variables
- Restart your development server after adding the key

#### 2. Invalid API Key
**Error Message:** "Invalid API key. Please check your OPENAI_API_KEY environment variable."

**Solution:**
- Verify your API key is correct and hasn't expired
- Check that there are no extra spaces or quotes around the key
- Ensure you're using the correct API key for your OpenAI account
- If using a custom base URL, verify the key matches that service

#### 3. Network Connection Issues
**Error Message:** "Network error: Unable to reach AI service. Please check your internet connection and try again."

**Solution:**
- Check your internet connection
- Verify firewall settings aren't blocking the connection
- If using a custom `OPENAI_API_BASE_URL`, ensure it's correct and accessible
- Check for proxy settings that might interfere
- Try accessing the API endpoint directly to verify connectivity

#### 4. Rate Limiting
**Error Message:** "Rate limit exceeded. Please wait a moment and try again."

**Solution:**
- Wait a few minutes before retrying
- Check your OpenAI account usage limits
- Consider upgrading your plan if you frequently hit rate limits
- Implement request throttling if making many concurrent requests

#### 5. Service Unavailable
**Error Message:** "AI service is temporarily unavailable. Please try again in a moment."

**Solution:**
- This is usually a temporary issue with the AI service provider
- Wait a few minutes and try again
- Check the service status page for OpenAI/your provider
- If the issue persists, contact support

#### 6. Model Configuration Error
**Error Message:** "Invalid model configuration. Please check your AI service settings."

**Solution:**
- Verify the `MODEL_NAME` environment variable is set correctly
- Ensure the model name is valid for your API key (e.g., "gpt-3.5-turbo", "gpt-4")
- Check that your API key has access to the specified model
- Default model is "gpt-3.5-turbo" if not specified

#### 7. Custom Base URL Issues
**Error Message:** "Network error: Unable to connect to AI service. Please check your OPENAI_API_BASE_URL if using a custom endpoint."

**Solution:**
- Verify `OPENAI_API_BASE_URL` is correctly formatted (include protocol: `https://`)
- Ensure the endpoint is accessible and responding
- Check that the endpoint supports the OpenAI API format
- Test the endpoint with a simple curl request

### Debugging Steps

1. **Check Environment Variables:**
   - Visit `/api/debug-env` to see which API keys are configured
   - Verify keys are loaded correctly

2. **Check Server Logs:**
   - Look for detailed error messages in the console
   - In development, check the terminal where `npm run dev` is running
   - In production, check Vercel function logs

3. **Test API Connection:**
   - Use the debug endpoint: `GET /api/debug-env`
   - Check if the API key is present and has the correct prefix

4. **Verify API Key Format:**
   - OpenAI keys typically start with `sk-`
   - Ensure no extra whitespace or newlines
   - Check for typos

### Environment Variables Required

```bash
# Required for AI chat functionality
OPENAI_API_KEY=sk-your-key-here

# Optional: Custom model name (defaults to gpt-3.5-turbo)
MODEL_NAME=gpt-3.5-turbo

# Optional: Custom API endpoint (for OpenAI-compatible services)
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

### Testing the Connection

After fixing the issue, test by:
1. Opening the AI Agent chat (click the sparkles icon)
2. Asking a simple question like "How many clients do I have?"
3. Checking the error message for specific guidance

### Additional Notes

- The application uses the OpenAI SDK but can work with OpenAI-compatible APIs
- Error messages are now more specific to help diagnose issues
- In development mode, additional debug information is included in error responses
- All API errors are logged to the console with full details for debugging

### Related Files

- `src/app/api/chat/route.ts` - Main chat API route with error handling
- `src/lib/ai.ts` - AI service utilities
- `src/components/AgentChat.tsx` - Chat UI component

