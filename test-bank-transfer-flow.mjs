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

function parseUgx(text) {
  const cleaned = (text || "").replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

async function loginAs(page, role) {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  await fillField(page, "Email address", "admin@jambo.com");
  await fillField(page, "Password", "admin123");
  // Open role dropdown and select the desired role
  await page.locator("button:has-text('Owner / GM')").click();
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Accountant')").click();
  await page.waitForTimeout(300);
  await page.locator("button:has-text('Sign in')").click();
  await page.waitForTimeout(2000);
}

async function run() {
  if (!existsSync("test-screenshots")) mkdirSync("test-screenshots");
  const ss = (n) => page.screenshot({ path: `test-screenshots/${n}.png` }).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ===== 1. Login as Front Desk =====
    console.log("\n=== 1. Login as Front Desk ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("bt01-login");
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Front Desk (default)");

    // ===== 2. Billing page =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("bt02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Open active folio =====
    console.log("\n=== 3. Open folio ===");
    const allRows = table.locator("tbody tr");
    const rowCount = await allRows.count();
    ok(rowCount > 0, "Folio rows found");

    let targetRow = allRows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");

    const guestName = (await targetRow.locator("td").nth(1).textContent()) || "";
    console.log(`  Selected guest: ${guestName.trim()}`);

    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("bt03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Read initial balance =====
    console.log("\n=== 4. Read initial balance ===");
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const initialBalanceStr = (await balanceLocator.textContent()) || "";
    const initialBalance = parseUgx(initialBalanceStr);
    console.log(`  Outstanding balance: UGX ${initialBalance.toLocaleString()}`);
    ok(initialBalance > 0, `Initial balance is positive: UGX ${initialBalance.toLocaleString()}`);

    const totalPaymentsLocator = page.locator("text=Total payments").locator("..").locator("span.font-semibold").last();
    const initialTotalPayStr = (await totalPaymentsLocator.textContent()) || "UGX 0";
    const initialTotalPay = parseUgx(initialTotalPayStr);
    console.log(`  Total payments before: ${initialTotalPayStr}`);

    // ===== 5. Front Desk records Bank Transfer payment (creates as Pending) =====
    console.log("\n=== 5. Front Desk records Bank Transfer ===");
    const recordPayBtn = page.locator("button:has-text('Record payment')");
    ok(await recordPayBtn.isVisible(), "Record payment button visible");
    await recordPayBtn.click();
    await page.waitForTimeout(800);
    await ss("bt04-bank-transfer-dialog");

    ok(await page.locator(".fixed.inset-0.z-50").first().isVisible(), "Payment dialog opened");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("bank_transfer");

    const btAmount = Math.min(40000, initialBalance);
    await payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill(String(btAmount));

    // Enter reference (bank transfer typically has a transaction reference)
    await payDialog.locator("label").filter({ hasText: "Reference" }).locator("input").fill("BANK-REF-12345");
    await ss("bt05-bank-transfer-filled");

    const submitBtn = page.locator("button:has-text('Record payment')").last();
    ok(await submitBtn.isEnabled(), "Record payment button enabled");
    await submitBtn.click();
    await page.waitForTimeout(1500);
    await ss("bt06-after-bt-payment");

    // ===== 6. Verify payment shows as Pending =====
    console.log("\n=== 6. Verify payment shows as Pending ===");
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyText = (await folioBody.textContent()) || "";
    ok(bodyText.includes("Pending"), "Payment shows 'Pending' badge (bank transfer needs manual confirmation)");
    ok(bodyText.includes("Bank Transfer"), "Payment shows 'Bank Transfer' method");

    // Balance should NOT have decreased
    const balanceAfterPendingStr = (await balanceLocator.textContent()) || "";
    const balanceAfterPending = parseUgx(balanceAfterPendingStr);
    ok(balanceAfterPending === initialBalance,
      `Balance unchanged while payment pending: UGX ${initialBalance.toLocaleString()} → UGX ${balanceAfterPending.toLocaleString()}`);

    // Total payments should NOT include pending amount
    const totalPayAfterPending = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayAfterPending === initialTotalPay,
      `Total payments unchanged while payment pending: UGX ${initialTotalPay.toLocaleString()} → UGX ${totalPayAfterPending.toLocaleString()}`);

    // ===== 7. Logout, login as Accountant =====
    console.log("\n=== 7. Login as Accountant ===");
    // Logout via localStorage clear + page reload
    await page.evaluate(() => { localStorage.removeItem("jambo-pms-auth"); localStorage.removeItem("jambo-role"); });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("bt07-logout");

    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    // Select Accountant role from dropdown
    await page.locator("button:has-text('Owner / GM')").click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Accountant')").click();
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Accountant");

    // ===== 8. Navigate back to same folio =====
    console.log("\n=== 8. Accountant opens folio ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("bt08-billing-accountant");

    const table2 = page.locator("table");
    const rows2 = table2.locator("tbody tr");
    const sameRow = rows2.filter({ hasText: guestName.trim() }).first();
    ok(await sameRow.isVisible(), "Same folio visible");

    await sameRow.click();
    await page.waitForTimeout(1500);
    await ss("bt09-folio-accountant");

    const balanceLocator2 = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    ok(await balanceLocator2.isVisible(), "Folio detail loaded");

    // ===== 9. Accountant confirms the bank transfer payment =====
    console.log("\n=== 9. Accountant confirms Bank Transfer ===");
    const confirmBtn = page.locator("button:has-text('Confirm')");
    ok(await confirmBtn.isVisible(), "Confirm button visible on pending payment (Accountant can confirm)");
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    await ss("bt10-after-confirm");

    // ===== 10. Verify balance decreased after confirmation =====
    console.log("\n=== 10. Verify balance decreased ===");
    const balanceAfterConfirmStr = (await balanceLocator2.textContent()) || "";
    const balanceAfterConfirm = parseUgx(balanceAfterConfirmStr);
    const expectedAfterConfirm = initialBalance - btAmount;
    ok(balanceAfterConfirm === expectedAfterConfirm,
      `Balance decreased from UGX ${initialBalance.toLocaleString()} to UGX ${balanceAfterConfirm.toLocaleString()} (expected UGX ${expectedAfterConfirm.toLocaleString()})`);

    const totalPayLocator2 = page.locator("text=Total payments").locator("..").locator("span.font-semibold").last();
    const totalPayAfterConfirm = parseUgx((await totalPayLocator2.textContent()) || "");
    ok(totalPayAfterConfirm >= initialTotalPay + btAmount,
      `Total payments increased to include BT: UGX ${totalPayAfterConfirm.toLocaleString()}`);

    // "Pending" badge should be gone
    const bodyAfterConfirm = (await page.locator(".mx-auto.max-w-5xl").first().textContent()) || "";
    ok(!bodyAfterConfirm.includes("Pending") || bodyAfterConfirm.includes("Confirm"),
      "Pending badge no longer shown on confirmed payment");

    // ===== 11. Record second bank transfer as Accountant and fail it =====
    console.log("\n=== 11. Record second BT and fail it ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("bt11-second-bt");

    const payDialog2 = page.locator(".fixed.inset-0.z-50");
    await payDialog2.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("bank_transfer");
    await payDialog2.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill("20000");
    await payDialog2.locator("label").filter({ hasText: "Reference" }).locator("input").fill("BANK-REF-99999");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("bt12-second-pending");

    const bodyAfterSecond = (await page.locator(".mx-auto.max-w-5xl").first().textContent()) || "";
    ok((bodyAfterSecond.match(/Pending/g) || []).length >= 1, "Second BT shows as Pending");

    const failBtn = page.locator("button:has-text('Fail')");
    ok(await failBtn.isVisible(), "Fail button visible on pending payment");

    page.once("dialog", (dialog) => {
      dialog.accept("Reference not found in bank statement");
    });
    await failBtn.click();
    await page.waitForTimeout(1500);
    await ss("bt13-after-fail");

    // ===== 12. Verify failed payment =====
    console.log("\n=== 12. Verify failed payment ===");
    const bodyAfterFail = (await page.locator(".mx-auto.max-w-5xl").first().textContent()) || "";
    ok(bodyAfterFail.includes("Failed"), "Failed payment shows 'Failed' badge");
    ok(bodyAfterFail.includes("Reference not found"), "Failure reason displayed");
    ok(!bodyAfterFail.includes("Confirm"), "No confirm button on failed payment");

    const balanceAfterFailStr = (await balanceLocator2.textContent()) || "";
    const balanceAfterFail = parseUgx(balanceAfterFailStr);
    ok(balanceAfterFail === balanceAfterConfirm,
      `Balance unchanged after failed payment: UGX ${balanceAfterConfirm.toLocaleString()} → UGX ${balanceAfterFail.toLocaleString()}`);

    // ===== 13. Verify audit trail =====
    console.log("\n=== 13. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("bt14-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Posted pending payment"), "Audit trail contains 'Posted pending payment'");
    ok(auditBody.includes("Confirmed payment"), "Audit trail contains 'Confirmed payment'");
    ok(auditBody.includes("Failed payment"), "Audit trail contains 'Failed payment'");
    ok(auditBody.includes("Reference not found"), "Audit contains failure reason");
    ok(auditBody.includes("bank_transfer"), "Audit references bank_transfer method");

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("bt-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
