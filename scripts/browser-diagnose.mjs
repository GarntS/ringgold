import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const executablePath = execFileSync('bash', ['-lc', 'command -v chromium'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const messages = [];
page.on('console', (message) => messages.push(`console ${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => messages.push(`pageerror: ${error.stack || error.message}`));
page.on('worker', (worker) => {
  messages.push(`worker: ${worker.url()}`);
  worker.on('console', (message) => messages.push(`worker console ${message.type()}: ${message.text()}`));
});
page.on('requestfailed', (request) => messages.push(`request failed: ${request.url()} (${request.failure()?.errorText})`));
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
const capabilities = await page.evaluate(() => ({
  secureContext: window.isSecureContext,
  crossOriginIsolated: window.crossOriginIsolated,
  sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  serviceWorkerControlled: !!navigator.serviceWorker?.controller,
}));
await page.locator('#find-solution').click();
await page.waitForTimeout(3_000);
console.log(JSON.stringify({ capabilities, status: await page.locator('#solution').innerText(), messages }, null, 2));
await browser.close();
