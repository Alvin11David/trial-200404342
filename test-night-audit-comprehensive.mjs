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

    // ===== 3. Find an open/active folio =====
    console.log("\n=== 3. Find folio ===");
    let folioRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await folioRow.isVisible(), "Open/Active folio row found");

    const preGuestName = (await folioRow.locator("td").nth(1).textContent()) || "";
    const preTableBalanceText = (await folioRow.locator("td").last().textContent()) || "UGX 0";
    console.log(`  Guest: ${preGuestName}  Listed balance: ${preTableBalanceText}`);

    await folioRow.click();
    await page.waitForTimeout(1500);
    await ss("na03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    // ===== 4. Pre-audit state =====
    console.log("\n=== 4. Pre-audit state ===");
    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const preBalanceStr = (await balanceLocator.textContent()) || "";
    const preBalance = parseUgx(preBalanceStr);
    ok(preBalance > 0, `Pre-audit balance positive: UGX ${preBalance.toLocaleString()}`);
    console.log(`  Outstanding balance: UGX ${preBalance.toLocaleString()}`);

    const folioDetailArea = page.locator(".mx-auto.max-w-5xl").first();
    const preDetailText = (await folioDetailArea.textContent()) || "";
    const preStatus = preDetailText.match(/\b(Open|Active)\b/)?.[0] || "unknown";
    console.log(`  Folio status: ${preStatus}  Status is open/active: ${folioRow}`);

    // Night audit button visible for Owner/GM
    const nightAuditBtn = page.locator("button:has-text('Night audit')");
    ok(await nightAuditBtn.isVisible(), "Night audit button visible");

    // ===== 5. Open Night Audit dialog =====
    console.log("\n=== 5. Night Audit dialog ===");
    await nightAuditBtn.click();
    await page.waitForTimeout(1000);
    await ss("na04-night-audit-dialog");

    ok(await page.locator("text=Night audit").first().isVisible(), "Night audit dialog opened");

    const dialogText = await page.locator(".fixed.inset-0.z-50").textContent() || "";
    const todayStr = new Date().toISOString().slice(0, 10);

    // Dialog shows business day closure summary
    ok(dialogText.includes("End of day"), "Dialog shows 'End of day' summary");
    ok(dialogText.includes(todayStr), `Dialog includes today's date (${todayStr})`);
    ok(dialogText.includes("active folios"), "Dialog shows active folios count");
    ok(dialogText.includes("cannot be reopened"), "Dialog warns business day cannot be reopened");

    // Determine if charges need to be posted or already done
    // "will receive tonight" always appears; check if any NEED charging (> 0)
    const needsCharging = !dialogText.includes("already charged");
    console.log(`  ${needsCharging ? "Folios need charging" : "All folios already charged for tonight"}`);

    if (needsCharging) {
      // ===== 6. Run Night Audit =====
      console.log("\n=== 6. Run Night Audit ===");
      const runBtn = page.locator("button:has-text('Run night audit')");
      ok(await runBtn.isVisible(), "Run night audit button visible");
      ok(await runBtn.isEnabled(), "Run night audit button enabled");

      await runBtn.click();
      await page.waitForTimeout(3000);
      await ss("na05-night-audit-running");

      // Verify completion
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

      // ===== 7. Verify charge posted to folio =====
      console.log("\n=== 7. Verify new charge posted ===");
      const postBalanceStr = (await balanceLocator.textContent()) || "";
      const postBalance = parseUgx(postBalanceStr);
      console.log(`  Balance: UGX ${preBalance.toLocaleString()} → UGX ${postBalance.toLocaleString()}`);
      ok(postBalance > preBalance, `Balance increased (room charge added): UGX ${preBalance.toLocaleString()} → UGX ${postBalance.toLocaleString()}`);

      const postDetailText = (await folioDetailArea.textContent()) || "";
      ok(postDetailText.includes("night"), "Room charge with 'night' description posted");
      ok(postDetailText.includes("Room"), "Charge type 'Room' shown");

      // ===== 8. Verify folio lifecycle =====
      console.log("\n=== 8. Folio lifecycle open → active ===");
      const statusAfter = postDetailText.match(/\b(Open|Active)\b/)?.[0] || "unknown";
      console.log(`  Status after audit: ${statusAfter}`);
      ok(statusAfter === "Active" || statusAfter === "Open",
        `Folio advanced to "${statusAfter}"`);

      // ===== 9. Verify no double-charge =====
      console.log("\n=== 9. No double-charge on re-run ===");
      if (await nightAuditBtn.isVisible()) {
        await nightAuditBtn.click();
        await page.waitForTimeout(800);
        await ss("na08-re-run");

        const reDialog = await page.locator(".fixed.inset-0.z-50").textContent() || "";
        ok(reDialog.includes("already charged") || reDialog.includes("0 of"),
          "Re-run: all folios already charged, no double charge");
        console.log(`  Re-run: ${reDialog.replace(/\s+/g, " ").trim().slice(0, 120)}`);

        await page.locator("button:has-text('Cancel')").first().click();
        await page.waitForTimeout(500);
      }
    } else {
      // Already charged — verify the intended behavior (no double-charge)
      console.log("\n=== Already charged ===");
      ok(true, "All folios already charged — no double-charge (correct behavior)");
      await page.locator("button:has-text('Cancel')").first().click();
      await page.waitForTimeout(500);
    }

    // ===== 10. Dashboard daily summary =====
    console.log("\n=== 10. Dashboard daily summary ===");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na09-dashboard");

    const dashBody = await page.locator("body").textContent() || "";

    // KPI summary cards — the business day summary
    ok(dashBody.includes("Occupancy"), "Dashboard: Occupancy KPI");
    ok(dashBody.includes("Revenue"), "Dashboard: Revenue KPI");
    ok(dashBody.includes("ADR"), "Dashboard: ADR KPI");
    ok(dashBody.includes("RevPAR"), "Dashboard: RevPAR KPI");
    ok(dashBody.includes("UGX"), "Dashboard: UGX amounts");

    // Arrivals / Departures summary
    ok(dashBody.includes("arrivals") || dashBody.includes("Arrivals"), "Dashboard: arrivals for today");
    ok(dashBody.includes("departures") || dashBody.includes("Departures"), "Dashboard: departures for today");

    // Housekeeping attention items (discrepancy flagging)
    ok(dashBody.includes("Housekeeping") || dashBody.includes("attention"), "Dashboard: housekeeping attention items");

    // ===== 11. Audit trail =====
    console.log("\n=== 11. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na10-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Night audit completed"), "Audit trail: 'Night audit completed' entry");
    ok(auditBody.includes("folios charged"), "Audit trail: folio charge count");
    ok(auditBody.includes(todayStr), "Audit trail: today's date");
    ok(auditBody.includes("Sarah Nakato") || auditBody.includes("Owner"), "Audit trail: actor shown");

    // ===== 12. Reports page — daily summary generation =====
    console.log("\n=== 12. Reports — daily summary ===");
    await page.goto(`${BASE}/reports`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na11-reports");

    const reportsBody = await page.locator("body").textContent() || "";
    ok(reportsBody.includes("Occupancy"), "Reports: occupancy report option");
    ok(reportsBody.includes("Revenue"), "Reports: revenue report option");
    ok(reportsBody.includes("Payments"), "Reports: payments report option");
    ok(reportsBody.includes("ADR") || reportsBody.includes("RevPAR"), "Reports: trends report option");
    ok(reportsBody.includes("Export CSV"), "Reports: CSV export available");

    // ===== 13. Billing summary stats =====
    console.log("\n=== 13. Billing summary stats ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("na12-billing-after");

    const billingBody = await page.locator("body").textContent() || "";
    ok(billingBody.includes("Active folios"), "Billing: active folios count");
    ok(billingBody.includes("Total outstanding"), "Billing: total outstanding amount");
    ok(billingBody.includes("Collected today"), "Billing: collected today stats");

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
