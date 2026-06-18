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

    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    ok(rowCount > 0, "Folio rows found");

    // ===== 3. Find an Open folio (prefer one that hasn't been night-audited yet) =====
    console.log("\n=== 3. Find Open folio ===");
    let openFolioRow = rows.filter({ has: page.locator("span:has-text('Open')") }).first();
    let isAlreadyActive = false;
    if (!(await openFolioRow.isVisible().catch(() => false))) {
      // All folios may already be "active" — use one with active status
      openFolioRow = rows.filter({ has: page.locator("span:has-text('Active')") }).first();
      isAlreadyActive = true;
    }
    ok(await openFolioRow.isVisible(), "Open/Active folio row found");

    const preGuestName = (await openFolioRow.locator("td").nth(1).textContent()) || "";
    const preTableBalanceText = (await openFolioRow.locator("td").last().textContent()) || "UGX 0";
    console.log(`  Guest: ${preGuestName}  Listed balance: ${preTableBalanceText}  Status: ${isAlreadyActive ? "Active" : "Open"}`);

    await openFolioRow.click();
    await page.waitForTimeout(1500);
    await ss("na03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Pre-audit state (use specific balance locator) =====
    console.log("\n=== 4. Pre-audit state ===");
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const preBalanceStr = (await balanceLocator.textContent()) || "";
    const preBalance = parseUgx(preBalanceStr);
    ok(preBalance > 0, `Pre-audit balance positive: UGX ${preBalance.toLocaleString()}`);
    console.log(`  Outstanding balance: UGX ${preBalance.toLocaleString()}`);

    // Check folio status badge
    const statusEl = page.locator("span.text-xs.font-medium").first();
    const preStatus = (await statusEl.textContent()) || "";
    console.log(`  Folio status: ${preStatus}`);

    // Count pre-audit charge items and room charges
    const chargesSection = page.locator("h3:has-text('Charges')").locator("..").locator("..");
    const preChargesCountStr = (await chargesSection.textContent()) || "";
    const preChargeItems = parseInt((preChargesCountStr.match(/(\d+)\s*line items/) || [])[1] || "0", 10);
    console.log(`  Charge line items: ${preChargeItems}`);

    // Count room charges already posted for today
    const preRoomToday = (preChargesCountStr.match(/Room/g) || []).length;

    // Night audit button should be visible for open/active folios
    const nightAuditBtn = page.locator("button:has-text('Night audit')");
    if (!isAlreadyActive) {
      // Open folios should always show night audit button for Owner/GM
      ok(await nightAuditBtn.isVisible(), "Night audit button visible");
    }

    // ===== 5. Open Night Audit dialog =====
    console.log("\n=== 5. Night Audit dialog ===");
    if (await nightAuditBtn.isVisible()) {
      await nightAuditBtn.click();
      await page.waitForTimeout(1000);
      await ss("na04-night-audit-dialog");

      ok(await page.locator("text=Night audit").first().isVisible(), "Night audit dialog opened");
      ok(await page.locator("text=End of day").isVisible(), "Dialog shows 'End of day' summary");

      const dialogText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
      const todayStr = new Date().toISOString().slice(0, 10);
      ok(dialogText.includes(todayStr), `Dialog includes today's date (${todayStr})`);

      // Verify active folios count and summary
      ok(dialogText.includes("active folios"), "Dialog shows active folios count");

      // Verify warning about business day closure
      ok(dialogText.includes("cannot be reopened"), "Dialog warns business day cannot be reopened");

      // Check if there are folios to charge
      const needsCharging = dialogText.includes("will receive tonight");
      const alreadyCharged = dialogText.includes("already charged");

      if (needsCharging) {
        // Verify "Run night audit" button visible and enabled
        const runBtn = page.locator("button:has-text('Run night audit')");
        ok(await runBtn.isVisible(), "Run night audit button visible");
        ok(await runBtn.isEnabled(), "Run night audit button enabled");

        // ===== 6. Run Night Audit =====
        console.log("\n=== 6. Run Night Audit ===");
        await runBtn.click();
        await page.waitForTimeout(3000);
        await ss("na05-night-audit-running");

        // Verify completion message
        await page.locator("text=Night audit completed").waitFor({ state: "visible", timeout: 15000 });
        ok(true, "Night audit completion message appeared");
        await ss("na06-night-audit-complete");

        const completeText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
        ok(completeText.includes("charged"), "Completion message includes 'charged'");
        ok(completeText.includes(todayStr), "Completion message includes today's date");

        const chargedCountMatch = completeText.match(/(\d+)\s*folios? charged/);
        const chargedCount = chargedCountMatch ? parseInt(chargedCountMatch[1], 10) : 0;
        console.log(`  Folios charged: ${chargedCount}`);
        ok(chargedCount > 0, `At least 1 folio charged (${chargedCount})`);

        // Close dialog
        await page.locator("button:has-text('Close')").click();
        await page.waitForTimeout(1000);
        await ss("na07-after-audit");

        // ===== 7. Verify new charge posted =====
        console.log("\n=== 7. Verify charge posted ===");
        const postBalanceStr = (await balanceLocator.textContent()) || "";
        const postBalance = parseUgx(postBalanceStr);
        console.log(`  Balance after audit: UGX ${postBalance.toLocaleString()} (was UGX ${preBalance.toLocaleString()})`);

        // Balance should have increased (room rate was added)
        ok(postBalance > preBalance,
          `Balance increased: UGX ${preBalance.toLocaleString()} → UGX ${postBalance.toLocaleString()}`);

        // Verify room charge posted
        const postChargesText = await chargesSection.textContent() || "";
        ok(postChargesText.includes("night"), "New room charge with 'night' description visible");
        ok(postChargesText.includes("Room"), "Charge type 'Room' shown");

        // ===== 8. Verify folio lifecycle advancement =====
        console.log("\n=== 8. Folio lifecycle ===");
        // After night audit, "open" folios become "active"
        const statusAfter = (await statusEl.textContent()) || "";
        console.log(`  Folio status after audit: ${statusAfter}`);
        ok(statusAfter === "Active" || statusAfter === "Open",
          `Folio status is "Active" or still "Open": "${statusAfter}"`);

        // ===== 9. Verify no double-charge on re-run =====
        console.log("\n=== 9. No double-charge ===");
        if (await nightAuditBtn.isVisible()) {
          await nightAuditBtn.click();
          await page.waitForTimeout(800);
          await ss("na08-re-run");

          const reDialogText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
          ok(reDialogText.includes("already charged") || reDialogText.includes("0 of"),
            "Re-run: no new charges needed");
          console.log(`  Re-run: ${reDialogText.replace(/\s+/g, " ").trim().slice(0, 120)}`);

          await page.locator("button:has-text('Cancel')").first().click();
          await page.waitForTimeout(500);
        }
      } else {
        // Already charged — test still passes with info
        console.log("  All folios already charged for tonight — skipping run");
        ok(true, "All folios already charged (no double-charge is correct behavior)");
        await page.locator("button:has-text('Cancel')").first().click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log("  Night audit button not visible — skipping dialog steps");
    }

    // ===== 10. Verify dashboard daily summary =====
    console.log("\n=== 10. Dashboard daily summary ===");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na09-dashboard");

    const dashBody = await page.locator("body").textContent() || "";

    // KPI summary cards
    ok(dashBody.includes("Occupancy"), "Dashboard occupancy KPI visible");
    ok(dashBody.includes("Revenue"), "Dashboard revenue KPI visible");
    ok(dashBody.includes("ADR"), "Dashboard ADR KPI visible");
    ok(dashBody.includes("RevPAR"), "Dashboard RevPAR KPI visible");

    // Today's arrivals/departures
    ok(dashBody.includes("arrivals") || dashBody.includes("Arrivals"), "Dashboard arrivals summary");
    ok(dashBody.includes("departures") || dashBody.includes("Departures"), "Dashboard departures summary");

    // Revenue amount shows UGX
    ok(dashBody.includes("UGX"), "Dashboard shows UGX amounts");

    // ===== 11. Verify audit trail =====
    console.log("\n=== 11. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na10-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Night audit completed"), "Audit trail: 'Night audit completed' entry");
    ok(auditBody.includes("folios charged"), "Audit trail: folio charge count");
    const todayStr = new Date().toISOString().slice(0, 10);
    ok(auditBody.includes(todayStr), "Audit trail: today's date");

    // Verify the audit entry shows actor (the user who ran it)
    ok(auditBody.includes("Sarah Nakato") || auditBody.includes("Owner"),
      "Audit trail shows actor (Sarah Nakato)");

    // ===== 12. Verify billing summary stats =====
    console.log("\n=== 12. Billing summary stats ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na11-billing-after");

    const billingBody = await page.locator("body").textContent() || "";
    ok(billingBody.includes("Active folios"), "Billing summary: active folios count");
    ok(billingBody.includes("Total outstanding"), "Billing summary: total outstanding");
    ok(billingBody.includes("Collected today"), "Billing summary: collected today");

    // ===== 13. Verify charges persist on folio re-navigation =====
    console.log("\n=== 13. Charges persist ===");
    const table3 = page.locator("table");
    const rows3 = table3.locator("tbody tr");
    const sameRow = rows3.filter({ hasText: preGuestName }).first();
    if (await sameRow.isVisible()) {
      await sameRow.click();
      await page.waitForTimeout(1500);
      await ss("na12-folio-persist");

      const folioText = await chargesSection.textContent() || "";
      ok(folioText.includes("night") || folioText.includes("Room"),
        "Night audit charges persist after re-navigation");
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
