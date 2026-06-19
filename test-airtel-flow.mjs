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
    await ss("af01-login");

    await fillField(page, "Email address", "frontdesk@jambo.com");
    await fillField(page, "Password", "front123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Front Desk");

    // ===== 2. Navigate to Billing =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("af02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Find an active/open folio with balance =====
    console.log("\n=== 3. Open folio ===");
    const allRows = table.locator("tbody tr");
    const rowCount = await allRows.count();
    ok(rowCount > 0, "Folio rows found");

    let targetRow = allRows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");

    const guestName = await targetRow.locator("td").nth(1).textContent();
    console.log(`  Selected guest: ${guestName}`);

    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("af03-folio-detail");
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

    // ===== 5. Initiate Airtel Money payment (creates as Pending) =====
    console.log("\n=== 5. Initiate Airtel Money payment ===");
    const recordPayBtn = page.locator("button:has-text('Record payment')");
    ok(await recordPayBtn.isVisible(), "Record payment button visible");
    await recordPayBtn.click();
    await page.waitForTimeout(800);
    await ss("af04-airtel-dialog");

    ok(await page.locator(".fixed.inset-0.z-50").first().isVisible(), "Payment dialog opened");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    // Select Airtel Money
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("airtel_money");

    // Enter amount
    const airtelAmount = Math.min(25000, initialBalance);
    await payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill(String(airtelAmount));

    // Enter phone number
    await payDialog.locator("label").filter({ hasText: "Mobile money phone" }).locator("input").fill("+256 700 111 222");
    await ss("af05-airtel-filled");

    // Submit the payment
    const submitBtn = page.locator("button:has-text('Record payment')").last();
    ok(await submitBtn.isEnabled(), "Record payment button enabled");
    await submitBtn.click();
    await page.waitForTimeout(1500);
    await ss("af06-after-airtel-payment");

    // ===== 6. Verify payment shows as Pending =====
    console.log("\n=== 6. Verify payment shows as Pending ===");
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyText = (await folioBody.textContent()) || "";
    ok(bodyText.includes("Pending"), "Payment shows 'Pending' badge");
    ok(bodyText.includes("Airtel Money"), "Payment shows 'Airtel Money' method");

    // Balance should NOT have decreased (pending payments don't count)
    const balanceAfterPendingStr = (await balanceLocator.textContent()) || "";
    const balanceAfterPending = parseUgx(balanceAfterPendingStr);
    ok(balanceAfterPending === initialBalance,
      `Balance unchanged while payment pending: UGX ${initialBalance.toLocaleString()} → UGX ${balanceAfterPending.toLocaleString()}`);

    // Total payments should NOT include pending amount
    const totalPayAfterPending = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayAfterPending === initialTotalPay,
      `Total payments unchanged while payment pending: UGX ${initialTotalPay.toLocaleString()} → UGX ${totalPayAfterPending.toLocaleString()}`);

    // ===== 7. Confirm the pending payment =====
    console.log("\n=== 7. Confirm the pending payment ===");
    const confirmBtn = page.locator("button:has-text('Confirm')");
    ok(await confirmBtn.isVisible(), "Confirm button visible on pending payment");
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    await ss("af07-after-confirm");

    // ===== 8. Verify balance decreased after confirmation =====
    console.log("\n=== 8. Verify balance decreased after confirmation ===");
    const balanceAfterConfirmStr = (await balanceLocator.textContent()) || "";
    const balanceAfterConfirm = parseUgx(balanceAfterConfirmStr);
    const expectedAfterConfirm = initialBalance - airtelAmount;
    ok(balanceAfterConfirm === expectedAfterConfirm,
      `Balance decreased from UGX ${initialBalance.toLocaleString()} to UGX ${balanceAfterConfirm.toLocaleString()} (expected UGX ${expectedAfterConfirm.toLocaleString()})`);

    // Total payments should now include the confirmed amount
    const totalPayAfterConfirm = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayAfterConfirm >= initialTotalPay + airtelAmount,
      `Total payments increased to include Airtel: UGX ${totalPayAfterConfirm.toLocaleString()}`);

    // "Pending" badge should be gone (now confirmed)
    const bodyAfterConfirm = (await folioBody.textContent()) || "";
    ok(!bodyAfterConfirm.includes("Pending") || bodyAfterConfirm.includes("Confirm"),
      "Pending badge no longer shown on confirmed payment");

    // ===== 9. Initiate second Airtel Money payment and fail it =====
    console.log("\n=== 9. Initiate Airtel payment and fail it ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("af08-second-airtel");

    const payDialog2 = page.locator(".fixed.inset-0.z-50");
    await payDialog2.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("airtel_money");
    await payDialog2.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill("15000");
    await payDialog2.locator("label").filter({ hasText: "Mobile money phone" }).locator("input").fill("+256 772 333 444");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("af09-second-pending");

    // Verify second payment is Pending
    const bodyAfterSecond = (await folioBody.textContent()) || "";
    ok((bodyAfterSecond.match(/Pending/g) || []).length >= 1, "Second payment shows as Pending");

    // Fail the payment
    const failBtn = page.locator("button:has-text('Fail')");
    ok(await failBtn.isVisible(), "Fail button visible on pending payment");

    page.once("dialog", (dialog) => {
      dialog.accept("Insufficient Airtel balance");
    });
    await failBtn.click();
    await page.waitForTimeout(1500);
    await ss("af10-after-fail");

    // ===== 10. Verify failed payment shows Failed badge =====
    console.log("\n=== 10. Verify failed payment ===");
    const bodyAfterFail = (await folioBody.textContent()) || "";
    ok(bodyAfterFail.includes("Failed"), "Failed payment shows 'Failed' badge");
    ok(bodyAfterFail.includes("Insufficient Airtel"), "Failure reason displayed");
    ok(!bodyAfterFail.includes("Confirm"), "No confirm button on failed payment");

    // Balance should still be the same (failed payment didn't affect it)
    const balanceAfterFailStr = (await balanceLocator.textContent()) || "";
    const balanceAfterFail = parseUgx(balanceAfterFailStr);
    ok(balanceAfterFail === balanceAfterConfirm,
      `Balance unchanged after failed payment: UGX ${balanceAfterConfirm.toLocaleString()} → UGX ${balanceAfterFail.toLocaleString()}`);

    // ===== 11. Verify audit trail =====
    console.log("\n=== 11. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("af11-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Posted pending payment"), "Audit trail contains 'Posted pending payment'");
    ok(auditBody.includes("Confirmed payment"), "Audit trail contains 'Confirmed payment'");
    ok(auditBody.includes("Failed payment"), "Audit trail contains 'Failed payment'");
    ok(auditBody.includes("Insufficient Airtel"), "Audit contains failure reason");

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("af-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
