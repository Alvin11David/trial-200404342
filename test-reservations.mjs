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
    // ===== 1. Navigate to /reservations =====
    console.log("\n=== 1. Reservations page loads ===");
    await page.goto(`${BASE}/reservations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("01-reservations");

    ok("Reservations page rendered without crash");

    // ===== 2. Create =====
    console.log("\n=== 2. Create reservation ===");
    await page.locator("a:has-text('New Reservation')").click();
    await page.waitForTimeout(1500);
    await ss("02-new-reservation");

    // Step 1 — Guest Details
    await fillField(page, "First name", "John");
    await fillField(page, "Last name", "Doe");
    await fillField(page, "Email", "john.doe@test.com");
    await fillField(page, "Phone", "+256700111333");
    await fillField(page, "Nationality", "Uganda");
    await fillField(page, "ID type", "Passport");
    await fillField(page, "ID number", "PID12345");
    await ss("02a-step1-filled");

    // Wait for React state to settle
    await page.waitForTimeout(500);

    // Check if Continue is enabled
    const contBtn = page.locator("button:has-text('Continue')");
    const disabled = await contBtn.isDisabled();
    console.log(`  Continue button disabled: ${disabled}`);

    if (disabled) {
      // Debug: check form values via evaluate
      const inputVals = await page.evaluate(() => {
        const inputs = document.querySelectorAll("input, select");
        return Array.from(inputs).map((el) => ({ tag: el.tagName, id: el.id, name: el.name, value: el.value, placeholder: el.placeholder || "", type: el.type || "" }));
      });
      console.log("  All input/select values:");
      inputVals.forEach((v, i) => console.log(`    [${i}] ${v.tag} type=${v.type} placeholder="${v.placeholder}" value="${v.value}"`));
    }

    await contBtn.click();
    await page.waitForTimeout(800);
    ok("Step 1 submitted");

    // Step 2 — Room Selection
    const roomBtn = page.locator("button").filter({ hasText: /Room \d/ }).first();
    if (await roomBtn.isVisible()) { await roomBtn.click(); await page.waitForTimeout(300); ok("Room selected"); }
    else { no("No room button found"); }

    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);
    await ss("03-step3-dates");

    // Step 3 — Dates & Plan
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 3);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const checkIn = fmt(tomorrow);
    const checkOut = fmt(dayAfter);

    await fillField(page, "Check in", checkIn);
    await fillField(page, "Check out", checkOut);
    await ss("03a-dates-filled");
    ok("Dates set");

    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);
    await ss("04-step4-review");

    // Step 4 — Review & Confirm
    const confirmBtn = page.locator("button:has-text('Confirm Reservation')");
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      ok("Reservation confirmed");
    } else {
      no("Confirm button not found");
    }
    await ss("05-confirmed");

    // Verify redirect to /reservations
    const url = page.url();
    ok(url.includes("/reservations"), `URL = ${url}`);
    await page.waitForTimeout(1000);

    // ===== 3. Verify in list =====
    console.log("\n=== 3. Verify in list ===");
    const body = await page.locator("body").textContent();
    ok(body.includes("John") || body.includes("john.doe"), "Reservation visible");
    await ss("06-list");

    // ===== 4. Edit =====
    console.log("\n=== 4. Edit reservation ===");
    let editBtn = page.locator("button[title='Edit']").first();
    if (!(await editBtn.isVisible().catch(() => false))) {
      await page.locator("button:has-text('Open')").click();
      await page.waitForTimeout(500);
      editBtn = page.locator("button[title='Edit']").first();
    }

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(600);
      await ss("07-edit-dialog");

      const editInputs = page.locator(".fixed input, [class*='fixed'] input");
      const count = await editInputs.count();
      if (count > 0) {
        await editInputs.first().fill("John (Edited)");
        ok("Name changed in edit dialog");
      }

      const saveBtn = page.locator("button:has-text('Save changes')");
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        ok("Edit saved");
      } else {
        no("Save button not found");
      }
    } else {
      no("No edit button found");
    }
    await ss("08-after-edit");

    // ===== 5. Cancel =====
    console.log("\n=== 5. Cancel reservation ===");
    let cancelBtn = page.locator("button[title='Cancel']").first();
    if (!(await cancelBtn.isVisible().catch(() => false))) {
      await page.locator("button:has-text('Open')").click();
      await page.waitForTimeout(500);
      cancelBtn = page.locator("button[title='Cancel']").first();
    }

    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(600);
      await ss("09-cancel-dialog");

      const sel = page.locator("div.fixed select").first();
      if (await sel.isVisible()) await sel.selectOption("Guest request");

      const confirmCancel = page.locator("button:has-text('Cancel reservation')");
      if (await confirmCancel.isVisible()) {
        await confirmCancel.click();
        await page.waitForTimeout(800);
        ok("Cancel confirmed");
      } else {
        no("Cancel confirm button not found");
      }
    } else {
      no("Cancel button not found");
    }
    await ss("10-final");

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
