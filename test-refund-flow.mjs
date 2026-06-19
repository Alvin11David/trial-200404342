import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (cond, m) => { if (cond) { PASSED.push(m ?? cond); console.log("  \u2713 " + (m ?? cond)); } else { FAILED.push(m ?? cond); console.log("  \u2717 " + (m ?? cond)); } };
const no  = (m) => { FAILED.push(m); console.log("  \u2717 " + m); };

async function fillField(page, label, value) {
  const labelEl = page.locator("label").filter({ hasText: label }).first();
  const parent = labelEl.locator("..");
  const input = parent.locator("input, select").first();
  const tag = await input.evaluate((el) => el.tagName);
  if (tag === "SELECT") await input.selectOption(value);
  else await input.fill(value);
}

function parseUgx(text) {
  const cleaned = (text || "").replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

async function run() {
  if (!existsSync("test-screenshots")) mkdirSync("test-screenshots");
  const ss = (n) => page.screenshot({ path: "test-screenshots/" + n + ".png" }).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ===== 1. Login as Front Desk =====
    console.log("\n=== 1. Login as Front Desk ===");
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    // Select Front Desk role
    await page.locator("button:has-text('Owner / GM')").click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Front Desk')").click();
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    await ss("rf01-login");
    ok(true, "Logged in as Front Desk");

    // ===== 2. Billing =====
    console.log("\n=== 2. Billing ===");
    await page.goto(BASE + "/billing", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    await ss("rf02-billing");
    ok(await page.locator("table").isVisible(), "Folios table visible");

    // ===== 3. Open folio =====
    console.log("\n=== 3. Open folio ===");
    const table = page.locator("table");
    const targetRow = table.locator("tbody tr").filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");
    const guestName = (await targetRow.locator("td").nth(1).textContent()) || "";
    console.log("  Guest: " + guestName.trim());
    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("rf03-folio");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");
    // Capture the folio URL for later navigation
    const folioUrl = page.url();

    // ===== 4. Read balance =====
    console.log("\n=== 4. Balance ===");
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const initialBalance = parseUgx((await balanceLocator.textContent()) || "");
    console.log("  Balance: UGX " + initialBalance.toLocaleString());
    ok(initialBalance > 0, "Balance positive");

    // ===== 5. Record a cash payment =====
    console.log("\n=== 5. Record cash payment of 50,000 ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("cash");
    await payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill("50000");
    await payDialog.locator("label").filter({ hasText: "Amount tendered" }).locator("input").fill("50000");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("rf04-after-cash");

    const balanceAfterPay = parseUgx((await balanceLocator.textContent()) || "");
    ok(balanceAfterPay === initialBalance - 50000, "Balance decreased by 50,000");

    // ===== 6. Front Desk should NOT see Refund button =====
    console.log("\n=== 6. Refund button NOT visible for Front Desk ===");
    await page.waitForTimeout(500);
    const refundBtn = page.locator("button:has-text('Refund')");
    const refundCount = await refundBtn.count();
    ok(refundCount === 0, "Front Desk cannot see Refund button (authorisation enforced, found " + refundCount + ")");

    // ===== 7. Switch to Accountant role and reopen folio =====
    console.log("\n=== 7. Switch to Accountant role ===");
    await page.evaluate(() => { localStorage.setItem("jambo-role", "Accountant"); location.reload(); });
    await page.waitForLoadState("domcontentloaded", { timeout: 60000 });
    await page.waitForTimeout(3000);
    await ss("rf05-accountant-folio");
    ok(true, "Switched to Accountant role");

    const balanceLocator2 = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    ok(await balanceLocator2.isVisible(), "Accountant folio detail loaded");

    // ===== 8. Accountant sees Refund button =====
    console.log("\n=== 8. Accountant can see Refund button ===");
    const refundBtn2 = page.locator("button:has-text('Refund')");
    ok(await refundBtn2.isVisible(), "Accountant can see Refund button");

    // ===== 9. Process the refund =====
    console.log("\n=== 9. Process refund of 20,000 ===");
    await refundBtn2.click();
    await page.waitForTimeout(800);
    await ss("rf08-refund-dialog");

    ok(await page.locator(".fixed.inset-0.z-50").isVisible(), "Refund dialog opened");

    const refundDialog = page.locator(".fixed.inset-0.z-50");
    const refundAmountInput = refundDialog.locator("label").filter({ hasText: "Refund amount" }).locator("input");
    await refundAmountInput.fill("20000");

    await refundDialog.locator("label").filter({ hasText: "Reason" }).locator("textarea").fill("Guest overpaid — partial refund");
    await ss("rf09-refund-filled");

    await refundDialog.locator("button:has-text('Process refund')").click();
    await page.waitForTimeout(1500);
    await ss("rf10-after-refund");

    // ===== 10. Verify balance increased =====
    console.log("\n=== 10. Balance increased ===");
    const balanceAfterRefund = parseUgx((await balanceLocator2.textContent()) || "");
    const expectedAfterRefund = balanceAfterPay + 20000;
    ok(balanceAfterRefund === expectedAfterRefund,
      "Balance increased from UGX " + balanceAfterPay.toLocaleString() + " to UGX " + balanceAfterRefund.toLocaleString() + " (expected UGX " + expectedAfterRefund.toLocaleString() + ")");

    // ===== 11. Verify refund entry in payment list =====
    console.log("\n=== 11. Refund entry visible ===");
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyText = (await folioBody.textContent()) || "";
    ok(bodyText.includes("Refund"), "Refund label visible in payment list");
    ok(bodyText.includes("Cash") || bodyText.includes("cash"), "Original method shown in refund label");
    ok(bodyText.includes("20,000") || bodyText.includes("20000"), "Refund amount visible");
    ok(bodyText.includes("Guest overpaid"), "Refund reason visible");

    // ===== 12. Verify audit trail =====
    console.log("\n=== 12. Audit trail ===");
    await page.goto(BASE + "/audit", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    await ss("rf11-audit");

    const auditBody = (await page.locator("body").textContent()) || "";
    ok(auditBody.includes("Refund processed"), "Audit contains 'Refund processed' entry");
    ok(auditBody.includes("20,000") || auditBody.includes("20000"), "Audit contains refund amount");
    ok(auditBody.includes("cash") || auditBody.includes("Cash"), "Audit references original method");
    ok(auditBody.includes("Guest overpaid"), "Audit contains refund reason");

    // ===== 13. Verify original payment still has Refund button =====
    console.log("\n=== 13. Refund button on original payment ===");
    await page.goto(folioUrl, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    const refundBtns = await page.locator("button:has-text('Refund')").count();
    ok(refundBtns >= 1, "Refund button visible on original payment (found " + refundBtns + ")");

  } catch (err) {
    console.log("\n  ERROR: " + err.message);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("rf-error").catch(() => {});
    no(err.message);
  }

  console.log("\n" + "=".repeat(40));
  console.log("Passed: " + PASSED.length + "  Failed: " + FAILED.length);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
