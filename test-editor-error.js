const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all errors
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleMessages.push(message);

    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
    console.error('\n=== PAGE ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  });

  try {
    console.log('1. Navigating to templates page...');
    await page.goto('https://marketing-hub-five.vercel.app/templates', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('2. Looking for Edit button...');
    await page.waitForTimeout(2000);

    // Click the first Edit button
    const editButton = page.getByRole('button', { name: 'Edit' }).first();
    const editButtonExists = await editButton.count() > 0;

    if (editButtonExists) {
      console.log('3. Clicking Edit button...');
      await editButton.click();

      console.log('4. Waiting for editor page to load...');
      await page.waitForTimeout(5000);

      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      // Check for application error
      const appErrorExists = await page.locator('text=Application error').count() > 0;
      if (appErrorExists) {
        console.log('\n❌ APPLICATION ERROR DETECTED!');
        const errorText = await page.locator('body').textContent();
        console.log('Error details:', errorText);
      } else {
        console.log('\n✅ No application error message');
      }

      // Check if editor loaded
      const editorExists = await page.locator('.ProseMirror').count() > 0;
      console.log('Editor (.ProseMirror) exists:', editorExists);

      // Wait a bit more for any delayed errors
      console.log('\n5. Waiting for delayed errors...');
      await page.waitForTimeout(3000);

      // Take screenshot
      await page.screenshot({ path: 'editor-page.png', fullPage: true });
      console.log('Screenshot saved to editor-page.png');

      console.log('\n=== SUMMARY ===');
      console.log('Total console messages:', consoleMessages.length);
      console.log('Console errors:', consoleMessages.filter(m => m.type === 'error').length);
      console.log('Page errors:', pageErrors.length);

      if (consoleMessages.filter(m => m.type === 'error').length > 0) {
        console.log('\n=== CONSOLE ERRORS ===');
        consoleMessages.filter(m => m.type === 'error').forEach((msg, i) => {
          console.log(`\nConsole Error ${i + 1}:`);
          console.log('Text:', msg.text);
          console.log('Location:', msg.location);
        });
      }

      if (pageErrors.length > 0) {
        console.log('\n=== PAGE ERRORS ===');
        pageErrors.forEach((err, i) => {
          console.log(`\nPage Error ${i + 1}:`);
          console.log('Message:', err.message);
          console.log('Stack:', err.stack);
        });
      }

    } else {
      console.log('❌ No Edit button found');
      await page.screenshot({ path: 'no-edit-button.png', fullPage: true });
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-failure.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
