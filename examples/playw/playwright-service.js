import { chromium, firefox, webkit } from 'playwright';

export function createPlaywrightService() {
  let browser = null;
  let context = null;
  let page = null;

  // Set a global timeout of 5 seconds
  const globalTimeout = 5000;

  async function openBrowser({ browserType, headless = false }) {
    if (browser) {
      return 'Browser is already open.';
    }
    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch({
          headless: false,
          timeout: globalTimeout,
        });
        break;
      case 'firefox':
        browser = await firefox.launch({
          headless: false,
          timeout: globalTimeout,
        });
        break;
      case 'webkit':
        browser = await webkit.launch({
          headless: false,
          timeout: globalTimeout,
        });
        break;
      default:
        throw new Error(`Unsupported browser type: ${browserType}`);
    }
    context = await browser.newContext();
    page = await context.newPage();
    return 'Browser opened successfully.';
  }

  async function closeBrowser() {
    if (browser) {
      await browser.close();
      browser = null;
      context = null;
      page = null;
      return 'Browser closed successfully.';
    } else {
      return 'No browser is currently open.';
    }
  }

  async function navigateToUrl({ url }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }

    // Navigate to the URL with a timeout
    await page.goto(url, { timeout: globalTimeout });

    return `Navigated to ${url}`;
  }

  async function searchElement({ selector }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }
    // Use Locator instead of ElementHandle
    const locator = page.locator(selector);

    // Wait for the element to appear in the DOM
    await locator.waitFor({ state: 'visible', timeout: globalTimeout });

    return locator;
  }

  async function clickElement({ selector }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }

    // Use Locator to find and interact with the element
    const locator = page.locator(selector);

    // Wait for the element to be visible and ready for interaction
    await locator.waitFor({ state: 'visible', timeout: globalTimeout });

    // Click the element
    await locator.click();

    return `Clicked element with selector "${selector}"`;
  }

  async function fillInput({ selector, text }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }

    // Use Locator instead of direct page.fill()
    const locator = page.locator(selector);

    // Wait for the element to be visible and interactable
    await locator.waitFor({ state: 'visible', timeout: globalTimeout });

    // Fill the input field
    await locator.fill(text);

    return `Filled input "${selector}" with text "${text}"`;
  }

  async function getText({ selector }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }

    // Use Locator to get text content
    const locator = page.locator(selector);

    // Wait for the element to be visible
    await locator.waitFor({ state: 'visible', timeout: globalTimeout });

    // Retrieve text content
    const textContent = await locator.textContent();

    return textContent;
  }

  async function screenshot({ selector, path }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }

    // Use Locator to take a screenshot of a specific element
    const locator = page.locator(selector);

    // Wait for the element to be visible
    await locator.waitFor({ state: 'visible', timeout: globalTimeout });

    // Take the screenshot
    await locator.screenshot({ path });

    // Read the file and return the base64 encoded string
    const img_data = fs.readFileSync(path).toString('base64');
    return img_data;
  }

  async function getHtml({ selector }) {
    if (!page) {
      throw new Error('Browser is not open.');
    }

    // Use Locator to get the HTML content of an element
    const locator = page.locator(selector);

    // Wait for the element to be visible
    await locator.waitFor({ state: 'visible', timeout: globalTimeout });

    // Retrieve the HTML content
    const htmlContent = await locator.innerHTML();

    return htmlContent;
  }

  return {
    openBrowser,
    closeBrowser,
    navigateToUrl,
    searchElement,
    clickElement,
    fillInput,
    getText,
    screenshot,
    getHtml,
  };
}
