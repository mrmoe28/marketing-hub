const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://marketing-nozrpmbal-ekoapps.vercel.app';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR]:`, error.message);
  });

  // Listen to network responses
  page.on('response', async response => {
    if (response.url().includes('/api/chat')) {
      console.log(`[API RESPONSE] /api/chat - Status: ${response.status()}`);
      try {
        const body = await response.json();
        console.log('[API RESPONSE BODY]:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('[API RESPONSE] Could not parse JSON');
      }
    }
  });

  try {
    console.log('=== TESTING PRODUCTION DEPLOYMENT ===');
    console.log('URL:', PRODUCTION_URL);
    console.log('');

    console.log('1. Navigating to production dashboard...');
    await page.goto(PRODUCTION_URL + '/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'prod-screenshot-1-dashboard.png', fullPage: true });
    console.log('✓ Production dashboard loaded - screenshot saved');

    console.log('2. Looking for SparkleIcon AI agent button...');

    // Check if button exists
    const agentButton = page.locator('button.fixed.bottom-6.right-6');
    const buttonCount = await agentButton.count();

    if (buttonCount === 0) {
      console.error('❌ SparkleIcon button NOT FOUND on production!');
      await page.screenshot({ path: 'prod-screenshot-error-no-button.png', fullPage: true });
      console.log('Error screenshot saved');

      // Check if AgentChat component is in the DOM at all
      const agentChatExists = await page.locator('[role="dialog"]').count();
      console.log('Dialog count in DOM:', agentChatExists);

      // Check for any fixed buttons
      const fixedButtons = await page.locator('button.fixed').count();
      console.log('Fixed buttons found:', fixedButtons);

    } else {
      console.log(`✓ SparkleIcon button found! (count: ${buttonCount})`);
      await page.screenshot({ path: 'prod-screenshot-2-button-visible.png', fullPage: true });

      console.log('3. Clicking the AI agent button...');
      await agentButton.click();
      await page.waitForTimeout(2000);

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      console.log('✓ AI Agent dialog opened');
      await page.screenshot({ path: 'prod-screenshot-3-dialog-opened.png', fullPage: true });

      console.log('4. Enabling "Include my client data in context" toggle...');
      const dataToggle = page.locator('button[role="switch"]');
      await dataToggle.click();
      await page.waitForTimeout(500);
      console.log('✓ Client data toggle enabled');

      console.log('5. Typing question: "How many customers do I have?"');
      const input = page.locator('input[placeholder="Ask me anything..."]');
      await input.fill('How many customers do I have?');
      await page.screenshot({ path: 'prod-screenshot-4-question-typed.png' });

      console.log('6. Sending message to PRODUCTION API...');
      const sendButton = page.locator('button[type="submit"]');
      await sendButton.click();

      console.log('7. Waiting for AI response from production...');
      await page.waitForSelector('.animate-spin', { timeout: 5000 });
      console.log('✓ Message sent, AI is processing...');

      // Wait for loading spinner to disappear (response received)
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 45000 });
      console.log('✓ Response received!');

      await page.screenshot({ path: 'prod-screenshot-5-response-received.png', fullPage: true });

      // Get the AI response text
      const assistantMessages = await page.locator('.bg-muted .text-sm').allTextContents();
      if (assistantMessages.length > 0) {
        const lastResponse = assistantMessages[assistantMessages.length - 1];
        console.log('\n=== AI AGENT RESPONSE (PRODUCTION) ===');
        console.log(lastResponse);
        console.log('======================================\n');
      }

      console.log('\n✅ PRODUCTION TEST SUCCESSFUL!');
      console.log('Screenshots saved with "prod-" prefix');
    }

    // Keep browser open for 10 seconds to review
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ PRODUCTION TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: 'prod-screenshot-error.png', fullPage: true });
    console.log('Error screenshot saved to prod-screenshot-error.png');
  } finally {
    await browser.close();
  }
})();
