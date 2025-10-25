const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect console messages
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
    console.error('Page Error:', error.message);
    console.error('Stack:', error.stack);
  });

  try {
    console.log('Navigating to production template editor...');
    await page.goto('https://marketing-hub-five.vercel.app/templates/cmh6ez2130000n9emflu556jo/edit', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded, waiting for potential errors...');
    await page.waitForTimeout(5000);

    // Try to find the editor
    const editorExists = await page.locator('.ProseMirror').count() > 0;
    console.log('Editor exists:', editorExists);

    // Check for error messages
    const errorText = await page.locator('text=Application error').count();
    if (errorText > 0) {
      console.log('ERROR: Application error message found on page');
    }

    // Take a screenshot
    await page.screenshot({ path: 'production-error-screenshot.png', fullPage: true });
    console.log('Screenshot saved to production-error-screenshot.png');

    console.log('\n=== Summary ===');
    console.log('Console messages:', consoleMessages.length);
    console.log('Errors:', errors.length);

    if (errors.length > 0) {
      console.log('\n=== Detailed Errors ===');
      errors.forEach((err, i) => {
        console.log(`\nError ${i + 1}:`);
        console.log('Message:', err.message);
        console.log('Stack:', err.stack);
      });
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
