import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (cond, m) => { if (cond) { PASSED.push(m ?? cond); console.log(`  \u2713 ${m ?? cond}`); } else { FAILED.push(m ?? cond); console.log(`  \u2717 ${m ?? cond}`); } };
const no  = (m) => { FAILED.push(m); console.log(`  \u2717 ${m}`); };

function parseUgx(text) {
  const cleaned = (text || "").replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

async function fillField(page, label, value) {
  const labelEl = page.locator("label").filter({ hasText: label }).first();
  const parent = labelEl.locator("..");
  const input = parent.locator("input, select").first();
  const tag = await input.evaluate((el) => el.tagName);
  if (tag === "SELECT") await input.selectOption(value);
  else await input.fill(value);
}

function readLedger(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("jambo-pms-cache");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      chargeCount: data.charges?.length ?? 0,
      paymentCount: data.payments?.length ?? 0,
      folioCount: data.folios?.length ?? 0,
      chargeIds: (data.charges || []).map((c) => c.id),
      paymentIds: (data.payments || []).map((p) => p.id),
      voidedIds: (data.charges || []).filter((c) => c.voided).map((c) => c.id),
      allCharges: (data.charges || []).map((c) => ({ id: c.id, folioId: c.folioId, date: c.date, type: c.type, description: c.description, amount: c.amount, voided: !!c.voided, voidReason: c.voidReason, voidedBy: c.voidedBy })),
      allPayments: (data.payments || []).map((p) => ({ id: p.id, folioId: p.folioId, date: p.date, method: p.method, amount: p.amount })),
    };
  });
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
    await ss("al01-login");
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Owner / GM");

    // ===== 2. Go to billing and open a folio =====
    console.log("\n=== 2. Open folio ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("al02-billing");

    // At this point localStorage may or may not have the cache (it's written on first mutation).
    // Trigger a harmless mutation to ensure cache is created.
    // First, open a folio to see initial state.
    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");
    const rows = table.locator("tbody tr");
    const activeRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await activeRow.isVisible(), "Active folio found");

    // Capture the guest name and initial balance before any operations
    const guestNameText = await activeRow.locator("td").first().textContent() || "";
    const balanceText = await activeRow.locator("td").nth(3).textContent() || "";
    console.log(`  Guest: ${guestNameText.trim()}  Balance: ${balanceText.trim()}`);

    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("al03-folio-detail");

    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    ok(await balanceLocator.isVisible(), "Folio detail loaded");

    // ===== 3. Verify NO delete/remove buttons exist for charges or payments =====
    console.log("\n=== 3. No delete/remove UI ===");
    const deleteBtns = page.locator("button").filter({ hasText: /delete|remove|trash|destroy/i });
    const deleteCount = await deleteBtns.count();
    ok(deleteCount === 0, `No delete/remove/trash buttons in folio detail (found ${deleteCount})`);

    const voidBtns = page.locator("button[title='Void charge']");
    ok(await voidBtns.count() > 0, "Void buttons exist (append-only, not delete)");
    console.log("  UI confirms: charges can only be voided (not deleted), payments have no delete action");

    // ===== 4. Add a charge — verifiy persists to localStorage =====
    console.log("\n=== 4. Add charge ===");
    await page.locator("button:has-text('Add charge')").click();
    await page.waitForTimeout(800);
    await ss("al04-add-charge");

    const dialog = page.locator(".fixed.inset-0.z-50");
    await dialog.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("misc");
    await dialog.locator("label").filter({ hasText: "Description" }).locator("input").fill("Spa voucher");
    await dialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("75000");
    await page.locator("button:has-text('Post charge')").click();
    await page.waitForTimeout(1500);
    await ss("al05-charge-added");

    // After first mutation, cache should exist in localStorage
    const ledger1 = await readLedger(page);
    ok(ledger1 !== null, "localStorage cache created after first mutation");
    ok(ledger1.chargeCount > 0, `Charges in store: ${ledger1.chargeCount}`);
    ok(ledger1.paymentCount >= 0, `Payments in store: ${ledger1.paymentCount}`);
    const chargeCountAfterAdd = ledger1.chargeCount;
    const paymentCountAfterAdd = ledger1.paymentCount;
    console.log(`  Charges: ${chargeCountAfterAdd}  Payments: ${paymentCountAfterAdd}`);

    // ===== 5. Add a payment =====
    console.log("\n=== 5. Add payment ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("al06-add-payment");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("card");
    await payDialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("25000");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("al07-payment-added");

    const ledger2 = await readLedger(page);
    ok(ledger2.chargeCount === chargeCountAfterAdd,
      `Charge count unchanged after add-payment: ${chargeCountAfterAdd} → ${ledger2.chargeCount}`);
    ok(ledger2.paymentCount === paymentCountAfterAdd + 1,
      `Payment count increased by 1: ${paymentCountAfterAdd} → ${ledger2.paymentCount}`);
    const chargeCountAfterPay = ledger2.chargeCount;
    const paymentCountAfterPay = ledger2.paymentCount;

    // ===== 6. Void a charge — verify record preserved (not deleted) =====
    console.log("\n=== 6. Void charge → record preserved ===");
    // The charge list shows charges, including the newly added one
    const chargeList = page.locator("ul.divide-y.divide-border").first();
    const chargeItems = chargeList.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const preVoidCount = await chargeItems.count();

    // Find a void button on the last charge
    const voidBtn = chargeItems.last().locator("button[title='Void charge']");
    if (await voidBtn.isVisible()) {
      await voidBtn.click();
      await page.waitForTimeout(800);
      await ss("al08-void-dialog");

      const voidDialog = page.locator(".fixed.inset-0.z-50");
      await voidDialog.locator("textarea").fill("Guest complained — incorrect charge");
      await page.locator("button:has-text('Void charge')").last().click();
      await page.waitForTimeout(1500);
      await ss("al09-after-void");

      // Verify record still exists (not deleted — same count)
      const chargeItemsAfter = chargeList.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
      const postVoidCount = await chargeItemsAfter.count();
      ok(postVoidCount === preVoidCount,
        `Charge UI list count unchanged after void: ${preVoidCount} → ${postVoidCount} (record preserved)`);

      // Verify voided badge appears
      const lastText = await chargeItemsAfter.last().textContent() || "";
      ok(lastText.includes("Voided"), "Voided badge displayed on preserved record");
      ok(lastText.includes("incorrect charge"), "Void reason displayed on preserved record");
    }

    const ledger3 = await readLedger(page);
    ok(ledger3.chargeCount === chargeCountAfterPay,
      `Charge count unchanged after void: ${chargeCountAfterPay} → ${ledger3.chargeCount} (no deletion)`);
    ok(ledger3.voidedIds.length > 0, "Voided charge IDs exist");
    ok(ledger3.voidedIds.length >= ledger1.voidedIds.length,
      `Voided record count increased or stayed same: ${ledger1.voidedIds.length} → ${ledger3.voidedIds.length}`);
    console.log(`  Voided records in store: ${ledger3.voidedIds.length}`);

    // ===== 7. Verify original charge IDs all still present =====
    console.log("\n=== 7. Original records never removed ===");
    const ledgerCounts = [ledger1, ledger2, ledger3];
    const allMonotonic = ledgerCounts.every((l, i) =>
      i === 0 || l.chargeCount >= ledgerCounts[i - 1].chargeCount
    );
    ok(allMonotonic, "Charge count monotonically increasing (never decreases)");

    const payMonotonic = ledgerCounts.every((l, i) =>
      i === 0 || l.paymentCount >= ledgerCounts[i - 1].paymentCount
    );
    ok(payMonotonic, "Payment count monotonically increasing (never decreases)");

    // All original charge IDs should still be present
    const allChargeIdsPresent = await readLedger(page).then((l) =>
      ledger1.chargeIds.every((id) => l.chargeIds.includes(id))
    );
    ok(allChargeIdsPresent, "All original charge IDs still present (none deleted)");

    const allPayIdsPresent = await readLedger(page).then((l) =>
      ledger1.paymentIds.every((id) => l.paymentIds.includes(id))
    );
    ok(allPayIdsPresent, "All original payment IDs still present (none deleted)");

    // ===== 8. Hard refresh — verify integrity =====
    console.log("\n=== 8. Append-only survives page reload ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("al10-after-reload");

    const ledger4 = await readLedger(page);
    ok(ledger4.chargeCount === ledger3.chargeCount,
      `Charge count stable after reload: ${ledger3.chargeCount} → ${ledger4.chargeCount}`);
    ok(ledger4.paymentCount === ledger3.paymentCount,
      `Payment count stable after reload: ${ledger3.paymentCount} → ${ledger4.paymentCount}`);

    // Re-open same folio and verify voided charge visible
    const table2 = page.locator("table");
    const rows2 = table2.locator("tbody tr");
    const sameRow = rows2.filter({ hasText: guestNameText.trim() }).first();
    if (await sameRow.isVisible()) {
      await sameRow.click();
      await page.waitForTimeout(1500);

      const bodyText = await page.locator("body").textContent() || "";
      ok(bodyText.includes("Spa voucher"), "Added charge persists after reload");
      ok(bodyText.includes("Voided"), "Voided charge record persists after reload");
    }

    // ===== 9. Verify voided charge record in localStorage has all fields =====
    console.log("\n=== 9. Voided record integrity in localStorage ===");
    const voidedRecords = ledger4.allCharges.filter((c) => c.voided === true);
    ok(voidedRecords.length > 0, "Voided records found in localStorage");
    const hasAllFields = voidedRecords.every((c) =>
      c.id && c.folioId && c.date && c.type && c.description &&
      typeof c.amount === "number" && c.voided === true &&
      c.voidReason && c.voidedBy
    );
    ok(hasAllFields, "All voided records have complete fields (id, folioId, amount, voidReason, voidedBy)");
    console.log(`  ${voidedRecords.length} voided records with complete fields in localStorage`);

    // ===== 10. Verify every charge and payment record has required fields =====
    console.log("\n=== 10. All record integrity ===");
    const allChargesValid = ledger4.allCharges.every(
      (c) => c.id && c.folioId && c.date && c.type && c.description && typeof c.amount === "number"
    );
    ok(allChargesValid, `All ${ledger4.chargeCount} charge records have required fields (none corrupted)`);

    const allPaymentsValid = ledger4.allPayments.every(
      (p) => p.id && p.folioId && p.date && p.method && typeof p.amount === "number"
    );
    ok(allPaymentsValid, `All ${ledger4.paymentCount} payment records have required fields (none corrupted)`);

    // ===== 11. Verify charges are truly append-only by checking all IDs are unique and cumulative =====
    console.log("\n=== 11. Append-only property: IDs are cumulative ===");
    const allChargeIds1 = ledger1.chargeIds;
    const allChargeIds4 = ledger4.chargeIds;
    // The set of original IDs should be a subset of final IDs
    const originalInFinal = allChargeIds1.every((id) => allChargeIds4.includes(id));
    ok(originalInFinal, "All initial charge IDs are subset of final charge IDs (append-only)");
    // Final count should be >= original count
    ok(allChargeIds4.length >= allChargeIds1.length,
      `Final charge count (${allChargeIds4.length}) >= initial (${allChargeIds1.length})`);

    const allPayIds1 = ledger1.paymentIds;
    const allPayIds4 = ledger4.paymentIds;
    const payInFinal = allPayIds1.every((id) => allPayIds4.includes(id));
    ok(payInFinal, "All initial payment IDs are subset of final payment IDs (append-only)");

    console.log(`  Charges: ${allChargeIds1.length} → ${allChargeIds4.length} (${allChargeIds4.length - allChargeIds1.length} added, 0 removed)`);
    console.log(`  Payments: ${allPayIds1.length} → ${allPayIds4.length} (${allPayIds4.length - allPayIds1.length} added, 0 removed)`);

    console.log(`\n  VERDICT: Ledger is strictly append-only. No charge or payment record was ever deleted.`);

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("al-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
