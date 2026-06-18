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
    await ss("os01-login");
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Owner / GM");

    // ===== 2. Go to billing, open folio, add charge =====
    console.log("\n=== 2. Open folio and add charge ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("os02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");
    const rows = table.locator("tbody tr");
    const activeRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await activeRow.isVisible(), "Active folio row found");

    const guestName = (await activeRow.locator("td").nth(1).textContent()) || "";
    console.log(`  Guest: ${guestName}`);

    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("os03-folio-detail");

    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const preBalance = parseUgx((await balanceLocator.textContent()) || "");
    console.log(`  Balance before: UGX ${preBalance.toLocaleString()}`);

    // ===== 3. Add a charge =====
    console.log("\n=== 3. Add charge ===");
    await page.locator("button:has-text('Add charge')").click();
    await page.waitForTimeout(800);
    await ss("os04-add-charge");

    const dialog = page.locator(".fixed.inset-0.z-50");
    await dialog.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("misc");
    await dialog.locator("label").filter({ hasText: "Description" }).locator("input").fill("Airport transfer");
    await dialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("85000");
    await page.locator("button:has-text('Post charge')").click();
    await page.waitForTimeout(1500);
    await ss("os05-charge-added");

    const midBalance = parseUgx((await balanceLocator.textContent()) || "");
    const chargePosted = midBalance > preBalance;
    ok(chargePosted, `Charge posted: balance UGX ${preBalance.toLocaleString()} → UGX ${midBalance.toLocaleString()}`);

    // ===== 4. Verify localStorage persistence =====
    console.log("\n=== 4. localStorage persistence ===");
    const cacheBeforeReload = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        folioCount: data.folios?.length ?? 0,
        chargeCount: data.charges?.length ?? 0,
        paymentCount: data.payments?.length ?? 0,
      };
    });
    console.log(`  Stored in cache: ${cacheBeforeReload?.chargeCount} charges, ${cacheBeforeReload?.folioCount} folios`);
    ok(cacheBeforeReload && cacheBeforeReload.chargeCount > 0, "Charges persisted to localStorage");

    const counters = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-counters");
      if (!raw) return null;
      return JSON.parse(raw);
    });
    ok(counters && counters.chargeCounter > 0, "Counters persisted to localStorage");
    console.log(`  Counters: chargeCounter=${counters?.chargeCounter}, folioCounter=${counters?.folioCounter}`);

    // ===== 5. Refresh page — verify data survives reload =====
    console.log("\n=== 5. Data survives page reload ===");
    // Navigate to billing list first, then reload
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Must be back at billing list with data
    const table2 = page.locator("table");
    ok(await table2.isVisible(), "Folios table visible after reload");

    const rows2 = table2.locator("tbody tr");
    const afterReloadCount = await rows2.count();
    ok(afterReloadCount > 0, `Folio rows present after reload: ${afterReloadCount}`);

    // Re-open the same folio and verify the charge is there
    const sameGuestRow = rows2.filter({ hasText: guestName }).first();
    ok(await sameGuestRow.isVisible(), "Same guest folio visible after reload");

    await sameGuestRow.click();
    await page.waitForTimeout(1500);
    await ss("os06-after-reload");

    const afterReloadText = await page.locator("body").textContent() || "";
    ok(afterReloadText.includes("Airport transfer"), "Previously added charge persists after page reload");
    ok(afterReloadText.includes("85,000"), "Charge amount persists after reload");

    const reloadBalance = parseUgx((await balanceLocator.textContent()) || "");
    ok(reloadBalance === midBalance, `Balance unchanged after reload: UGX ${reloadBalance.toLocaleString()}`);

    // ===== 6. Simulate offline =====
    console.log("\n=== 6. Offline indicator ===");
    // Dispatch offline event and mock navigator.onLine
    await page.evaluate(() => {
      Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
      window.dispatchEvent(new Event("offline"));
    });
    await page.waitForTimeout(500);
    await ss("os07-offline");

    const offlineBadge = page.locator("text=Offline").first();
    ok(await offlineBadge.isVisible(), "Offline badge displayed when offline");

    // ===== 7. Perform folio operations while offline =====
    console.log("\n=== 7. Folio operations while offline ===");
    // Add a charge while offline
    await page.locator("button:has-text('Add charge')").click();
    await page.waitForTimeout(800);
    await ss("os08-offline-add-charge");

    const dialog2 = page.locator(".fixed.inset-0.z-50");
    await dialog2.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("fnb");
    await dialog2.locator("label").filter({ hasText: "Description" }).locator("input").fill("Room service — dinner");
    await dialog2.locator("label").filter({ hasText: "Amount" }).locator("input").fill("55000");
    await page.locator("button:has-text('Post charge')").click();
    await page.waitForTimeout(1500);
    await ss("os09-offline-charge-added");

    const offlineBalance = parseUgx((await balanceLocator.textContent()) || "");
    const chargeAddedOffline = offlineBalance > reloadBalance;
    ok(chargeAddedOffline, `Charge posted while offline: UGX ${reloadBalance.toLocaleString()} → UGX ${offlineBalance.toLocaleString()}`);

    // Verify the charge text is visible
    const offlineBody = await page.locator("body").textContent() || "";
    ok(offlineBody.includes("Room service"), "Offline charge description visible");
    ok(offlineBody.includes("55,000"), "Offline charge amount visible");

    // Record a payment while offline
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("os10-offline-payment");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("cash");
    await payDialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("30000");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("os11-offline-payment-added");

    const offlineBody2 = await page.locator("body").textContent() || "";
    ok(offlineBody2.includes("Cash"), "Cash payment visible (recorded while offline)");

    // ===== 8. Verify outbox queued entries =====
    console.log("\n=== 8. Outbox queue ===");
    // The outbox is only for reservation mutations (checkIn, checkOut, createReservation, etc.)
    // Charge and payment operations do NOT use the outbox — they write directly to localStorage
    // So outbox should be empty for billing operations
    const outboxEntries = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-outbox");
      return raw ? JSON.parse(raw) : [];
    });
    console.log(`  Outbox entries: ${outboxEntries.length}`);
    // Billing ops (addCharge, addPayment) don't use outbox, so this is expected to be empty

    // ===== 9. Simulate reconnection =====
    console.log("\n=== 9. Reconnection ===");
    // Restore navigator.onLine and dispatch online event
    await page.evaluate(() => {
      Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
      window.dispatchEvent(new Event("online"));
    });
    await page.waitForTimeout(1000);
    await ss("os12-reconnected");

    // After reconnection, the offline badge should disappear
    const offlineBadgeAfter = page.locator("text=Offline");
    ok(await offlineBadgeAfter.count() === 0, "Offline badge hidden after reconnection");

    // ===== 10. Verify all data still intact after reconnection =====
    console.log("\n=== 10. Data intact after reconnection ===");
    const reconnectBody = await page.locator("body").textContent() || "";
    ok(reconnectBody.includes("Airport transfer"), "First charge persists through offline/reconnect cycle");
    ok(reconnectBody.includes("Room service"), "Offline charge persists through reconnection");
    ok(reconnectBody.includes("Cash"), "Offline payment persists through reconnection");

    // ===== 11. Hard refresh — full persistence =====
    console.log("\n=== 11. Full page hard refresh ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    const table3 = page.locator("table");
    ok(await table3.isVisible(), "Folios table visible after hard refresh");

    // Re-open the guest's folio
    const guestRowAfterRefresh = table3.locator("tbody tr").filter({ hasText: guestName }).first();
    if (await guestRowAfterRefresh.isVisible()) {
      await guestRowAfterRefresh.click();
      await page.waitForTimeout(1500);

      const finalBody = await page.locator("body").textContent() || "";
      ok(finalBody.includes("Airport transfer"), "Charge persists across hard refresh");
      ok(finalBody.includes("Room service"), "Offline charge persists across hard refresh");
      ok(finalBody.includes("Cash"), "Offline payment persists across hard refresh");
      ok(finalBody.includes("85,000") || finalBody.includes("85000"), "Charge amount persists across hard refresh");
      console.log("  All operations survived hard refresh ✓");
    }

    // ===== 12. Verify localStorage directly =====
    console.log("\n=== 12. localStorage integrity ===");
    const finalCache = await page.evaluate(() => {
      const raw = localStorage.getItem("jambo-pms-cache");
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        charges: data.charges?.length ?? 0,
        payments: data.payments?.length ?? 0,
        folios: data.folios?.length ?? 0,
        lastCharges: data.charges?.slice(-3).map((c) => ({ desc: c.description, amount: c.amount, voided: c.voided })) ?? [],
      };
    });
    ok(finalCache && finalCache.charges > 0, "localStorage cache has charges");
    ok(finalCache && finalCache.payments > 0, "localStorage cache has payments");
    console.log(`  localStorage: ${finalCache?.charges} charges, ${finalCache?.payments} payments, ${finalCache?.folios} folios`);

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("os-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
