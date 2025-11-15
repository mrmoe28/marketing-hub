# AI Service Implementation & Error Handling

## API Error Investigation (Nov 15, 2025)

### Current Errors
- **404 Error**: Resource not found (unspecified resource)
- **500 Error**: `/api/chat` endpoint failure

### Root Cause Analysis

#### 500 Error - Chat API Failure
**Issue**: Incorrect API key configuration
- The `.env` file contains a Qwen API key: `sk-qwen-d55c4faade314eb4adac1404f0519a8cc1c439695493780ae06e9b54b117db1b`
- The application expects an OpenAI API key or OpenAI-compatible endpoint
- No `OPENAI_API_BASE_URL` is configured to redirect to Qwen's endpoint

**Solution Options**:
1. **For Qwen API**: Add `OPENAI_API_BASE_URL` pointing to Qwen's OpenAI-compatible endpoint
2. **For OpenAI**: Replace with valid OpenAI API key (sk-proj-... or sk-...)
3. **For Local Models**: Configure Ollama/LM Studio endpoint

#### 404 Error - Missing Resource
Needs browser console inspection to identify exact missing resource URL

## Current Implementation (as of Nov 13, 2025)

### AI Service Architecture
The application uses **OpenAI SDK** with support for OpenAI-compatible endpoints, allowing flexibility to use various AI providers.

**Current Setup:**
- Primary API: `/api/chat` - Uses OpenAI SDK (src/app/api/chat/route.ts:3)
- Compatible with: OpenAI, local models (Ollama), and other OpenAI-compatible services
- Configuration via environment variables (see below)

### Environment Configuration

**Required:**
```bash
OPENAI_API_KEY=sk-your-key-here  # Or compatible service key
```

**Optional:**
```bash
MODEL_NAME=gpt-3.5-turbo           # Default model if not specified
OPENAI_API_BASE_URL=http://localhost:11434/v1  # For custom endpoints (e.g., Ollama)
```

### Recent Model Testing
Tested with local models via Ollama:
- ✅ qwen2.5-coder:7b (with tool support)
- ✅ gemma3:1b
- Testing via ngrok tunnels for remote access

### Error Handling Improvements (Commit: 6011dbc)

Enhanced error handling with **specific error messages** for better debugging:

**Error Types Handled:**
1. **Missing API Key** - "AI service not configured. Please set OPENAI_API_KEY..."
2. **Invalid API Key** - "Invalid API key. Please check your OPENAI_API_KEY..." (401)
3. **Rate Limiting** - "Rate limit exceeded. Please wait a moment..." (429)
4. **Service Unavailable** - "AI service is temporarily unavailable..." (500/502/503)
5. **Network Errors** - "Network error: Unable to connect to AI service..." (ECONNREFUSED)
6. **Timeout Errors** - "Request timed out. The AI service is taking too long..."
7. **Model Configuration** - "Invalid model configuration. Please check your AI service settings."

**Implementation Details:**
- Status code detection for specific error types (src/app/api/chat/route.ts:395-424)
- Enhanced error messages in catch block (src/app/api/chat/route.ts:549-587)
- Debug information in development mode only
- Comprehensive console logging for troubleshooting

### Troubleshooting Documentation

Created comprehensive troubleshooting guide: **TROUBLESHOOTING_AI_SERVICE.md**
- Common error scenarios and solutions
- Environment variable setup guide
- Debugging steps and testing procedures
- Custom endpoint configuration

### Tool Support

**Function Calling Capabilities:**
- Legacy tools: Email templates, company profile, booking page
- Agent tools: Campaign management, client search, booking management (via agentTools)
- OpenAI function calling format (converted from Anthropic tool format)
- Automatic tool execution with multi-turn conversation support

### Future Considerations

The codebase includes Anthropic SDK references in .env.example, suggesting potential future migration or multi-provider support. Current implementation prioritizes OpenAI compatibility for broader model support (including local/self-hosted options).

## Related Files
- `src/app/api/chat/route.ts` - Main chat API with error handling
- `src/lib/ai.ts` - AI service utilities
- `src/lib/agent-tools.ts` - Tool definitions and execution
- `TROUBLESHOOTING_AI_SERVICE.md` - Detailed troubleshooting guide
- `.env.example` - Environment variable templates