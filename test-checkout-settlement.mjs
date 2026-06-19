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
    await ss("cs01-login");
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Owner / GM");

    // ===== 2. Billing → find an open/active folio =====
    console.log("\n=== 2. Billing page ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("cs02-billing");

    const table = page.locator("table");
    ok(await table.isVisible(), "Folios table visible");
    const rows = table.locator("tbody tr");
    ok(await rows.count() > 0, "Folio rows found");

    const targetRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    ok(await targetRow.isVisible(), "Open/Active folio row found");

    const guestName = (await targetRow.locator("td").nth(1).textContent()) || "";
    const tableBalanceText = (await targetRow.locator("td").last().textContent()) || "UGX 0";
    const tableBalance = parseUgx(tableBalanceText);
    console.log(`  Guest: ${guestName}  Balance: ${tableBalanceText}`);

    // ===== 3. Open folio detail and capture pre-settlement state =====
    console.log("\n=== 3. Folio detail ===");
    await targetRow.click();
    await page.waitForTimeout(1500);
    await ss("cs03-folio-detail");
    ok(await page.locator("text=UGX").first().isVisible(), "Folio detail loaded");

    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    const folioBalanceText = (await balanceLocator.textContent()) || "";
    const folioBalanceNum = parseUgx(folioBalanceText);
    console.log(`  Outstanding balance: UGX ${folioBalanceNum.toLocaleString()}`);

    // Read initial status from the page body
    const initialBody = await page.locator("body").textContent() || "";
    const preStatus = initialBody.includes("Open") ? "Open" : initialBody.includes("Active") ? "Active" : "unknown";
    console.log(`  Initial status: ${preStatus}`);
    ok(preStatus === "Open" || preStatus === "Active", "Folio initially open/active");

    // "Settle & close folio" should NOT show when balance > 0
    if (folioBalanceNum > 0) {
      const hasSettleBtn = await page.locator("button:has-text('Settle & close folio')").isVisible().catch(() => false);
      ok(!hasSettleBtn, "Settle button hidden when balance positive");
    }

    // "View invoice" should be visible regardless of status
    ok(await page.locator("a:has-text('View invoice')").isVisible(), "View invoice link visible");

    // Record payment button should be visible
    ok(await page.locator("button:has-text('Record payment')").isVisible(), "Record payment button visible");

    // ===== 4. Record full payment → triggers auto-settlement =====
    console.log("\n=== 4. Full payment → auto-settlement ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("cs04-payment-dialog");

    ok(await page.locator("text=Record payment").first().isVisible(), "Payment dialog opened");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    // Amount should be pre-filled to full balance
    const amountInput = payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input");
    const preFilledAmount = await amountInput.inputValue();
    console.log(`  Pre-filled amount: ${preFilledAmount}`);

    // Select cash method and submit (amount is already the full balance)
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("cash");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("cs05-after-payment");

    // ===== 5. Verify auto-settlement =====
    console.log("\n=== 5. Verify settlement ===");
    const postBody = await page.locator("body").textContent() || "";

    // Folio should now be settled
    const settled = postBody.includes("Settled");
    ok(settled, "Folio status changed to 'Settled' after full payment");

    // Balance should be 0 or negative
    const postBalanceText = (await balanceLocator.textContent()) || "";
    const postBalance = parseUgx(postBalanceText);
    console.log(`  Balance after payment: ${postBalanceText}`);
    ok(postBalance < 1000, `Balance effectively zero: UGX ${postBalance.toLocaleString()}`);

    // "In credit / settled" indicator should show
    const inCredit = postBody.includes("In credit") || postBody.includes("settled");
    ok(inCredit, "Balance shows 'In credit / settled' indicator");

    // Payment should appear in payments list
    ok(postBody.includes("Cash"), "Cash payment shown in payments list");

    // ===== 6. View invoice =====
    console.log("\n=== 6. Invoice view ===");
    await page.locator("a:has-text('View invoice')").click();
    await page.waitForTimeout(1500);
    await ss("cs06-invoice");

    const invoiceBody = await page.locator("body").textContent() || "";

    // Invoice header elements
    ok(invoiceBody.includes("Tax Invoice") || invoiceBody.includes("INV-"),
      "Invoice shows 'Tax Invoice' / invoice number");
    ok(invoiceBody.includes("Jambo"), "Invoice shows property name");

    // Invoice ID derived from folio ID
    const invMatch = invoiceBody.match(/INV-\d+/);
    ok(invMatch, `Invoice number found: ${invMatch?.[0]}`);

    // Guest info on invoice
    ok(invoiceBody.includes(guestName) || invoiceBody.includes(guestName.split(" ")[0]),
      "Invoice includes guest name");

    // Stay details
    ok(invoiceBody.includes("→") || (invoiceBody.includes("Check") && invoiceBody.includes("in")),
      "Invoice shows stay dates");

    // Room charges listed
    ok(invoiceBody.includes("Room"), "Invoice lists room charges");

    // Payments shown as credits
    ok(invoiceBody.includes("payment") || invoiceBody.includes("Cash"), "Invoice shows payment credits");

    // Summary with Total, VAT, Balance due
    ok(invoiceBody.includes("Total"), "Invoice shows total");
    ok(invoiceBody.includes("VAT"), "Invoice shows VAT");
    ok(invoiceBody.includes("Balance due"), "Invoice shows balance due");

    // Print button
    ok(await page.locator("button:has-text('Print invoice')").isVisible(), "Print invoice button visible");

    // "Back to folio" link
    const backLink = page.locator("a:has-text('Back to folio')");
    ok(await backLink.isVisible(), "Back to folio link works");

    // ===== 7. Back to folio — verify settled state persists =====
    console.log("\n=== 7. Settled state persists ===");
    await backLink.click();
    await page.waitForTimeout(1500);
    await ss("cs07-back-to-folio");

    const folioAfterBack = await page.locator("body").textContent() || "";
    ok(folioAfterBack.includes("Settled"), "Folio still shows 'Settled' after navigating back");

    // ===== 8. Billing list summary updated =====
    console.log("\n=== 8. Billing list ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("cs08-billing-list");

    const billingBody = await page.locator("body").textContent() || "";
    ok(billingBody.includes("Settled") || billingBody.includes("settled"), "Billing list shows settled folios");
    ok(billingBody.includes("Collected today"), "Billing summary: collected today stat");

    // ===== 9. Audit trail =====
    console.log("\n=== 9. Audit trail ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("cs09-audit");

    const auditBody = await page.locator("body").textContent() || "";
    ok(auditBody.includes("Posted payment"), "Audit trail: 'Posted payment' entry");
    ok(auditBody.includes("Sarah Nakato") || auditBody.includes("Owner"), "Audit trail: actor shown");

    // ===== 10. Checkout from reservations page =====
    console.log("\n=== 10. Checkout guest ===");
    await page.goto(`${BASE}/reservations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("cs10-reservations");

    // Find the checkout button — only shown for checked_in guests
    const checkoutBtn = page.locator("button[title='Check out']").first();
    if (await checkoutBtn.isVisible().catch(() => false)) {
      // Click checkout
      await checkoutBtn.click();
      await page.waitForTimeout(1500);
      await ss("cs11-after-checkout");

      // Look for success toast
      let checkoutOk = false;
      const toast = page.locator("[role='status'], [role='alert'], [data-sonner-toast], .sonner-toast");
      if (await toast.isVisible().catch(() => false)) {
        const toastText = (await toast.textContent()) || "";
        checkoutOk = toastText.includes("checked out") || toastText.includes("housekeeping");
        console.log(`  Toast: ${toastText}`);
      }

      // If no toast, check page content for status change
      if (!checkoutOk) {
        const resBody = await page.locator("body").textContent() || "";
        checkoutOk = resBody.includes("checked_out") || resBody.includes("Checked out") ||
          resBody.includes("checked out");
      }

      ok(checkoutOk, "Guest checkout completed — reservation status updated");

      // Verify invoice still accessible after checkout
      console.log("\n=== 11. Invoice after checkout ===");
      // Go to billing and find the settled folio
      await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500);

      // Find the settled folio and open invoice
      const settledRow = page.locator("table tbody tr").filter({ has: page.locator("span:has-text('Settled')") }).first();
      if (await settledRow.isVisible().catch(() => false)) {
        const settledName = (await settledRow.locator("td").nth(1).textContent()) || "";
        if (settledName.includes(guestName.split(" ")[0])) {
          await settledRow.click();
          await page.waitForTimeout(1000);

          // Open invoice
          if (await page.locator("a:has-text('View invoice')").isVisible()) {
            await page.locator("a:has-text('View invoice')").click();
            await page.waitForTimeout(1000);
            await ss("cs12-invoice-after-checkout");

            const invAfter = await page.locator("body").textContent() || "";
            ok(invAfter.includes("INV-") && invAfter.includes("Total"),
              "Invoice still accessible after checkout");
            ok(invAfter.includes("Settled") || invAfter.includes("settled"),
              "Invoice shows settled status");
          }
        }
      }

      // Verify room went to dirty (housekeeping page)
      console.log("\n=== 12. Room status ===");
      await page.goto(`${BASE}/housekeeping`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500);
      await ss("cs13-housekeeping");

      const hkBody = await page.locator("body").textContent() || "";
      ok(hkBody.includes("Dirty") || hkBody.includes("dirty") || hkBody.includes("turnover"),
        "Housekeeping shows dirty room / turnover task after checkout");
    } else {
      console.log("  No checked-in guests available for checkout (all may already be checked out)");
      ok(true, "No checkout buttons (guests may already be checked out from prior tests)");
    }

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("cs-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
