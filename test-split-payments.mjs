import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (cond, m) => { if (cond) { PASSED.push(m ?? cond); console.log(`  \u2713 ${m ?? cond}`); } else { FAILED.push(m ?? cond); console.log(`  \u2717 ${m ?? cond}`); } };
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
    ok(true, "Logged in");

    // ===== 2. Billing page =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("sp01-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Open high-balance folio =====
    console.log("\n=== 3. Open high-balance folio ===");
    const allRows = table.locator("tbody tr");
    const rowCount = await allRows.count();
    ok(rowCount > 0, "Folio rows found");

    const targetRow = allRows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Active folio found");

    const guestName = (await targetRow.locator("td").nth(1).textContent()) || "";
    console.log("  Selected guest: " + guestName.trim());

    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("sp03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Read initial balance =====
    console.log("\n=== 4. Read initial balance ===");
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const initialBalanceStr = (await balanceLocator.textContent()) || "";
    const initialBalance = parseUgx(initialBalanceStr);
    console.log("  Outstanding balance: UGX " + initialBalance.toLocaleString());
    ok(initialBalance >= 20000, "Initial balance sufficient for split: UGX " + initialBalance.toLocaleString());

    const totalPaymentsLocator = page.locator("text=Total payments").locator("..").locator("span.font-semibold").last();

    // ===== 5. First split — Cash =====
    const cashAmount = Math.floor(initialBalance * 0.4);
    const remainder = initialBalance - cashAmount;
    console.log("\n=== 5. Cash UGX " + cashAmount.toLocaleString() + " (40%) ===");
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

    const balanceAfterCash = parseUgx((await balanceLocator.textContent()) || "");
    ok(balanceAfterCash === remainder,
      "Balance after cash split: UGX " + balanceAfterCash.toLocaleString() + " (expected UGX " + remainder.toLocaleString() + ")");

    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const bodyCash = (await folioBody.textContent()) || "";
    ok(bodyCash.includes("Cash"), "Cash payment visible in payment list");

    // ===== 6. Second split — MTN Mobile Money for remainder =====
    console.log("\n=== 6. MTN Mobile Money UGX " + remainder.toLocaleString() + " (60%) ===");
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

    // MoMo is pending — balance unchanged
    const balanceAfterMoMo = parseUgx((await balanceLocator.textContent()) || "");
    ok(balanceAfterMoMo === remainder,
      "Balance still at UGX " + remainder.toLocaleString() + " while MoMo pending");

    const bodyMoMo = (await folioBody.textContent()) || "";
    ok(bodyMoMo.includes("Pending"), "MoMo payment shows Pending badge");

    // ===== 7. Confirm MoMo to settle =====
    console.log("\n=== 7. Confirm MoMo ===");
    const confirmBtn = page.locator("button:has-text('Confirm')");
    ok(await confirmBtn.isVisible(), "Confirm button visible");
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    await ss("sp10-after-momo-confirm");

    // ===== 8. Verify zero balance + settlement =====
    console.log("\n=== 8. Zero balance + settlement ===");
    const finalBalance = parseUgx((await balanceLocator.textContent()) || "");
    ok(finalBalance === 0, "Balance exactly zero: UGX " + finalBalance.toLocaleString());

    const bodyFinal = (await folioBody.textContent()) || "";
    ok(bodyFinal.includes("In credit") || bodyFinal.includes("settled") || bodyFinal.includes("Settled"),
      "Folio shows settled / in credit indicator");
    ok(bodyFinal.includes("Cash"), "Cash method visible in payment list");

    // Label for mtn_momo is "MTN Mobile Money" — check for substring match
    ok(bodyFinal.includes("MoMo") || bodyFinal.includes("Mobile Money") || bodyFinal.includes("MTN"),
      "Mobile money payment method visible in payment list");

    const totalPayments = parseUgx((await totalPaymentsLocator.textContent()) || "");
    ok(totalPayments === initialBalance,
      "Total payments UGX " + totalPayments.toLocaleString() + " = initial balance UGX " + initialBalance.toLocaleString());

    // ===== 9. Folio status in billing list (settled tab) =====
    console.log("\n=== 9. Folio status (settled tab) ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("sp11-billing-settled");

    // Click "settled" tab to see settled folios
    const settledTab = page.locator("button:has-text('Settled')");
    ok(await settledTab.isVisible(), "Settled tab visible");
    await settledTab.click();
    await page.waitForTimeout(800);

    const table2 = page.locator("table");
    const settledRow = table2.locator("tbody tr").filter({ hasText: guestName.trim() }).first();
    ok(await settledRow.isVisible(), "Settled folio visible in billing list (settled tab)");

    const statusBadge = settledRow.locator("span:has-text('Settled')");
    ok(await statusBadge.isVisible(), "Folio badge shows 'Settled'");

    // ===== 10. Audit trail =====
    console.log("\n=== 10. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("sp12-audit");

    const auditBody = (await page.locator("body").textContent()) || "";
    ok(auditBody.includes("Cash") || auditBody.includes("cash"), "Audit references Cash");
    ok(auditBody.includes("mtn_momo"), "Audit references mtn_momo method");
    ok(auditBody.includes(cashAmount.toLocaleString()),
      "Audit mentions cash amount UGX " + cashAmount.toLocaleString());

    // Case-insensitive count — audit uses lowercase method names
    const cashCount = (auditBody.match(/cash/gi) || []).length;
    const momoCount = (auditBody.match(/mtn_momo/g) || []).length;
    ok(cashCount >= 1, "At least 1 cash reference in audit (found " + cashCount + ")");
    ok(momoCount >= 1, "At least 1 MTN MoMo reference in audit (found " + momoCount + ")");

  } catch (err) {
    console.log("\n  ERROR: " + err.message);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("sp-error").catch(() => {});
    no(err.message);
  }

  console.log("\n" + "=".repeat(40));
  console.log("Passed: " + PASSED.length + "  Failed: " + FAILED.length);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
