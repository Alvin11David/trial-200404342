import { chromium } from "playwright";

const BASE = "http://localhost:8080";

async function fillField(page, label, value) {
  const labelEl = page.locator("label").filter({ hasText: label }).first();
  const parent = labelEl.locator("..");
  const input = parent.locator("input, select").first();
  const tag = await input.evaluate((el) => el.tagName);
  if (tag === "SELECT") await input.selectOption(value);
  else await input.fill(value);
}

async function checkLocalStorage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  await fillField(page, "Email address", "admin@jambo.com");
  await fillField(page, "Password", "admin123");
  await page.locator("button:has-text('Sign in')").click();
  await page.waitForTimeout(2000);

  // Check all localStorage keys
  const keys = await page.evaluate(() => Object.keys(localStorage));
  console.log("localStorage keys:", keys);

  for (const key of keys) {
    const val = await page.evaluate((k) => {
      const v = localStorage.getItem(k);
      try { return JSON.parse(v); } catch { return v; }
    }, key);
    if (key === "jambo-pms-cache") {
      console.log(`${key}: charges=${val?.charges?.length ?? 0}, payments=${val?.payments?.length ?? 0}, folios=${val?.folios?.length ?? 0}`);
      if (val?.charges?.length > 0) {
        console.log("Sample charge:", JSON.stringify(val.charges[0], null, 2));
      }
    } else if (typeof val === "object") {
      console.log(`${key}: [object]`);
    } else {
      console.log(`${key}: ${String(val).substring(0, 100)}`);
    }
  }

  await browser.close();
}

checkLocalStorage().catch(console.error);
