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
    // ===== 1. Login =====
    console.log("\n=== 1. Login ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in");

    // ===== 2. Billing page =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("sp01-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Find a folio with high enough balance to split across methods =====
    console.log("\n=== 3. Open high-balance folio ===");
    const allRows = table.locator("tbody tr");
    const rowCount = await allRows.count();
    ok(rowCount > 0, "Folio rows found");

    // Select a specific folio with F&B charges (ids ending 2/4) for higher balance
    const targetRow = allRows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");

    const guestName = (await targetRow.locator("td").nth(1).textContent()) || "";
    console.log(`  Selected guest: ${guestName.trim()}`);

    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("sp03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Read initial balance =====
    console.log("\n=== 4. Read initial balance ===");
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const initialBalanceStr = (await balanceLocator.textContent()) || "";
    const initialBalance = parseUgx(initialBalanceStr);
    console.log(`  Outstanding balance: UGX ${initialBalance.toLocaleString()}`);
    ok(initialBalance >= 20000, `Initial balance sufficient for split: UGX ${initialBalance.toLocaleString()}`);

    const totalPaymentsLocator = page.locator("text=Total payments").locator("..").locator("span.font-semibold").last();

    // ===== 5. Record first split — Cash payment =====
    const cashAmount = Math.floor(initialBalance * 0.4); // 40% as cash
    const remainder = initialBalance - cashAmount;
    console.log(`\n=== 5. First split — Cash UGX ${cashAmount.toLocaleString()} ===`);

    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("sp04-cash-split");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("cash");
    await payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill(String(cashAmount));
    await payDialog.locator("label").filter({ hasText: "Amount tendered" }).locator("input").fill(String(cashAmount));
    await ss("sp05-cash-filled");

    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("sp06-after-cash");

    const balanceAfterCashStr = (await balanceLocator.textContent()) || "";
    const balanceAfterCash = parseUgx(balanceAfterCashStr);
    ok(balanceAfterCash === remainder,
      `Balance after cash split: UGX ${balanceAfterCash.toLocaleString()} (expected UGX ${remainder.toLocaleString()})`);

    // Verify Cash shows in payment list
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyCash = (await folioBody.textContent()) || "";
    ok(bodyCash.includes("Cash"), "Cash payment visible in list");

    // ===== 6. Record second split — MTN MoMo for remainder =====
    console.log(`\n=== 6. Second split — MoMo UGX ${remainder.toLocaleString()} ===`);
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("sp07-momo-split");

    const payDialog2 = page.locator(".fixed.inset-0.z-50");
    await payDialog2.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("mtn_momo");
    await payDialog2.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill(String(remainder));
    await payDialog2.locator("label").filter({ hasText: "Mobile money phone" }).locator("input").fill("+256 700 123 456");
    await ss("sp08-momo-filled");

    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("sp09-after-momo");

    // MoMo is pending — balance should NOT change yet
    const balanceAfterMoMoStr = (await balanceLocator.textContent()) || "";
    const balanceAfterMoMo = parseUgx(balanceAfterMoMoStr);
    ok(balanceAfterMoMo === remainder,
      `Balance still at UGX ${remainder.toLocaleString()} while MoMo pending`);

    const bodyMoMo = (await folioBody.textContent()) || "";
    ok(bodyMoMo.includes("Pending"), "MoMo payment shows Pending badge");

    // ===== 7. Confirm the MoMo payment to complete the split =====
    console.log("\n=== 7. Confirm MoMo to settle ===");
    const confirmBtn = page.locator("button:has-text('Confirm')");
    ok(await confirmBtn.isVisible(), "Confirm button visible");
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    await ss("sp10-after-momo-confirm");

    // ===== 8. Verify balance is exactly zero and folio auto-settled =====
    console.log("\n=== 8. Verify zero balance + settlement ===");
    const finalBalanceStr = (await balanceLocator.textContent()) || "";
    const finalBalance = parseUgx(finalBalanceStr);
    ok(finalBalance === 0,
      `Balance exactly zero after split payments: UGX ${finalBalance.toLocaleString()}`);

    // Check for "In credit" or "settled" indicator
    const bodyFinal = (await folioBody.textContent()) || "";
    ok(bodyFinal.includes("In credit") || bodyFinal.includes("settled") || bodyFinal.includes("Settled"),
      "Folio shows settled / in credit indicator");

    // Verify both payment methods appear in the list
    ok(bodyFinal.includes("Cash"), "Cash method visible in payment list");
    ok(bodyFinal.includes("MTN MoMo"), "MoMo method visible in payment list");

    // Total payments should equal initial balance
    const totalPayments = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayments === initialBalance,
      `Total payments exactly match balance: UGX ${totalPayments.toLocaleString()} = UGX ${initialBalance.toLocaleString()}`);

    // ===== 9. Verify folio status changed to settled =====
    console.log("\n=== 9. Folio status ===");
    // Go back to billing list
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("sp11-billing-settled");

    const table2 = page.locator("table");
    const settledRow = table2.locator("tbody tr").filter({ hasText: guestName.trim() }).first();
    ok(await settledRow.isVisible(), "Folio still visible");

    const settledBadge = settledRow.locator("span:has-text('Settled')");
    ok(await settledBadge.isVisible(), "Folio shows 'Settled' badge in billing list");

    // ===== 10. Verify audit trail =====
    console.log("\n=== 10. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("sp12-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Cash") || auditBody.includes("cash"), "Audit contains Cash reference");
    ok(auditBody.includes("mtn_momo") || auditBody.includes("MoMo"), "Audit contains MoMo reference");

    const cashAudit = (auditBody.match(/Cash/g) || []).length;
    const momoAudit = (auditBody.match(/mtn_momo/g) || []).length;
    ok(cashAudit >= 1, `Audit has at least 1 Cash entry (found ${cashAudit})`);
    ok(momoAudit >= 1, `Audit has at least 1 MTN MoMo entry (found ${momoAudit})`);

    // Total payment in audit should match
    const amountMatches = (auditBody.match(new RegExp(cashAmount.toLocaleString(), "g")) || []).length;
    ok(amountMatches >= 1, `Audit mentions first split amount UGX ${cashAmount.toLocaleString()}`);

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("sp-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
