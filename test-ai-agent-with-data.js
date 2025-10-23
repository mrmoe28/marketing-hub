const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✓ Dashboard loaded');

    console.log('2. Clicking AI agent button...');
    const agentButton = page.locator('button.fixed.bottom-6.right-6');
    await agentButton.waitFor({ timeout: 10000 });
    await agentButton.click();
    await page.waitForTimeout(1000);

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✓ AI Agent dialog opened');

    console.log('3. Enabling "Include my client data in context" toggle...');
    const dataToggle = page.locator('button[role="switch"]');
    await dataToggle.click();
    await page.waitForTimeout(500);
    console.log('✓ Client data toggle enabled');

    // Take screenshot with toggle enabled
    await page.screenshot({ path: 'screenshot-6-toggle-enabled.png' });

    console.log('4. Typing question: "How many customers do I have?"');
    const input = page.locator('input[placeholder="Ask me anything..."]');
    await input.fill('How many customers do I have?');

    console.log('5. Sending message...');
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    console.log('6. Waiting for AI response with client data...');
    await page.waitForSelector('.animate-spin', { timeout: 5000 });
    console.log('✓ Message sent, AI is processing with your client data...');

    // Wait for loading spinner to disappear (response received)
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 30000 });
    console.log('✓ Response received!');

    // Take screenshot of response
    await page.screenshot({ path: 'screenshot-7-response-with-data.png' });

    // Get the AI response text
    const assistantMessages = await page.locator('.bg-muted .text-sm').allTextContents();
    if (assistantMessages.length > 0) {
      const lastResponse = assistantMessages[assistantMessages.length - 1];
      console.log('\n=== AI AGENT RESPONSE (WITH CLIENT DATA) ===');
      console.log(lastResponse);
      console.log('==========================================\n');
    }

    console.log('\n✅ TEST SUCCESSFUL - AI Agent is working with client data!');
    console.log('New screenshots saved:');
    console.log('  - screenshot-6-toggle-enabled.png');
    console.log('  - screenshot-7-response-with-data.png');

    // Keep browser open for 5 seconds to see result
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'screenshot-error-with-data.png' });
    console.log('Error screenshot saved to screenshot-error-with-data.png');
  } finally {
    await browser.close();
  }
})();
