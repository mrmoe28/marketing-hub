const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect errors
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    console.error('Stack:', error.stack);
  });

  try {
    console.log('Navigating to templates list page...');
    await page.goto('https://marketing-hub-five.vercel.app/templates', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Look for template links
    const templateLinks = await page.locator('a[href*="/templates/"][href*="/edit"]').all();

    console.log(`Found ${templateLinks.length} template edit links`);

    if (templateLinks.length > 0) {
      const firstLink = await templateLinks[0].getAttribute('href');
      console.log('First template edit URL:', firstLink);

      // Now test that template page
      console.log('\nNavigating to first template editor...');
      await page.goto('https://marketing-hub-five.vercel.app' + firstLink, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(5000);

      // Check for errors
      const errorText = await page.locator('text=Application error').count();
      if (errorText > 0) {
        console.log('ERROR: Application error message found!');
        const errorContent = await page.locator('body').textContent();
        console.log('Page content:', errorContent);
      } else {
        console.log('SUCCESS: No application error message found');
      }

      // Check if editor loaded
      const editorExists = await page.locator('.ProseMirror').count() > 0;
      console.log('Editor exists:', editorExists);

      // Take screenshot
      await page.screenshot({ path: 'template-editor-test.png', fullPage: true });
      console.log('Screenshot saved');
    } else {
      console.log('No templates found, taking screenshot of templates page...');
      await page.screenshot({ path: 'templates-list.png', fullPage: true });
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
