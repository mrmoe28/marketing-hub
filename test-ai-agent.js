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

    // Take screenshot of initial page
    await page.screenshot({ path: 'screenshot-1-dashboard.png' });
    console.log('✓ Dashboard loaded - screenshot saved');

    console.log('2. Looking for SparkleIcon AI agent button...');

    // Wait for the button with Sparkles icon (the AI agent button)
    const agentButton = page.locator('button.fixed.bottom-6.right-6');
    await agentButton.waitFor({ timeout: 10000 });
    console.log('✓ SparkleIcon button found!');

    // Take screenshot showing the button
    await page.screenshot({ path: 'screenshot-2-button-visible.png' });

    console.log('3. Clicking the AI agent button...');
    await agentButton.click();
    await page.waitForTimeout(1000);

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✓ AI Agent dialog opened');

    // Take screenshot of opened dialog
    await page.screenshot({ path: 'screenshot-3-dialog-opened.png' });

    console.log('4. Typing question: "How many customers do I have?"');
    const input = page.locator('input[placeholder="Ask me anything..."]');
    await input.fill('How many customers do I have?');
    await page.screenshot({ path: 'screenshot-4-question-typed.png' });

    console.log('5. Sending message...');
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    console.log('6. Waiting for AI response...');
    // Wait for loading spinner to appear
    await page.waitForSelector('.animate-spin', { timeout: 5000 });
    console.log('✓ Message sent, waiting for response...');

    // Wait for loading spinner to disappear (response received)
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 30000 });
    console.log('✓ Response received!');

    // Take screenshot of response
    await page.screenshot({ path: 'screenshot-5-response-received.png' });

    // Get the AI response text
    const messages = await page.locator('.rounded-lg.p-3').allTextContents();
    console.log('\n=== CHAT MESSAGES ===');
    messages.forEach((msg, i) => {
      console.log(`Message ${i + 1}: ${msg}`);
    });
    console.log('===================\n');

    // Find the last assistant message
    const assistantMessages = await page.locator('.bg-muted .text-sm').allTextContents();
    if (assistantMessages.length > 0) {
      const lastResponse = assistantMessages[assistantMessages.length - 1];
      console.log('✓ AI Agent Response:', lastResponse);
    }

    console.log('\n✅ TEST SUCCESSFUL - AI Agent is working!');
    console.log('Screenshots saved:');
    console.log('  - screenshot-1-dashboard.png');
    console.log('  - screenshot-2-button-visible.png');
    console.log('  - screenshot-3-dialog-opened.png');
    console.log('  - screenshot-4-question-typed.png');
    console.log('  - screenshot-5-response-received.png');

    // Keep browser open for 5 seconds to see result
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'screenshot-error.png' });
    console.log('Error screenshot saved to screenshot-error.png');
  } finally {
    await browser.close();
  }
})();
