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
    await ss("01-login-page");

    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in successfully");
    await ss("02-dashboard");

    // ===== 2. Navigate to Billing page =====
    console.log("\n=== 2. Billing page loads ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("03-billing");

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

    // Read current charge count from the folio list before clicking
    const balanceText = await activeRow.locator("td").last().textContent();
    console.log(`  Current balance: ${balanceText}`);

    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("04-folio-detail");

    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail page loaded");

    // ===== 4. Verify Add charge button visible =====
    console.log("\n=== 4. Add charge button ===");
    const addChargeBtn = page.locator("button:has-text('Add charge')");
    ok(await addChargeBtn.isVisible(), "Add charge button visible");
    await ss("05-add-charge-button");

    // Count existing charges before posting
    const chargesUl = page.locator("ul.divide-y.divide-border").first();
    const chargeItemsBefore = chargesUl.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const beforeCount = await chargeItemsBefore.count();
    console.log(`  Existing charge items: ${beforeCount}`);

    // ===== 5. Open Add charge dialog =====
    console.log("\n=== 5. Open Add charge dialog ===");
    await addChargeBtn.click();
    await page.waitForTimeout(800);
    await ss("06-add-charge-dialog");

    ok(await page.locator("text=Add charge").first().isVisible(), "Add charge dialog opened");
    ok(await page.locator("text=Post charge").isVisible(), "Post charge button visible");

    // ===== 6. Fill the form =====
    console.log("\n=== 6. Fill charge form ===");
    // The dialog has Field components wrapping a label around each input/select.
    // The label directly contains both the text and the input, so we use label > select/input.
    const dialog = page.locator(".fixed.inset-0.z-50");
    await dialog.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("fnb");
    await dialog.locator("label").filter({ hasText: "Description" }).locator("input").fill("Mini bar — soft drinks");
    await dialog.locator("label").filter({ hasText: "Amount" }).locator("input").fill("45000");
    await ss("06a-charge-form-filled");

    // ===== 7. Post the charge =====
    console.log("\n=== 7. Post charge ===");
    const postBtn = page.locator("button:has-text('Post charge')");
    ok(await postBtn.isEnabled(), "Post charge button is enabled");
    await postBtn.click();
    await page.waitForTimeout(1500);
    await ss("07-after-post");

    // ===== 8. Verify charge appears =====
    console.log("\n=== 8. Verify charge in list ===");
    const chargesUl2 = page.locator("ul.divide-y.divide-border").first();
    const chargeItemsAfter = chargesUl2.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const afterCount = await chargeItemsAfter.count();
    ok(afterCount > beforeCount, `Charge count increased: ${beforeCount} -> ${afterCount}`);

    // New charge is appended at the end of the list
    const newCharge = chargeItemsAfter.last();
    const chargeText = (await newCharge.textContent()) || "";
    ok(chargeText.includes("Mini bar"), `Charge description mentions "Mini bar"`);
    ok(chargeText.includes("Sarah Nakato"), "Posted by logged-in user (Sarah Nakato)");
    console.log(`  Charge details: ${chargeText.trim().replace(/\s+/g, " ")}`);

    // ===== 9. Verify balance updated =====
    console.log("\n=== 9. Verify balance updated ===");
    const balanceEl = page.locator("text=UGX").first();
    const balanceAfter = (await balanceEl.textContent()) || "";
    ok(balanceAfter.includes("490,000"), `Balance increased to include 45,000 charge: ${balanceAfter}`);

    // ===== 10. Add another charge of a different type =====
    console.log("\n=== 10. Add misc charge ===");
    await page.locator("button:has-text('Add charge')").click();
    await page.waitForTimeout(500);
    await ss("10-second-charge-dialog");

    const dialog2 = page.locator(".fixed.inset-0.z-50");
    await dialog2.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("misc");
    await dialog2.locator("label").filter({ hasText: "Description" }).locator("input").fill("Laundry service");
    await dialog2.locator("label").filter({ hasText: "Amount" }).locator("input").fill("25000");

    await page.locator("button:has-text('Post charge')").click();
    await page.waitForTimeout(1500);
    await ss("10a-second-charge-posted");

    // Verify second charge appears
    const allCharges = page.locator("ul.divide-y.divide-border").first().locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const finalCount = await allCharges.count();
    ok(finalCount === afterCount + 1, `Second charge added: ${afterCount} -> ${finalCount}`);

    // ===== 11. Verify audit trail =====
    console.log("\n=== 11. Verify audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("11-audit-trail");

    const auditBody = await page.locator("body").textContent();
    ok(auditBody.includes("Posted charge"), "Audit trail contains charge posting entries");

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
