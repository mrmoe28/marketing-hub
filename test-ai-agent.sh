#!/bin/bash

# Test script for AI Agent API endpoint
# Usage: ./test-ai-agent.sh

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="$BASE_URL/api/chat"

echo "Testing AI Agent API endpoint: $ENDPOINT"
echo "=========================================="
echo ""

# Test 1: Simple message without client data
echo "Test 1: Simple message (no client data)"
echo "----------------------------------------"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, can you help me?",
    "includeClientData": false
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

# Test 2: Message with client data
echo "Test 2: Message with client data"
echo "---------------------------------"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How many clients do I have?",
    "includeClientData": true
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

# Test 3: Missing message (should return 400)
echo "Test 3: Missing message (should return 400)"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "includeClientData": false
  }')

echo "$RESPONSE"
echo ""
echo ""

# Test 4: Check environment variables
echo "Test 4: Environment variables check"
echo "-----------------------------------"
ENV_RESPONSE=$(curl -s "$BASE_URL/api/debug-env")
echo "$ENV_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ENV_RESPONSE"
echo ""
echo ""

echo "=========================================="
echo "Testing complete!"
echo ""
echo "Note: If you see errors about 'does not support tools',"
echo "your model needs to support function calling for the AI agent to work."
echo "Models that support function calling:"
echo "  - OpenAI: gpt-3.5-turbo, gpt-4, gpt-4-turbo"
echo "  - Ollama: llama3.2, qwen2.5 (if configured with tool support)"
echo "  - Other OpenAI-compatible APIs with function calling support"

