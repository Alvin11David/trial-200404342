import { chromium } from "playwright";

const BASE = "http://localhost:8083";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  console.log("=== Login ===");
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const labels = page.locator("label");
  const emailLabel = labels.filter({ hasText: "Email address" }).first();
  const emailInput = emailLabel.locator("..").locator("input").first();
  await emailInput.fill("frontdesk@jambo.com");
  
  const passLabel = labels.filter({ hasText: "Password" }).first();
  const passInput = passLabel.locator("..").locator("input").first();
  await passInput.fill("front123");
  
  await page.locator("button:has-text('Sign in')").click();
  await page.waitForTimeout(2000);
  
  const bodyText = await page.locator("body").textContent();
  console.log("After login (first 600 chars):", bodyText.substring(0, 600));
  
  console.log("\n=== Navigate to billing ===");
  await page.goto(BASE + "/billing", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2000);

  const billingText = await page.locator("body").textContent();
  console.log("Billing page (first 600 chars):", billingText.substring(0, 600));
  
  const table = page.locator("table");
  console.log("Table visible:", await table.isVisible());
  
  await browser.close();
}

run().catch((e) => { console.error("Error:", e.message); process.exit(1); });
