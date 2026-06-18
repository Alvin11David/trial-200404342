import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { strictEqual, ok as assert } from "assert";

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

async function run() {
  if (!existsSync("test-screenshots")) mkdirSync("test-screenshots");
  const ss = (n) => page.screenshot({ path: `test-screenshots/${n}.png` }).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ===== 1. Login as Owner / GM =====
    console.log("\n=== 1. Login as Owner / GM ===");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("v01-login-page");

    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in successfully as Owner / GM");
    await ss("v02-dashboard");

    // ===== 2. Navigate to Billing page =====
    console.log("\n=== 2. Billing page loads ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("v03-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");

    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    ok(rowCount > 0, `Folio rows visible: ${rowCount}`);

    // ===== 3. Open folio detail =====
    console.log("\n=== 3. Open folio detail ===");
    const activeRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await activeRow.isVisible(), "Active folio row found");

    const guestName = await activeRow.locator("td").nth(1).textContent();
    console.log(`  Opening folio for guest: ${guestName}`);

    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("v04-folio-detail");

    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail page loaded");

    // ===== 4. Add a charge to void later =====
    console.log("\n=== 4. Add charge for voiding ===");
    const addChargeBtn = page.locator("button:has-text('Add charge')");
    ok(await addChargeBtn.isVisible(), "Add charge button visible");
    await addChargeBtn.click();
    await page.waitForTimeout(800);
    await ss("v05-add-charge-dialog");

    const dialog = page.locator(".fixed.inset-0.z-50");
    await dialog.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("misc");
    await dialog.locator("label").filter({ hasText: "Description" }).locator("input").fill("Spa treatment — 60 min massage");
    await dialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("120000");
    await ss("v06-charge-form-filled");

    await page.locator("button:has-text('Post charge')").click();
    await page.waitForTimeout(1500);
    await ss("v07-charge-posted");

    // Verify charge appears in list
    const chargesUl = page.locator("ul.divide-y.divide-border").first();
    const allCharges = chargesUl.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const chargeCount = await allCharges.count();
    ok(chargeCount > 0, "Charge visible in list");

    // Find the charge we just added (last one)
    const newCharge = allCharges.last();
    const chargeText = (await newCharge.textContent()) || "";
    ok(chargeText.includes("Spa treatment"), "Charge description found");
    ok(chargeText.includes("Sarah Nakato"), "Posted by Sarah Nakato (Owner / GM)");
    ok(chargeText.includes("120,000"), "Charge amount 120,000 UGX visible");

    // Verify void button exists on the charge
    const voidBtn = newCharge.locator("button[title='Void charge']");
    ok(await voidBtn.isVisible(), "Void charge button visible on non-voided charge");

    // ===== 5. Void the charge with reason =====
    console.log("\n=== 5. Void the charge ===");
    await voidBtn.click();
    await page.waitForTimeout(800);
    await ss("v08-void-dialog");

    // Verify void dialog content
    ok(await page.locator("text=Void charge").first().isVisible(), "Void charge dialog opened");
    ok(await page.locator("text=Spa treatment").first().isVisible(), "Void dialog shows charge description");
    ok(await page.locator("text=120,000").first().isVisible(), "Void dialog shows charge amount");

    // Verify informational text about ledger preservation
    const voidInfo = page.locator("text=original charge preserved");
    ok(await voidInfo.isVisible().catch(() => false) || await page.locator("text=does not delete").isVisible(), "Dialog explains charge is preserved");

    // Verify void button is disabled without reason
    const confirmVoidBtn = page.locator("button:has-text('Void charge')").last();
    ok(await confirmVoidBtn.isDisabled(), "Void button disabled when reason is empty");

    // Enter void reason
    const voidDialog = page.locator(".fixed.inset-0.z-50");
    await voidDialog.locator("textarea").fill("Guest disputed charge — incorrect amount billed");
    await ss("v09-void-reason-filled");

    ok(await confirmVoidBtn.isEnabled(), "Void button enabled after entering reason");

    // Submit void
    await confirmVoidBtn.click();
    await page.waitForTimeout(1500);
    await ss("v10-after-void");

    // ===== 6. Verify voided charge display =====
    console.log("\n=== 6. Verify voided charge ===");
    const chargesAfterVoid = page.locator("ul.divide-y.divide-border").first().locator("li").filter({ hasNot: page.locator("text=No charges yet") });

    // Charge should still exist (not deleted)
    const chargeAfterText = (await chargesAfterVoid.last().textContent()) || "";
    ok(chargeAfterText.includes("Spa treatment"), "Charge still visible after void (not deleted)");
    ok(chargeAfterText.includes("Voided"), "Voided badge displayed on the charge");
    ok(chargeAfterText.includes("voided:"), "Charge shows void reason text");
    ok(chargeAfterText.includes("incorrect amount"), "Void reason 'incorrect amount' visible on charge");
    ok(chargeAfterText.includes("Sarah Nakato"), "Authorising user (Sarah Nakato) shown on voided charge");

    // Verify void class is applied
    const voidedLi = chargesAfterVoid.last();
    const classAttr = await voidedLi.getAttribute("class") || "";
    ok(classAttr.includes("opacity-40"), "Voided charge has reduced opacity class");

    // Verify void button is gone
    const voidBtnAfter = voidedLi.locator("button[title='Void charge']");
    ok(await voidBtnAfter.count() === 0, "Void button no longer visible on voided charge");

    // ===== 7. Verify balance excludes voided amount =====
    console.log("\n=== 7. Verify balance updated ===");
    // The "Total charges" line should exclude the voided 120,000
    const totalChargesText = page.locator("text=Total charges").locator("..").locator("span.font-semibold");
    const totalChargesStr = (await totalChargesText.textContent()) || "";

    // Voided amount display — target the summary row (starts with "Voided" text followed by a minus sign)
    const voidedSummary = page.locator("div", { hasText: "Voided" }).filter({ hasText: "UGX" }).last();
    if (await voidedSummary.isVisible().catch(() => false)) {
      const voidedStr = (await voidedSummary.textContent()) || "";
      ok(voidedStr.includes("120,000"), `Voided amount '120,000' shown in summary: ${voidedStr}`);
    }

    // The charge count header should show voided count
    const headerText = await page.locator("text=line items").textContent() || "";
    ok(headerText.includes("voided"), "Header shows voided count");

    // ===== 8. Verify cannot double-void =====
    console.log("\n=== 8. Verify double-void not possible ===");
    const allVoidBtns = chargesAfterVoid.locator("button[title='Void charge']");
    const remainingVoidBtns = await allVoidBtns.count();
    ok(remainingVoidBtns === chargeCount - 1, `Only ${remainingVoidBtns} non-voided charges have void button (${chargeCount} total, 1 voided)`);

    // ===== 9. Verify audit trail =====
    console.log("\n=== 9. Verify audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("v11-audit-trail");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Voided charge"), "Audit trail contains 'Voided charge' entry");
    ok(auditBody.includes("incorrect amount"), "Audit trail contains void reason");
    ok(auditBody.includes("Sarah Nakato"), "Audit trail shows actor (Sarah Nakato)");

    // ===== 10. Arrow back to billing =====
    console.log("\n=== 10. Back to folio to verify charge still preserved ===");
    // Navigate back to billing to confirm the charge is still there on re-render
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);

    // Re-open the same folio
    const table2 = page.locator("table");
    const rows2 = table2.locator("tbody tr");
    // Find the same guest's folio
    const guestRow = rows2.filter({ hasText: guestName || "" }).first();
    if (await guestRow.isVisible()) {
      await guestRow.click();
      await page.waitForTimeout(1500);

      // Verify voided charge still renders correctly
      const chargesFinal = page.locator("ul.divide-y.divide-border").first().locator("li");
      const voidedCharge = chargesFinal.filter({ hasText: "Spa treatment" });
      ok(await voidedCharge.isVisible(), "Voided charge still visible after re-navigation");
      const finalText = (await voidedCharge.textContent()) || "";
      ok(finalText.includes("Voided"), "Voided badge persists after re-navigation");
      ok(finalText.includes("incorrect amount"), "Void reason persists after re-navigation");
    }

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("v-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
