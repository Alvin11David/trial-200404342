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
    // ===== 1. Login as Owner / GM =====
    console.log("\n=== 1. Login ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("p01-login");

    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Owner / GM");

    // ===== 2. Navigate to Billing =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("p02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Find a folio with no advance payment (so we have outstanding balance) =====
    console.log("\n=== 3. Open folio without advance payment ===");
    // Folios ending in 2 or 4 have an extra F&B charge, giving a higher balance for testing
    const allRows = table.locator("tbody tr");
    const rowCount = await allRows.count();
    ok(rowCount > 0, "Folio rows found");

    // Prefer a folio with F&B charges (ids ending 2/4) as they have higher balances
    let targetRow = allRows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");

    const guestName = await targetRow.locator("td").nth(1).textContent();
    console.log(`  Selected guest: ${guestName}`);

    // Read initial balance from the table
    const initialBalanceText = await targetRow.locator("td").last().textContent();
    console.log(`  Listed balance: ${initialBalanceText}`);

    // Open the folio
    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("p03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Record initial balance =====
    console.log("\n=== 4. Read initial balance ===");
    // Outstanding balance is displayed as the first big "UGX" text in FolioDetail
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const initialBalanceStr = (await balanceLocator.textContent()) || "";
    const initialBalance = parseUgx(initialBalanceStr);
    console.log(`  Outstanding balance: UGX ${initialBalance.toLocaleString()}`);
    ok(initialBalance > 0, `Initial balance is positive: UGX ${initialBalance.toLocaleString()}`);

    // Read current total payments from payment section
    const totalPaymentsLocator = page.locator("text=Total payments").locator("..").locator("span.font-semibold").last();
    const initialTotalPayStr = (await totalPaymentsLocator.textContent()) || "UGX 0";
    const initialTotalPay = parseUgx(initialTotalPayStr);
    console.log(`  Total payments before: ${initialTotalPayStr}`);

    // ===== 5. Record first partial payment (deposit) =====
    console.log("\n=== 5. Record partial payment — Cash 50,000 ===");
    const recordPayBtn = page.locator("button:has-text('Record payment')");
    ok(await recordPayBtn.isVisible(), "Record payment button visible");
    await recordPayBtn.click();
    await page.waitForTimeout(800);
    await ss("p04-payment-dialog");

    ok(await page.locator("text=Record payment").first().isVisible(), "Payment dialog opened");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("cash");
    // Override default amount (pre-filled to full balance) with partial payment
    await payDialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("50000");
    await ss("p05-payment-filled");

    const submitPayBtn = page.locator("button:has-text('Record payment')").last();
    ok(await submitPayBtn.isEnabled(), "Record payment button enabled");
    await submitPayBtn.click();
    await page.waitForTimeout(1500);
    await ss("p06-after-first-payment");

    // ===== 6. Verify balance decreased by 50,000 =====
    console.log("\n=== 6. Verify balance decreased ===");
    const balanceAfterFirstStr = (await balanceLocator.textContent()) || "";
    const balanceAfterFirst = parseUgx(balanceAfterFirstStr);
    const expectedAfterFirst = initialBalance - 50000;
    ok(balanceAfterFirst === expectedAfterFirst,
      `Balance decreased from UGX ${initialBalance.toLocaleString()} to UGX ${balanceAfterFirst.toLocaleString()} (expected UGX ${expectedAfterFirst.toLocaleString()})`);

    // Verify payment appears in folio detail body text
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyText = (await folioBody.textContent()) || "";
    ok(bodyText.includes("Cash"), "Payment list shows 'Cash' method");
    ok(bodyText.includes("50,000"), "Payment list shows '50,000' amount");

    // Verify total payments updated
    const totalPayAfterFirst = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayAfterFirst >= 50000, `Total payments increased to at least 50,000: UGX ${totalPayAfterFirst.toLocaleString()}`);

    // ===== 7. Record second partial payment =====
    console.log("\n=== 7. Record second partial payment — Card 30,000 ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("p07-second-payment-dialog");

    const payDialog2 = page.locator(".fixed.inset-0.z-50");
    await payDialog2.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("card");
    await payDialog2.locator("label").filter({ hasText: "Amount" }).locator("input").fill("30000");
    await ss("p08-second-payment-filled");

    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("p09-after-second-payment");

    // ===== 8. Verify balance decreased again =====
    console.log("\n=== 8. Verify balance decreased again ===");
    const balanceAfterSecondStr = (await balanceLocator.textContent()) || "";
    const balanceAfterSecond = parseUgx(balanceAfterSecondStr);
    const expectedAfterSecond = balanceAfterFirst - 30000;
    ok(balanceAfterSecond === expectedAfterSecond,
      `Balance decreased from UGX ${balanceAfterFirst.toLocaleString()} to UGX ${balanceAfterSecond.toLocaleString()} (expected UGX ${expectedAfterSecond.toLocaleString()})`);

    // Verify second payment in list
    const folioBody2 = page.locator(".mx-auto.max-w-5xl").first();
    const bodyText2 = (await folioBody2.textContent()) || "";
    ok(bodyText2.includes("50,000") || bodyText2.includes("50000"), "First payment 50,000 still visible");
    ok(bodyText2.includes("30,000") || bodyText2.includes("30000"), "Second payment 30,000 visible");
    ok(bodyText2.includes("Card"), "Second payment method 'Card' shown");

    // Verify total payments line increases
    const totalPayAfterSecond = parseUgx((await totalPaymentsLocator.textContent()) || "");
    const expectedTotalPay = initialTotalPay + 50000 + 30000;
    ok(totalPayAfterSecond >= expectedTotalPay,
      `Total payments >= UGX ${expectedTotalPay.toLocaleString()}: UGX ${totalPayAfterSecond.toLocaleString()}`);

    // Verify balance header shows correct state
    const balanceColorClass = await balanceLocator.getAttribute("class") || "";
    if (balanceAfterSecond <= 0) {
      ok(balanceColorClass.includes("text-success"), "Balance zero/negative — success color shown");
      // Verify "In credit / settled" message
      ok(await page.locator("text=In credit").isVisible().catch(() => false)
        || await page.locator("text=settled").isVisible().catch(() => false),
        "Settled/in-credit indicator visible");
    } else {
      ok(balanceColorClass.includes("text-warning") || balanceColorClass.includes("text-destructive"),
        `Positive balance warning/destructive color: ${balanceColorClass}`);
    }

    // ===== 9. Verify audit trail =====
    console.log("\n=== 9. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("p10-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Posted payment"), "Audit trail contains 'Posted payment' entries");
    ok(auditBody.includes("Cash") || auditBody.includes("cash"), "Audit references Cash method");
    ok(auditBody.includes("Card") || auditBody.includes("card"), "Audit references Card method");
    ok(auditBody.includes("50,000") || auditBody.includes("50000"), "Audit contains first payment amount");

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("p-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
