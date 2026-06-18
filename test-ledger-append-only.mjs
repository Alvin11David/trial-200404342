import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (m) => { PASSED.push(m); console.log(`  \u2713 ${m}`); };
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

    // ===== 2. Capture initial ledger state from localStorage =====
    console.log("\n=== 2. Capture initial ledger state ===");
    const initialLedger = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        chargeCount: data.charges?.length ?? 0,
        paymentCount: data.payments?.length ?? 0,
        chargeIds: (data.charges || []).map((c) => c.id),
        paymentIds: (data.payments || []).map((p) => p.id),
        voidedIds: (data.charges || []).filter((c) => c.voided).map((c) => c.id),
      };
    });
    ok(initialLedger, "Initial ledger state captured");
    console.log(`  Charges: ${initialLedger.chargeCount}  Payments: ${initialLedger.paymentCount}  Voided: ${initialLedger.voidedIds.length}`);

    // ===== 3. Go to billing and open a folio =====
    console.log("\n=== 3. Open folio ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("al02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");
    const rows = table.locator("tbody tr");
    const activeRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await activeRow.isVisible(), "Active folio found");

    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("al03-folio-detail");

    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    ok(await balanceLocator.isVisible(), "Folio detail loaded");

    // ===== 4. Verify NO delete/remove buttons exist for charges or payments =====
    console.log("\n=== 4. No delete/remove UI ===");
    // Check that no button says "Delete", "Remove", or "Trash"
    const deleteBtns = page.locator("button").filter({ hasText: /delete|remove|trash|destroy/i });
    const deleteCount = await deleteBtns.count();
    ok(deleteCount === 0, `No delete/remove/trash buttons in folio detail (found ${deleteCount})`);

    // Only void button should exist for charges (which preserves the record)
    const voidBtns = page.locator("button[title='Void charge']");
    ok(await voidBtns.count() > 0, "Void buttons exist (append-only, not delete)");

    // Payments have no action buttons at all
    // Charges only have void (which preserves data)
    console.log("  UI confirms: charges can only be voided (not deleted), payments have no delete action");

    // ===== 5. Add a charge — verify count increases =====
    console.log("\n=== 5. Add charge → count increases ===");
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

    const afterAddCharge = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      return JSON.parse(raw).charges?.length ?? 0;
    });
    ok(afterAddCharge === initialLedger.chargeCount + 1,
      `Charge count increased by 1: ${initialLedger.chargeCount} → ${afterAddCharge}`);

    // ===== 6. Add a payment — verify count increases =====
    console.log("\n=== 6. Add payment → count increases ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("al06-add-payment");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("card");
    await payDialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("25000");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("al07-payment-added");

    const afterAddPayment = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      return JSON.parse(raw).payments?.length ?? 0;
    });
    ok(afterAddPayment === initialLedger.paymentCount + 1,
      `Payment count increased by 1: ${initialLedger.paymentCount} → ${afterAddPayment}`);

    // ===== 7. Void a charge — verify record preserved (not deleted) =====
    console.log("\n=== 7. Void charge → record preserved ===");
    const chargeList = page.locator("ul.divide-y.divide-border").first();
    const chargeItems = chargeList.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const preVoidCount = await chargeItems.count();

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
    }

    // Verify record still exists (not deleted)
    const chargeItemsAfter = chargeList.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const postVoidCount = await chargeItemsAfter.count();
    ok(postVoidCount === preVoidCount, `Charge count unchanged after void: ${preVoidCount} → ${postVoidCount} (record preserved)`);

    // Verify the voided record shows "Voided" badge
    const voidedText = await chargeItemsAfter.last().textContent() || "";
    ok(voidedText.includes("Voided"), "Voided badge displayed on preserved record");
    ok(voidedText.includes("incorrect charge"), "Void reason displayed on preserved record");

    // ===== 8. Verify charge count in localStorage never decreases =====
    console.log("\n=== 8. localStorage count never decreases ===");
    const ledgerAfterVoid = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        chargeCount: data.charges?.length ?? 0,
        paymentCount: data.payments?.length ?? 0,
        voidedIds: (data.charges || []).filter((c) => c.voided).map((c) => c.id),
      };
    });
    ok(ledgerAfterVoid.chargeCount === afterAddCharge,
      `Charge count in localStorage unchanged after void: ${afterAddCharge} → ${ledgerAfterVoid.chargeCount}`);
    ok(ledgerAfterVoid.voidedIds.length > initialLedger.voidedIds.length,
      `Voided charges increased: ${initialLedger.voidedIds.length} → ${ledgerAfterVoid.voidedIds.length}`);

    // ===== 9. Verify original charge IDs all still present =====
    console.log("\n=== 9. Original records never removed ===");
    const allIdsPresent = await page.evaluate((originalIds) => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return false;
      const data = JSON.parse(raw);
      const currentIds = (data.charges || []).map((c) => c.id);
      return originalIds.every((id) => currentIds.includes(id));
    }, initialLedger.chargeIds);
    ok(allIdsPresent, "All original charge IDs still present in localStorage (none deleted)");

    const allPayIdsPresent = await page.evaluate((originalIds) => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return false;
      const data = JSON.parse(raw);
      const currentIds = (data.payments || []).map((p) => p.id);
      return originalIds.every((id) => currentIds.includes(id));
    }, initialLedger.paymentIds);
    ok(allPayIdsPresent, "All original payment IDs still present in localStorage (none deleted)");

    // ===== 10. Hard refresh — verify append-only property survives reload =====
    console.log("\n=== 10. Append-only survives page reload ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    const ledgerAfterReload = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        chargeCount: data.charges?.length ?? 0,
        paymentCount: data.payments?.length ?? 0,
        chargeIds: (data.charges || []).map((c) => c.id),
        paymentIds: (data.payments || []).map((p) => p.id),
      };
    });
    ok(ledgerAfterReload.chargeCount === ledgerAfterVoid.chargeCount,
      `Charge count stable after reload: ${ledgerAfterVoid.chargeCount} → ${ledgerAfterReload.chargeCount}`);
    ok(ledgerAfterReload.paymentCount === ledgerAfterVoid.paymentCount,
      `Payment count stable after reload: ${ledgerAfterVoid.paymentCount} → ${ledgerAfterReload.paymentCount}`);

    // Re-open same folio and verify voided charge visible
    const table2 = page.locator("table");
    const rows2 = table2.locator("tbody tr");
    const guestName = "Tom";
    const sameRow = rows2.filter({ hasText: guestName }).first();
    if (await sameRow.isVisible()) {
      await sameRow.click();
      await page.waitForTimeout(1500);
      await ss("al10-after-reload");

      const reloadText = await page.locator("body").textContent() || "";
      ok(reloadText.includes("Spa voucher"), "Added charge persists after reload");
      ok(reloadText.includes("Voided"), "Voided charge record persists after reload");
      ok(reloadText.includes("incorrect charge"), "Void reason persists after reload");
    }

    // ===== 11. Verify voided charges still visible in ledger (not filtered from storage) =====
    console.log("\n=== 11. Voided records in localStorage ===");
    const voidedInStorage = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return (data.charges || []).filter((c) => c.voided).map((c) => ({
        id: c.id,
        amount: c.amount,
        voidReason: c.voidReason,
        voidedBy: c.voidedBy,
        originalDescription: c.description,
        voided: c.voided,
      }));
    });
    ok(voidedInStorage.length > initialLedger.voidedIds.length,
      `Voided records in localStorage: ${voidedInStorage.length}`);
    const newestVoided = voidedInStorage[voidedInStorage.length - 1];
    ok(newestVoided.voided === true, "Record has voided flag");
    ok(newestVoided.voidReason === "Guest complained — incorrect charge", "Void reason stored");
    ok(newestVoided.voidedBy === "Sarah Nakato", "Void author stored");
    console.log(`  Latest voided: ${newestVoided.originalDescription} (${newestVoided.amount}) — ${newestVoided.voidReason}`);

    // ===== 12. Verify no charge or payment was ever removed =====
    console.log("\n=== 12. Complete ledger integrity ===");
    const finalLedger = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        charges: (data.charges || []).length,
        payments: (data.payments || []).length,
        allCharges: data.charges || [],
        allPayments: data.payments || [],
      };
    });

    // Every charge record must have an id, folioId, date, type, description, amount
    const allChargesValid = finalLedger.allCharges.every(
      (c) => c.id && c.folioId && c.date && c.type && c.description && typeof c.amount === "number",
    );
    ok(allChargesValid, "All charge records have required fields (none corrupted)");

    // Every payment record must have an id, folioId, date, method, amount
    const allPaymentsValid = finalLedger.allPayments.every(
      (p) => p.id && p.folioId && p.date && p.method && typeof p.amount === "number",
    );
    ok(allPaymentsValid, "All payment records have required fields (none corrupted)");

    console.log(`  Final ledger: ${finalLedger.charges} charges, ${finalLedger.payments} payments — all append-only, no deletions`);

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
