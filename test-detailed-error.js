const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console messages with full details
  page.on('console', async msg => {
    const msgType = msg.type();
    const text = msg.text();
    const args = msg.args();

    console.log(`[${msgType.toUpperCase()}] ${text}`);

    // Try to get more details from args
    for (let i = 0; i < args.length; i++) {
      try {
        const value = await args[i].jsonValue();
        if (typeof value === 'object') {
          console.log(`  Arg ${i}:`, JSON.stringify(value, null, 2));
        }
      } catch (e) {
        // Ignore serialization errors
      }
    }
  });

  // Capture page errors with FULL stack trace
  page.on('pageerror', error => {
    console.error('\n========== PAGE ERROR ==========');
    console.error('Error Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:\n', error.stack);
    console.error('================================\n');
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.log(`❌ Request failed: ${request.url()}`);
    console.log(`   Failure: ${request.failure()?.errorText}`);
  });

  try {
    console.log('Navigating to editor page...\n');

    const response = await page.goto(
      'https://marketing-hub-five.vercel.app/templates/cmh6e2z130000n9emflu556jo/edit',
      { waitUntil: 'networkidle', timeout: 30000 }
    );

    console.log('Response status:', response.status());
    console.log('Waiting for errors to appear...\n');

    // Wait longer for errors
    await page.waitForTimeout(10000);

    const hasError = await page.locator('text=Application error').count() > 0;
    console.log('\nApplication error present:', hasError);

    const editorExists = await page.locator('.ProseMirror').count() > 0;
    console.log('Editor loaded:', editorExists);

    await page.screenshot({ path: 'final-error-capture.png', fullPage: true });

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
