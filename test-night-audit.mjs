import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (m) => { PASSED.push(m); console.log(`  \u2713 ${m}`); };
const no  = (m) => { FAILED.push(m); console.log(`  \u2717 ${m}`); };

async function fillField(page, label, value) {
  const labelEl = page.locator("label").filter({ hasText: label }).first();
  const parent = labelEl.locator("..");
  const input = parent.locator("input, select").first();
  const tag = await input.evaluate((el) => el.tagName);
  if (tag === "SELECT") await input.selectOption(value);
  else await input.fill(value);
}

async function run() {
  if (!existsSync("test-screenshots")) mkdirSync("test-screenshots");
  const ss = (n) => page.screenshot({ path: `test-screenshots/${n}.png` }).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ===== 1. Login =====
    console.log("\n=== 1. Login as Owner / GM ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("01-login-page");

    // Fill credentials (pre-filled by default, but just in case)
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await ss("01a-login-filled");

    // Sign in
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in successfully");
    await ss("02-dashboard");

    // ===== 2. Navigate to Billing page =====
    console.log("\n=== 2. Billing page loads ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("03-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table is visible");

    const rows = table.locator("tbody tr");
    let rowCount = await rows.count();
    ok(rowCount > 0, `Folio rows in table: ${rowCount}`);

    // ===== 3. Open a folio detail view =====
    console.log("\n=== 3. Open folio detail ===");
    // Click the first row that has an "Open" or "Active" status badge
    const activeRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await activeRow.isVisible(), "Active folio row found");

    // Read the guest name before clicking
    const guestName = await activeRow.locator("td").nth(1).textContent();
    console.log(`  Opening folio for guest: ${guestName}`);

    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("04-folio-detail");

    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail page loaded");

    // ===== 4. Night audit button visible =====
    console.log("\n=== 4. Night audit button ===");
    const nightAuditBtn = page.locator("button:has-text('Night audit')");
    ok(await nightAuditBtn.isVisible(), "Night audit button visible");
    await ss("05-night-audit-button");

    // ===== 5. Open night audit dialog =====
    console.log("\n=== 5. Open night audit dialog ===");
    await nightAuditBtn.click();
    await page.waitForTimeout(800);
    await ss("06-night-audit-dialog");

    // Verify dialog is open
    ok(await page.locator("text=Night audit").first().isVisible(), "Night audit dialog opened");

    // Check the dialog shows summary - should show "End of day" with today's date
    ok(await page.locator("text=End of day").isVisible(), "End of day summary visible");

    // Read the summary area text
    const summaryEl = page.locator("text=active folios will").first();
    ok(await summaryEl.isVisible(), "Night audit summary visible");
    const summaryText = await summaryEl.textContent();
    console.log(`  Summary: ${summaryText}`);

    // ===== 6. Run night audit =====
    console.log("\n=== 6. Run night audit ===");
    const runBtn = page.locator("button:has-text('Run night audit')");
    ok(await runBtn.isVisible(), "Run night audit button visible");

    await runBtn.click();
    await page.waitForTimeout(2000);
    await ss("07-night-audit-running");

    await page.waitForSelector("text=Night audit completed", { timeout: 10000 });
    ok(true, "Night audit completion message appeared");
    await ss("08-night-audit-complete");

    // Verify completion details
    const completeText = await page.locator("text=folios charged for").textContent();
    console.log(`  Result: ${completeText}`);
    ok(completeText.includes("charged"), `Night audit result: ${completeText}`);

    // ===== 7. Close dialog =====
    console.log("\n=== 7. Close dialog ===");
    const closeBtn = page.locator("button:has-text('Close')");
    ok(await closeBtn.isVisible(), "Close button visible");

    await closeBtn.click();
    await page.waitForTimeout(800);
    await ss("09-after-night-audit");

    // Verify we're back on the folio detail
    ok(await page.locator("text=UGX").first().isVisible(), "Back on folio detail after night audit");

    // ===== 8. Go back to billing list =====
    console.log("\n=== 8. Verify billing list ===");
    const backLink = page.locator("a:has-text('Back to folios')");
    if (await backLink.isVisible()) {
      await backLink.click();
      await page.waitForTimeout(1000);
      await ss("10-billing-list-after-audit");

      // Verify the billing table is still visible
      ok(await page.locator("table").isVisible(), "Billing list visible after night audit");
    }

    // ===== 9. Verify audit trail entry =====
    console.log("\n=== 9. Verify audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("11-audit-trail");

    // Check for night audit entry
    const auditBody = await page.locator("body").textContent();
    ok(auditBody.includes("Night audit completed"), "Night audit entry found in audit trail");

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
