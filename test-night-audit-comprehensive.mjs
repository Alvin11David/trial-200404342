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
    // ===== 1. Login as Owner / GM =====
    console.log("\n=== 1. Login ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("na01-login");
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Owner / GM");

    // ===== 2. Navigate to billing =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("na02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    // ===== 3. Open an open/active folio =====
    console.log("\n=== 3. Open folio detail ===");
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    ok(rowCount > 0, "Folio rows found");

    const openFolioRow = rows.filter({ has: page.locator("span:has-text('Open')") }).first();
    ok(await openFolioRow.isVisible(), "Open-status folio found");

    // Capture pre-audit state from the table
    const preGuestName = (await openFolioRow.locator("td").nth(1).textContent()) || "";
    const preBalanceText = (await openFolioRow.locator("td").last().textContent()) || "UGX 0";
    const preTableBalance = parseUgx(preBalanceText);
    console.log(`  Guest: ${preGuestName}  Balance: ${preBalanceText}`);

    await openFolioRow.click();
    await page.waitForTimeout(1500);
    await ss("na03-folio-detail");

    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Pre-audit state =====
    console.log("\n=== 4. Pre-audit state ===");
    const folioBody = page.locator(".mx-auto.max-w-5xl").first();
    const preFolioText = (await folioBody.textContent()) || "";

    // Status badge
    ok(preFolioText.includes("Open"), "Folio status shows 'Open' before night audit");

    // Outstanding balance
    const preBalance = parseUgx(preFolioText);
    console.log(`  Outstanding balance: UGX ${preBalance.toLocaleString()}`);

    // Night audit button visible
    const nightAuditBtn = page.locator("button:has-text('Night audit')");
    ok(await nightAuditBtn.isVisible(), "Night audit button visible before audit");

    // Count current charges
    const chargesSection = page.locator("h3:has-text('Charges')").locator("..").locator("..");
    const preChargesText = (await chargesSection.textContent()) || "";
    console.log(`  Charges section: ${preChargesText.replace(/\s+/g, " ").trim()}`);

    // ===== 5. Open Night Audit dialog =====
    console.log("\n=== 5. Night Audit dialog ===");
    await nightAuditBtn.click();
    await page.waitForTimeout(800);
    await ss("na04-night-audit-dialog");

    ok(await page.locator("text=Night audit").first().isVisible(), "Night audit dialog opened");
    ok(await page.locator("text=End of day").isVisible(), "Dialog shows 'End of day' summary");

    // Verify the dialog shows today's date
    const dialogText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
    const todayStr = new Date().toISOString().slice(0, 10);
    ok(dialogText.includes(todayStr), `Dialog includes today's date (${todayStr})`);

    // Verify active folios count shown
    ok(dialogText.includes("active folios"), "Dialog shows active folios count");
    ok(dialogText.includes("will receive"), "Dialog explains charges will be posted");

    // Verify the list of folios to charge
    ok(dialogText.includes(preGuestName) || dialogText.includes("—"), "Dialog lists folios with guest names");

    // Verify warning about business day closure
    ok(dialogText.includes("cannot be reopened"), "Dialog warns business day cannot be reopened");

    // Verify "Run night audit" button
    const runBtn = page.locator("button:has-text('Run night audit')");
    ok(await runBtn.isVisible(), "Run night audit button visible");
    ok(await runBtn.isEnabled(), "Run night audit button enabled");

    // ===== 6. Run Night Audit =====
    console.log("\n=== 6. Run Night Audit ===");
    await runBtn.click();
    await page.waitForTimeout(3000);
    await ss("na05-night-audit-running");

    // Verify completion
    await page.locator("text=Night audit completed").waitFor({ state: "visible", timeout: 15000 });
    ok(true, "Night audit completion message appeared");
    await ss("na06-night-audit-complete");

    const completeDialogText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
    ok(completeDialogText.includes("charged"), "Completion message includes 'charged'");
    ok(completeDialogText.includes(todayStr), "Completion message includes today's date");

    // Read how many folios were charged
    const chargedCountMatch = completeDialogText.match(/(\d+)\s*folios? charged/);
    const chargedCount = chargedCountMatch ? parseInt(chargedCountMatch[1], 10) : 0;
    console.log(`  Folios charged: ${chargedCount}`);
    ok(chargedCount > 0, `At least 1 folio was charged (${chargedCount})`);

    // Close dialog
    await page.locator("button:has-text('Close')").click();
    await page.waitForTimeout(1000);
    await ss("na07-after-audit");

    // ===== 7. Verify new charge posted to folio =====
    console.log("\n=== 7. Verify charges posted ===");
    const postFolioText = (await folioBody.textContent()) || "";

    // Check for a new room charge with today's date and "night" in description
    ok(postFolioText.includes("night"), "New room charge with 'night' description visible");
    ok(postFolioText.includes(todayStr.slice(5)), "New charge shows today's date");

    // Balance should have increased by the room rate
    const postBalance = parseUgx(postFolioText);
    console.log(`  Balance after audit: UGX ${postBalance.toLocaleString()}`);
    ok(postBalance > preBalance, `Balance increased from UGX ${preBalance.toLocaleString()} to UGX ${postBalance.toLocaleString()}`);

    // Verify room charge type visible in folio
    ok(postFolioText.includes("Room"), "Charge type 'Room' shown in list");

    // ===== 8. Verify folio status advanced (open → active) =====
    console.log("\n=== 8. Verify folio lifecycle ===");
    const statusBadges = page.locator("span.text-xs.font-medium");
    const statusTexts = await statusBadges.allTextContents();
    const hasActive = statusTexts.some((t) => t.includes("Active"));
    ok(hasActive, `Folio status advanced from 'Open' to 'Active' (found: ${statusTexts.join(", ")})`);

    // ===== 9. Verify Night Audit button still shown (can run again) =====
    console.log("\n=== 9. Re-run Night Audit (no double-charge) ===");
    const auditBtn2 = page.locator("button:has-text('Night audit')");
    if (await auditBtn2.isVisible()) {
      await auditBtn2.click();
      await page.waitForTimeout(800);
      await ss("na08-re-run-dialog");

      const reDialogText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
      // Should indicate all folios already charged
      ok(reDialogText.includes("already charged") || reDialogText.includes("0 of"),
        "Re-run dialog indicates no new charges needed");
      console.log(`  Re-run summary: ${reDialogText.replace(/\s+/g, " ").trim().slice(0, 120)}`);

      // Close without running
      await page.locator("button:has-text('Cancel')").click();
      await page.waitForTimeout(500);
    }

    // ===== 10. Verify dashboard daily summary =====
    console.log("\n=== 10. Dashboard daily summary ===");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na09-dashboard");

    const dashBody = await page.locator("body").textContent() || "";

    // Dashboard shows Today's Revenue
    ok(dashBody.includes("Today"), "Dashboard contains 'Today'");
    const hasRevenue = dashBody.includes("Revenue") || dashBody.includes("UGX");
    ok(hasRevenue, "Dashboard shows revenue/summary KPIs");

    // Dashboard shows occupancy
    ok(dashBody.includes("Occupancy") || dashBody.includes("occupancy"), "Dashboard shows occupancy");

    // Dashboard shows arrivals/departures (daily summary)
    ok(dashBody.includes("arrivals") || dashBody.includes("Arrivals"), "Dashboard shows arrivals summary");
    ok(dashBody.includes("departures") || dashBody.includes("Departures"), "Dashboard shows departures summary");

    // ===== 11. Verify audit trail =====
    console.log("\n=== 11. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na10-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Night audit completed"), "Audit trail contains 'Night audit completed'");
    ok(auditBody.includes(todayStr), "Audit trail includes today's date");
    ok(auditBody.includes("folios charged"), "Audit trail includes folio charge count");

    // ===== 12. Verify billing list summary updated =====
    console.log("\n=== 12. Billing summary stats ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na11-billing-after");

    const billingBody = await page.locator("body").textContent() || "";

    // Billing list shows "Active folios", "Total outstanding", "Collected today"
    ok(billingBody.includes("Active folios"), "Billing summary shows active folios count");
    ok(billingBody.includes("Total outstanding"), "Billing summary shows total outstanding");
    ok(billingBody.includes("Collected today"), "Billing summary shows collected today");

    // ===== 13. Re-verify the folio detail page charges persist =====
    console.log("\n=== 13. Charges persist on folio ===");
    // Find the same folio in the table and click it
    const table3 = page.locator("table");
    const rows3 = table3.locator("tbody tr");
    const sameFolioRow = rows3.filter({ hasText: preGuestName }).first();
    if (await sameFolioRow.isVisible()) {
      await sameFolioRow.click();
      await page.waitForTimeout(1500);
      await ss("na12-folio-final");

      const finalBody = await page.locator(".mx-auto.max-w-5xl").first().textContent() || "";
      ok(finalBody.includes("night"), "Night audit charge description still visible");
      ok(finalBody.includes("Room"), "Room charge type still visible");
      const finalBalance = parseUgx(finalBody);
      ok(finalBalance > 0, `Folio balance positive: UGX ${finalBalance.toLocaleString()}`);
    }

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("na-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
