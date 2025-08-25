const { chromium } = require('@playwright/test');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', (msg) => {
        try {
            console.log('[BROWSER]', msg.type(), msg.text());
        } catch (e) {
            console.log('[BROWSER] console event error', e);
        }
    });
    page.on('pageerror', (err) => {
        console.log('[BROWSER][pageerror]', err.toString());
    });

    const url =
        'http://localhost:6007/iframe.html?id=components-floatingsyncbutton--default';
    console.log('Visiting', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // wait a short time for logs
    await page.waitForTimeout(2000);
    await browser.close();
})();
