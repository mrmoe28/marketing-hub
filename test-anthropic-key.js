// Test script to verify Anthropic API key
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

async function testApiKey() {
  console.log('Testing Anthropic API key...');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    process.exit(1);
  }

  console.log(`✓ API Key found: ${apiKey.substring(0, 15)}...`);

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    console.log('Attempting to call Claude API...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "API key is working" in exactly those words.'
        }
      ]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('\n✅ SUCCESS! API Response:');
    console.log(text);
    console.log('\n✓ The Anthropic API key is valid and working!');

  } catch (error) {
    console.error('\n❌ API KEY TEST FAILED');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);

    if (error.status) {
      console.error('HTTP Status:', error.status);
    }

    if (error.message.includes('401') || error.message.includes('authentication')) {
      console.error('\n⚠️  API key is INVALID or EXPIRED');
      console.error('You need a fresh API key from: https://console.anthropic.com/settings/keys');
    } else if (error.message.includes('404') || error.message.includes('model')) {
      console.error('\n⚠️  Model name is invalid');
    } else {
      console.error('\n⚠️  Other error - check network/firewall');
    }

    process.exit(1);
  }
}

testApiKey();
