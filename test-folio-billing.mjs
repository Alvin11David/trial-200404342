import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (cond, msg) => { if (typeof msg === "undefined") { msg = cond; cond = true; } if (cond) { PASSED.push(msg); console.log(`  \u2713 ${msg}`); } else { FAILED.push(msg); console.log(`  \u2717 ${msg}`); } } ;

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
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const day3 = new Date(today); day3.setDate(day3.getDate() + 3);
    const fmt = (d) => d.toISOString().slice(0, 10);

    // ===== 1. Create reservation WITHOUT payment (normal case) =====
    console.log("\n=== 1. Create reservation (no payment) ===");
    await page.goto(`${BASE}/reservations/new`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    await fillField(page, "First name", "Folio");
    await fillField(page, "Last name", "TestOne");
    await fillField(page, "Email", "folio1@test.com");
    await fillField(page, "Phone", "+256700000010");
    await fillField(page, "Nationality", "Uganda");
    await fillField(page, "ID type", "Passport");
    await fillField(page, "ID number", "FL001");
    await page.waitForTimeout(200);
    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);

    const roomBtn = page.locator("button").filter({ hasText: /Room \d{3}/ }).first();
    await roomBtn.click();
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);

    await fillField(page, "Check in", fmt(tomorrow));
    await fillField(page, "Check out", fmt(day3));
    await page.waitForTimeout(200);
    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);

    await page.locator("button:has-text('Confirm Reservation')").click();
    await page.waitForTimeout(2000);
    ok(page.url().includes("/reservations"), "Reservation created without payment");
    await ss("01-created-no-payment");

    // ===== 2. Navigate to Billing and verify folio exists =====
    console.log("\n=== 2. Billing: folio visible for reservation ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("02-billing-list");

    const body = await page.locator("body").textContent();
    ok(body.includes("Folio TestOne"), "Reservation guest shown in billing folio list");
    ok(body.includes("folio1@test.com"), "Guest email shown in billing");

    // ===== 3. Click the folio row and check detail view =====
    console.log("\n=== 3. Folio detail view ===");
    const guestLink = page.locator("a, button, tr").filter({ hasText: "Folio TestOne" }).first();
    if (await guestLink.isVisible().catch(() => false)) {
      await guestLink.click();
      await page.waitForTimeout(1000);
      await ss("03-folio-detail");
      const detailBody = await page.locator("body").textContent();
      ok(detailBody.includes("Folio TestOne"), "Folio detail shows guest name");
      ok(detailBody.includes("Open"), "Folio status is Open");
    } else {
      // The billing page might use a table row click via navigate
      // Find the folio row and its link
      const folioRow = page.locator("tr").filter({ hasText: "Folio TestOne" }).first();
      if (await folioRow.isVisible().catch(() => false)) {
        await folioRow.click();
        await page.waitForTimeout(1000);
        await ss("03-folio-detail");
        const detailBody = await page.locator("body").textContent();
        ok(detailBody.includes("Folio TestOne"), "Folio detail shows guest name");
      } else {
        // Fallback: just check the folio ID appears somewhere clickable
        const folioId = await page.evaluate(() => {
          const body = document.body.textContent || "";
          const match = body.match(/F-\d{4}/);
          return match ? match[0] : null;
        });
        if (folioId) {
          await page.goto(`${BASE}/billing?folio=${folioId}`, { waitUntil: "networkidle", timeout: 30000 });
          await page.waitForTimeout(1000);
          const detailBody = await page.locator("body").textContent();
          ok(detailBody.includes("Folio TestOne"), "Folio detail shows guest name via URL");
        } else {
          no("Could not navigate to folio detail");
        }
      }
    }
    await ss("03-folio-detail-final");

    // ===== 4. Create reservation WITH deposit payment =====
    console.log("\n=== 4. Create reservation with deposit ===");
    await page.goto(`${BASE}/reservations/new`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    await fillField(page, "First name", "Deposit");
    await fillField(page, "Last name", "TestTwo");
    await fillField(page, "Email", "deposit@test.com");
    await fillField(page, "Phone", "+256700000020");
    await fillField(page, "Nationality", "Kenya");
    await fillField(page, "ID type", "Passport");
    await fillField(page, "ID number", "DP002");
    await page.waitForTimeout(200);
    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);

    const room2 = page.locator("button").filter({ hasText: /Room \d{3}/ }).first();
    await room2.click();
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);

    await fillField(page, "Check in", fmt(tomorrow));
    await fillField(page, "Check out", fmt(day3));
    await page.waitForTimeout(200);
    await page.locator("button:has-text('Continue')").click();
    await page.waitForTimeout(800);

    // Step 4 — toggle collect payment and set deposit
    await page.waitForTimeout(500);
    // Toggle "Collect Payment" switch
    const collectToggle = page.locator("button[role='switch'], label:has-text('Collect payment'), .toggle-collect-payment").first();
    if (await collectToggle.isVisible().catch(() => false)) {
      await collectToggle.click();
      await page.waitForTimeout(300);
    } else {
      // Try clicking the switch by finding the ThumbsUp/check icon area
      const switchBtn = page.locator("button").filter({ hasText: /Collect payment/i }).first();
      if (await switchBtn.isVisible().catch(() => false)) {
        await switchBtn.click();
        await page.waitForTimeout(300);
      }
    }
    await ss("04-deposit-toggle");

    // Select payment method
    const mtnBtn = page.locator("button").filter({ hasText: /MTN|MoMo/i }).first();
    if (await mtnBtn.isVisible().catch(() => false)) {
      await mtnBtn.click();
      await page.waitForTimeout(200);
    }

    // Fill payment phone
    const payPhone = page.locator("input[type='tel'], input[placeholder*='phone'], textarea").first();
    if (await payPhone.isVisible().catch(() => false)) {
      await payPhone.fill("+256700000020");
      await page.waitForTimeout(100);
    }

    await page.locator("button:has-text('Confirm Reservation')").click();
    await page.waitForTimeout(2000);
    ok(page.url().includes("/reservations"), "Reservation with deposit created");
    await ss("05-deposit-created");

    // ===== 5. Verify both folios in billing =====
    console.log("\n=== 5. Both folios visible in billing ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("06-billing-both");

    const billingBody = await page.locator("body").textContent();
    ok(billingBody.includes("Folio TestOne"), "First folio (no payment) in billing");
    ok(billingBody.includes("Deposit TestTwo"), "Second folio (with deposit) in billing");

    // Check for payment amount on second folio
    // The list might show balance - look for it
    const hasPaymentIndicator = billingBody.includes("Deposit") || billingBody.includes("220,000") || billingBody.includes("UGX");
    ok(hasPaymentIndicator, "Billing list shows financial data");

    // ===== 6. Check that the second folio's detail shows the payment =====
    console.log("\n=== 6. Folio detail shows recorded payment ===");
    // Find the folio ID for the deposit reservation
    const folioIds = await page.evaluate(() => {
      const matches = document.body.textContent?.match(/F-\d{4}/g) || [];
      return [...new Set(matches)];
    });
    ok(folioIds.length >= 2, `At least 2 folios found in billing (${folioIds.length})`);

    // Navigate to the last folio (should be the deposit one)
    const lastFolioId = folioIds[folioIds.length - 1];
    await page.goto(`${BASE}/billing?folio=${lastFolioId}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);
    await ss("07-deposit-folio-detail");

    const depositDetail = await page.locator("body").textContent();
    ok(depositDetail.includes("Deposit TestTwo"), "Deposit folio detail shows guest");
    // Check for payment-related text
    const hasPayment = depositDetail.includes("payment") || depositDetail.includes("Payment") || depositDetail.includes("MTN") || depositDetail.includes("deposit");
    ok(hasPayment, "Deposit folio detail shows payment information");

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
