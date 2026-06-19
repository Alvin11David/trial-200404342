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

async function run() {
  if (!existsSync("test-screenshots")) mkdirSync("test-screenshots");
  const ss = (n) => page.screenshot({ path: `test-screenshots/${n}.png` }).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ===== 1. Login as Front Desk =====
    console.log("\n=== 1. Login ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("cc01-login");

    await fillField(page, "Email address", "frontdesk@jambo.com");
    await fillField(page, "Password", "front123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Front Desk");

    // ===== 2. Navigate to Billing =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("cc02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Find an active/open folio with outstanding balance =====
    console.log("\n=== 3. Open folio ===");
    const allRows = table.locator("tbody tr");
    const rowCount = await allRows.count();
    ok(rowCount > 0, "Folio rows found");

    let targetRow = allRows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");

    const guestName = await targetRow.locator("td").nth(1).textContent();
    console.log(`  Selected guest: ${guestName}`);

    const initialBalanceText = await targetRow.locator("td").last().textContent();
    console.log(`  Listed balance: ${initialBalanceText}`);

    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("cc03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Record initial balance =====
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

    // ===== 5. Record cash payment with change =====
    console.log("\n=== 5. Record cash payment with change calculation ===");
    const recordPayBtn = page.locator("button:has-text('Record payment')");
    ok(await recordPayBtn.isVisible(), "Record payment button visible");
    await recordPayBtn.click();
    await page.waitForTimeout(800);
    await ss("cc04-payment-dialog");

    ok(await page.locator("text=Record payment").first().isVisible(), "Payment dialog opened");

    // Cash is the default method, so no need to select it
    // Enter the payment amount (what is owed / being paid)
    const payAmount = Math.min(50000, initialBalance);
    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill(String(payAmount));
    await ss("cc05-amount-filled");

    // Enter amount tendered (cash given by guest, more than the amount due)
    const tenderedAmount = payAmount + 10000;
    const expectedChange = tenderedAmount - payAmount;
    const tenderedField = payDialog.locator("label").filter({ hasText: "Amount tendered (UGX)" }).locator("input");
    await tenderedField.fill(String(tenderedAmount));
    await page.waitForTimeout(500);
    await ss("cc06-tendered-filled");

    // Verify change due is displayed
    const changeText = await payDialog.locator("text=Change due").textContent().catch(() => "");
    ok(changeText.includes(String(expectedChange)), `Change due shown: UGX ${expectedChange.toLocaleString()}`);

    // Submit the payment
    const submitPayBtn = page.locator("button:has-text('Record payment')").last();
    ok(await submitPayBtn.isEnabled(), "Record payment button enabled");
    await submitPayBtn.click();
    await page.waitForTimeout(1500);
    await ss("cc07-after-payment");

    // ===== 6. Verify balance decreased =====
    console.log("\n=== 6. Verify balance decreased ===");
    const balanceAfterStr = (await balanceLocator.textContent()) || "";
    const balanceAfter = parseUgx(balanceAfterStr);
    const expectedAfter = initialBalance - payAmount;
    ok(balanceAfter === expectedAfter,
      `Balance decreased from UGX ${initialBalance.toLocaleString()} to UGX ${balanceAfter.toLocaleString()} (expected UGX ${expectedAfter.toLocaleString()})`);

    // ===== 7. Verify payment appears on folio =====
    console.log("\n=== 7. Verify payment recorded ===");
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyText = (await folioBody.textContent()) || "";
    ok(bodyText.includes("Cash"), "Payment list shows 'Cash' method");
    ok(bodyText.includes(payAmount.toLocaleString()), `Payment list shows amount ${payAmount.toLocaleString()}`);

    // Verify total payments updated
    const totalPayAfter = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayAfter >= initialTotalPay + payAmount,
      `Total payments increased: UGX ${totalPayAfter.toLocaleString()}`);

    // ===== 8. Verify audit trail =====
    console.log("\n=== 8. Verify audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("cc08-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Posted payment"), "Audit trail contains 'Posted payment' entries");
    ok(auditBody.includes("Cash") || auditBody.includes("cash"), "Audit references Cash method");
    ok(auditBody.includes(payAmount.toLocaleString()) || auditBody.includes(String(payAmount)),
      "Audit contains payment amount");

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("cc-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
