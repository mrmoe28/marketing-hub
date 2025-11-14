import { chromium } from 'playwright';

async function testAIAgent() {
  console.log('🚀 Starting AI Agent test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log('📋 Console:', text);
  });

  // Collect console errors
  page.on('pageerror', (error) => {
    const errorText = `[ERROR] ${error.message}`;
    consoleMessages.push(errorText);
    console.log('❌ Error:', errorText);
  });

  try {
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded\n');

    // Wait for the AI Agent button (sparkles icon in bottom right)
    console.log('🔍 Looking for AI Agent button...');
    await page.waitForSelector('button.fixed.bottom-6.right-6', { timeout: 10000 });
    console.log('✅ Found AI Agent button\n');

    // Click the AI Agent button
    console.log('👆 Clicking AI Agent button...');
    await page.click('button.fixed.bottom-6.right-6');
    await page.waitForTimeout(1000);
    console.log('✅ AI Agent dialog opened\n');

    // Wait for the input field
    console.log('🔍 Looking for chat input...');
    await page.waitForSelector('input[placeholder*="Ask me anything"]', { timeout: 5000 });
    console.log('✅ Found chat input\n');

    // Type the query
    const query = 'how many customers do i have';
    console.log(`⌨️  Typing query: "${query}"...`);
    await page.fill('input[placeholder*="Ask me anything"]', query);
    await page.waitForTimeout(500);
    console.log('✅ Query typed\n');

    // Submit the query
    console.log('📤 Submitting query...');
    await page.click('button[type="submit"]');
    console.log('✅ Query submitted\n');

    // Wait for loading to complete (up to 30 seconds)
    console.log('⏳ Waiting for AI response...');
    await page.waitForSelector('.animate-spin', { timeout: 5000 }).catch(() => {
      console.log('⚠️  No loading indicator found (might have loaded instantly)');
    });

    // Wait for loading to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 30000 }).catch(() => {
      console.log('⚠️  Loading indicator still present after 30s');
    });

    // Wait a bit more for the response to render
    await page.waitForTimeout(2000);

    // Get the assistant's response
    console.log('📖 Reading AI response...');
    const messages = await page.$$eval('.rounded-lg.p-3', (elements) =>
      elements.map(el => ({
        text: el.textContent?.trim() || '',
        isAssistant: el.classList.contains('bg-muted')
      }))
    );

    const assistantMessages = messages.filter(m => m.isAssistant);
    if (assistantMessages.length > 0) {
      console.log('\n🤖 AI Agent Response:');
      console.log('─'.repeat(60));
      console.log(assistantMessages[assistantMessages.length - 1].text);
      console.log('─'.repeat(60));
    } else {
      console.log('⚠️  No assistant response found');
    }

    // Take a screenshot
    await page.screenshot({ path: 'ai-agent-test-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: ai-agent-test-result.png');

    // Summary
    console.log('\n📊 Console Summary:');
    console.log('─'.repeat(60));
    const errors = consoleMessages.filter(m => m.includes('[error]') || m.includes('[ERROR]'));
    const warnings = consoleMessages.filter(m => m.includes('[warning]'));

    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings found:');
      warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    console.log('\n✅ Test completed successfully!');

    // Keep browser open for inspection
    console.log('\n👁️  Browser will remain open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'ai-agent-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: ai-agent-test-error.png');
  } finally {
    await browser.close();
  }
}

testAIAgent();
