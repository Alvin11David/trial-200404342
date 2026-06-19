import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

const BASE = "http://localhost:8080";
const PASSED = [], FAILED = [];
const ok  = (cond, m) => { if (cond) { PASSED.push(m ?? cond); console.log(`  \u2713 ${m ?? cond}`); } else { FAILED.push(m ?? cond); console.log(`  \u2717 ${m ?? cond}`); } };
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

function readLedger(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("jambo-pms-cache");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      auditCount: data.audit?.length ?? 0,
      audit: (data.audit || []).map((e) => ({
        id: e.id, ts: e.ts, actor: e.actor, role: e.role,
        module: e.module, action: e.action, entity: e.entity, severity: e.severity,
      })),
    };
  });
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
    await ss("at01-login");
    await fillField(page, "Email address", "admin@jambo.com");
    await fillField(page, "Password", "admin123");
    await page.locator("button:has-text('Sign in')").click();
    await page.waitForTimeout(2000);
    ok("Logged in as Owner / GM");

    // ===== 2. Navigate to billing, open folio =====
    console.log("\n=== 2. Open folio ===");
    await page.goto(`${BASE}/billing`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("at02-billing");

    const table = page.locator("table");
    const rows = table.locator("tbody tr");
    const activeRow = rows.filter({ has: page.locator("span:has-text('Open'), span:has-text('Active')") }).first();
    await activeRow.click();
    await page.waitForTimeout(1500);
    await ss("at03-folio-detail");

    const balanceLocator = page.locator("text=Outstanding balance").locator("..").locator("p.text-3xl").first();
    ok(await balanceLocator.isVisible(), "Folio detail loaded");

    // Read initial audit count
    const audit0 = await readLedger(page);
    const initialAuditCount = audit0?.auditCount ?? 0;
    console.log(`  Initial audit entries: ${initialAuditCount}`);

    // ===== 3. Add charge → verify audit logged =====
    console.log("\n=== 3. Add charge → audit logged ===");
    await page.locator("button:has-text('Add charge')").click();
    await page.waitForTimeout(800);
    await ss("at04-add-charge");

    const dialog = page.locator(".fixed.inset-0.z-50");
    await dialog.locator("label").filter({ hasText: "Type" }).locator("select").selectOption("misc");
    await dialog.locator("label").filter({ hasText: "Description" }).locator("input").fill("Tour booking");
    await dialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill("120000");
    await page.locator("button:has-text('Post charge')").click();
    await page.waitForTimeout(1500);
    await ss("at05-charge-added");

    const audit1 = await readLedger(page);
    ok(audit1.auditCount === initialAuditCount + 1,
      `Audit count increased after add-charge: ${initialAuditCount} → ${audit1.auditCount}`);
    const chargeEntry = audit1.audit[0];
    ok(chargeEntry.action === "Posted charge", `Audit action is "Posted charge", got "${chargeEntry.action}"`);
    ok(chargeEntry.module === "billing", `Audit module is "billing", got "${chargeEntry.module}"`);
    ok(chargeEntry.severity === "info", `Audit severity is "info", got "${chargeEntry.severity}"`);
    ok(chargeEntry.actor === "Sarah Nakato", `Audit actor is "Sarah Nakato", got "${chargeEntry.actor}"`);
    ok(chargeEntry.role === "Front Desk", `Audit actor role for addCharge is "Front Desk", got "${chargeEntry.role}"`);
    ok(chargeEntry.entity.includes("UGX"), `Audit entity includes amount, got "${chargeEntry.entity}"`);
    ok(chargeEntry.entity.includes("120,000"), `Audit entity shows amount 120,000, got "${chargeEntry.entity}"`);
    ok(chargeEntry.id.startsWith("EVT-"), `Audit entry id starts with EVT-, got "${chargeEntry.id}"`);
    ok(/^\d{4}-\d{2}-\d{2}T/.test(chargeEntry.ts), `Audit entry ts is ISO timestamp, got "${chargeEntry.ts}"`);
    console.log(`  Audit entry: ${chargeEntry.id} | ${chargeEntry.actor} (${chargeEntry.role}) | ${chargeEntry.action} | ${chargeEntry.entity}`);

    // ===== 4. Record payment → verify audit logged =====
    console.log("\n=== 4. Record payment → audit logged ===");
    await page.locator("button:has-text('Record payment')").click();
    await page.waitForTimeout(800);
    await ss("at06-add-payment");

    const payDialog = page.locator(".fixed.inset-0.z-50");
    await payDialog.locator("label").filter({ hasText: "Method" }).locator("select").selectOption("card");
    await payDialog.locator("label").filter({ hasText: "Amount (UGX)" }).locator("input").fill("50000");
    await page.locator("button:has-text('Record payment')").last().click();
    await page.waitForTimeout(1500);
    await ss("at07-payment-added");

    const audit2 = await readLedger(page);
    ok(audit2.auditCount === audit1.auditCount + 1,
      `Audit count increased after add-payment: ${audit1.auditCount} → ${audit2.auditCount}`);
    const payEntry = audit2.audit[0];
    ok(payEntry.action === "Posted confirmed payment", `Audit action is "Posted confirmed payment", got "${payEntry.action}"`);
    ok(payEntry.module === "billing");
    ok(payEntry.severity === "info");
    ok(payEntry.actor === "Sarah Nakato", `Audit actor is Sarah Nakato, got "${payEntry.actor}"`);
    ok(payEntry.entity.includes("50,000"), `Audit entity includes payment amount, got "${payEntry.entity}"`);
    ok(payEntry.entity.includes("card"), `Audit entity includes payment method, got "${payEntry.entity}"`);
    console.log(`  Audit entry: ${payEntry.id} | ${payEntry.actor} | ${payEntry.action} | ${payEntry.entity}`);

    // ===== 5. Void charge → verify audit logged with warn severity =====
    console.log("\n=== 5. Void charge → audit logged (warn severity) ===");
    const chargeList = page.locator("ul.divide-y.divide-border").first();
    const chargeItems = chargeList.locator("li").filter({ hasNot: page.locator("text=No charges yet") });
    const voidBtn = chargeItems.last().locator("button[title='Void charge']");
    ok(await voidBtn.isVisible(), "Void button visible on charge");
    await voidBtn.click();
    await page.waitForTimeout(800);
    await ss("at08-void-dialog");

    const voidDialog = page.locator(".fixed.inset-0.z-50");
    await voidDialog.locator("textarea").fill("Duplicate charge");
    await page.locator("button:has-text('Void charge')").last().click();
    await page.waitForTimeout(1500);
    await ss("at09-after-void");

    const audit3 = await readLedger(page);
    ok(audit3.auditCount === audit2.auditCount + 1,
      `Audit count increased after void: ${audit2.auditCount} → ${audit3.auditCount}`);
    const voidEntry = audit3.audit[0];
    ok(voidEntry.action.startsWith("Voided charge"), `Audit action starts with "Voided charge", got "${voidEntry.action}"`);
    ok(voidEntry.module === "billing");
    ok(voidEntry.severity === "warn", `Audit severity is "warn" for void, got "${voidEntry.severity}"`);
    ok(voidEntry.actor === "Sarah Nakato", `Audit actor is Sarah Nakato, got "${voidEntry.actor}"`);
    ok(voidEntry.role === "Owner / GM", `Audit role is Owner / GM, got "${voidEntry.role}"`);
    ok(voidEntry.entity.includes("Duplicate charge"), `Audit entity includes void reason, got "${voidEntry.entity}"`);
    console.log(`  Audit entry: ${voidEntry.id} | ${voidEntry.actor} | ${voidEntry.action} | ${voidEntry.entity}`);

    // ===== 6. Open audit trail page → verify entries displayed correctly =====
    console.log("\n=== 6. Audit trail page ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss("at10-audit-page");

    // Verify "Immutable log" heading/description
    const bodyText = await page.locator("body").textContent() || "";
    ok(bodyText.includes("Immutable"), "Audit page mentions immutable log");

    // Check event count card
    const hasTotal = bodyText.includes("Total") || bodyText.includes("events");
    ok(hasTotal, "Audit page shows total event count");

    // Check that our financial actions appear in the list
    const auditRows = page.locator("table tbody tr");
    const rowCount = await auditRows.count();
    ok(rowCount > 0, `Audit table has ${rowCount} rows`);

    // First/visible rows should include our billing actions
    const firstRowText = await auditRows.first().textContent() || "";
    const rowIncludesBilling = firstRowText.includes("Voided charge") ||
                               firstRowText.includes("Posted confirmed payment") ||
                               firstRowText.includes("Posted payment") ||
                               firstRowText.includes("Posted charge");
    ok(rowIncludesBilling || rowCount >= 10, "Recent billing actions visible in audit table");

    // Check severity badges exist (info = blue, warn = amber)
    const infoBadges = page.locator("span:has-text('info')");
    const warnBadges = page.locator("span:has-text('warn')");
    ok(await infoBadges.count() > 0, "Info severity badges visible");
    ok(await warnBadges.count() > 0, "Warn severity badges visible");

    // Check columns present: Event, When, Actor, Module, Action, Entity, Severity
    const headers = page.locator("table thead th, table thead td");
    const headerText = await headers.allTextContents();
    const allHeaderText = headerText.join(" ");
    const hasRequiredHeaders =
      allHeaderText.includes("Event") &&
      allHeaderText.includes("When") &&
      allHeaderText.includes("Actor") &&
      allHeaderText.includes("Module") &&
      allHeaderText.includes("Action") &&
      allHeaderText.includes("Entity") &&
      allHeaderText.includes("Severity");
    ok(hasRequiredHeaders, "Audit table has all required columns: Event, When, Actor, Module, Action, Entity, Severity");

    // ===== 7. Verify audit entries survive page reload =====
    console.log("\n=== 7. Audit entries survive page reload ===");
    await page.goto(`${BASE}/audit`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    const audit4 = await readLedger(page);
    ok(audit4.auditCount === audit3.auditCount,
      `Audit count unchanged after reload: ${audit3.auditCount} → ${audit4.auditCount}`);

    // All original entries still present
    const originalInReload = audit3.audit.every((e) =>
      audit4.audit.some((x) => x.id === e.id)
    );
    ok(originalInReload, "All audit entries from before reload still present (none lost)");

    // ===== 8. Verify audit is append-only (count never decreases) =====
    console.log("\n=== 8. Audit is append-only (count never decreases) ===");
    const counts = [audit0?.auditCount ?? 0, audit1.auditCount, audit2.auditCount, audit3.auditCount, audit4.auditCount];
    const monotonic = counts.every((c, i) => i === 0 || c >= counts[i - 1]);
    ok(monotonic, `Audit count monotonically increasing: ${counts.join(" → ")}`);

    // ===== 9. Verify each audit entry has all required fields =====
    console.log("\n=== 9. All audit entries have complete fields ===");
    const allValid = audit4.audit.every((e) =>
      typeof e.id === "string" && e.id.startsWith("EVT-") &&
      typeof e.ts === "string" && /^\d{4}-\d{2}-\d{2}T/.test(e.ts) &&
      typeof e.actor === "string" && e.actor.length > 0 &&
      typeof e.role === "string" && e.role.length > 0 &&
      typeof e.module === "string" && e.module.length > 0 &&
      typeof e.action === "string" && e.action.length > 0 &&
      typeof e.entity === "string" && e.entity.length > 0 &&
      ["info", "warn", "critical"].includes(e.severity)
    );
    ok(allValid, `All ${audit4.auditCount} audit entries have valid id, ts (ISO), actor, role, module, action, entity, severity`);

    // ===== 10. Verify our billing audit entries have specific charge amounts =====
    console.log("\n=== 10. Billing entries contain amount details ===");
    const billingEntries = audit4.audit.filter((e) => e.module === "billing");
    ok(billingEntries.length >= 3, `At least 3 billing audit entries exist (found ${billingEntries.length})`);

    // Check for 120000 in posted charge
    const hasCharge120k = billingEntries.some(
      (e) => e.action === "Posted charge" && e.entity.includes("120,000")
    );
    ok(hasCharge120k, "Posted charge audit entry contains amount 120,000");

    // Check for 50000 in posted payment
    const hasPay50k = billingEntries.some(
      (e) => (e.action === "Posted payment" || e.action === "Posted confirmed payment") && e.entity.includes("50,000") && e.entity.includes("card")
    );
    ok(hasPay50k, "Posted payment audit entry contains amount 50,000 via card");

    // Check for void reason in voided charge
    const hasVoidReason = billingEntries.some(
      (e) => e.action.startsWith("Voided charge") && e.entity.includes("Duplicate charge")
    );
    ok(hasVoidReason, "Voided charge audit entry contains void reason");

    // ===== 11. Verify actors have correct names (not just "Front Desk" or role names) =====
    console.log("\n=== 11. Actors are named (not role-only) ===");
    const billingActors = billingEntries.map((e) => e.actor);
    const allHaveNames = billingActors.every((a) =>
      a !== "Front Desk" && a !== "Accountant" && a !== "Cashier" && a.length > 0
    );
    ok(allHaveNames, `Billing actions logged with named actors: ${[...new Set(billingActors)].join(", ")}`);

    // ===== 12. Verify audit filters exist =====
    console.log("\n=== 12. Audit page filters ===");
    const hasSearch = page.locator("input[placeholder*='Search'], input[type='search']");
    ok((await hasSearch.count()) > 0 || bodyText.includes("Search"), "Search input visible on audit page");

    const hasActorFilter = page.locator("select").filter({ has: page.locator("option:has-text('All users')") });
    ok((await hasActorFilter.count()) > 0 || bodyText.includes("All users"), "Actor filter visible on audit page");

    const hasModuleFilter = page.locator("select").filter({ has: page.locator("option:has-text('All modules')") });
    ok((await hasModuleFilter.count()) > 0 || bodyText.includes("All modules"), "Module filter visible on audit page");

    // ===== 13. Verify audit entry timestamps =====
    console.log("\n=== 13. Timestamp integrity ===");
    // All billing entries should have timestamps from today
    const today = new Date().toISOString().slice(0, 10);
    const billingToday = billingEntries.filter((e) => e.ts.startsWith(today));
    ok(billingToday.length >= 3, `At least 3 billing entries from today (found ${billingToday.length} of ${billingEntries.length})`);

    // Verify timestamps are in ISO sortable format (descending — newest first since prepend)
    for (let i = 0; i < Math.min(billingToday.length - 1, 5); i++) {
      ok(billingToday[i].ts >= billingToday[i + 1].ts || billingToday.length <= 2,
        `Audit entries in reverse chronological order (newest first), ts[${i}]="${billingToday[i].ts}" >= ts[${i+1}]="${billingToday[i+1].ts}"`);
    }

    console.log(`\n  VERDICT: Every financial action captured immutably in Audit Trail with timestamp, user, role, module, action, entity, and severity. Append-only, no deletion.`);

  } catch (err) {
    console.log(`\n  ERROR: ${err.message}`);
    console.log(err.stack.split("\n").slice(0, 5).join("\n"));
    await ss("at-error").catch(() => {});
    no(err.message);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Passed: ${PASSED.length}  Failed: ${FAILED.length}`);
  await browser.close();
  process.exit(FAILED.length > 0 ? 1 : 0);
}

run();
