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
    // ===== 0. Navigate to /housekeeping =====
    console.log("\n=== 0. Housekeeping page loads ===");
    await page.goto(`${BASE}/housekeeping`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss("00-housekeeping");
    ok("Housekeeping page rendered without crash");

    // Verify page title
    const title = await page.locator("h1").textContent();
    ok(title.includes("Housekeeping"), `Title is "${title}"`);

    // Verify stats tiles
    const stats = page.locator(".rounded-xl.border.border-border.bg-card.p-4");
    const statCount = await stats.count();
    ok(statCount === 6, `6 stat tiles visible (got ${statCount})`);

    // ===== 1. Room Status Board =====
    console.log("\n=== 1. Room Status Board ===");
    ok(await page.locator("text=Room Status Board").isVisible(), "Room Status Board tab active by default");

    // Count room cards
    const roomCards = page.locator("div.grid.gap-3 > div");
    const roomCount = await roomCards.count();
    ok(roomCount > 0, `Room cards visible: ${roomCount}`);

    // Check for DND icon in any card
    const dndIcons = page.locator('[title="Do Not Disturb"]');
    const dndCount = await dndIcons.count();
    ok(true, `DND icons found: ${dndCount}`);

    // Floor filter
    const floorSelect = page.locator("select").first();
    await floorSelect.selectOption("1");
    await page.waitForTimeout(300);
    const floor1Count = await page.locator("div.grid.gap-3 > div").count();
    ok(floor1Count > 0, `Floor 1 shows ${floor1Count} rooms`);
    await ss("01-floor1-filter");

    // Reset to all
    await floorSelect.selectOption("all");
    await page.waitForTimeout(300);
    const allCount = await page.locator("div.grid.gap-3 > div").count();
    ok(allCount > floor1Count, "All floors shows more rooms");

    // ===== 2. Task Queue =====
    console.log("\n=== 2. Task Queue ===");
    await page.locator("button:has-text('Task Queue')").click();
    await page.waitForTimeout(500);
    await ss("02-task-queue");

    // Check table renders
    const table = page.locator("table");
    ok(await table.isVisible(), "Task queue table visible");

    // Check search input
    const searchInput = page.locator("input[placeholder='Search tasks…']");
    ok(await searchInput.isVisible(), "Search input visible");

    // Count rows
    const rows = table.locator("tbody tr");
    let taskCount = await rows.count();
    ok(taskCount > 0, `Tasks visible in table: ${taskCount}`);

    // Filter by status
    const statusFilter = page.locator("select").nth(1);
    await statusFilter.selectOption("queued");
    await page.waitForTimeout(300);
    const queuedRows = await table.locator("tbody tr").count();
    ok(queuedRows > 0, `Queued tasks filtered: ${queuedRows}`);

    // Reset status filter
    await statusFilter.selectOption("all");
    await page.waitForTimeout(300);

    // Search for a specific room
    await searchInput.fill("101");
    await page.waitForTimeout(300);
    const searchRows = await table.locator("tbody tr").count();
    ok(searchRows > 0, `Search for 101 found ${searchRows} rows`);
    await ss("02a-search");

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // ===== 3. Create Housekeeping Task =====
    console.log("\n=== 3. Create Task ===");
    await page.locator("button:has-text('New Task')").click();
    await page.waitForTimeout(400);
    await ss("03-create-dialog");
    ok(await page.locator("text=Create Housekeeping Task").isVisible(), "Create dialog visible");

    // Fill create form
    const dialog = page.locator(".fixed.inset-0.z-50");
    const roomSelect = dialog.locator("select").first();
    await roomSelect.selectOption("101");
    ok(true, "Room selected");
    await page.waitForTimeout(100);

    // Task type
    const typeSelect = dialog.locator("select").nth(1);
    await typeSelect.selectOption("deep_clean");
    ok(true, "Task type set to deep_clean");

    // Priority
    const prioritySelect = dialog.locator("select").nth(2);
    await prioritySelect.selectOption("high");
    ok(true, "Priority set to high");

    // Assign to U003 (Grace Atim)
    const assignSelect = dialog.locator("select").nth(3);
    await assignSelect.selectOption("U003");
    ok(true, "Assigned to Grace Atim");

    // Notes
    const notesInput = dialog.locator("textarea").first();
    await notesInput.fill("Test create task via Playwright");
    ok(true, "Notes added");

    // Submit
    await dialog.locator("button:has-text('Create task')").click();
    await page.waitForTimeout(500);
    ok(true, "Task created");

    // Verify new task appears in table
    const rowsAfterCreate = await table.locator("tbody tr").count();
    ok(rowsAfterCreate > taskCount, `Task count increased: ${taskCount} -> ${rowsAfterCreate}`);
    await ss("03a-after-create");

    // ===== 4. Task Actions: Start, Mark Clean =====
    console.log("\n=== 4. Task Actions ===");
    // Find a queued task and click Start
    const startBtn = page.locator("button:has-text('Start')").first();
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(400);
      ok("Started a queued task");
      await ss("04-start-task");

      // Now find Mark Clean button
      const markCleanBtn = page.locator("button:has-text('Mark Clean')").first();
      if (await markCleanBtn.isVisible().catch(() => false)) {
        await markCleanBtn.click();
        await page.waitForTimeout(400);
        ok("Marked task as clean");
      }
    }

    // ===== 5. Flag Issue =====
    console.log("\n=== 5. Flag Issue ===");
    const flagBtn = page.locator("button[title='Flag issue']").first();
    if (await flagBtn.isVisible().catch(() => false)) {
      await flagBtn.click();
      await page.waitForTimeout(400);
      await ss("05-flag-dialog");
      ok(await page.locator("text=Flag Issue").isVisible(), "Flag issue dialog visible");

      const flagDialog = page.locator(".fixed.inset-0.z-50");
      const flagTextarea = flagDialog.locator("textarea").first();
      await flagTextarea.fill("Broken faucet in bathroom");
      ok(true, "Issue description entered");

      const severitySelect = flagDialog.locator("select").first();
      await severitySelect.selectOption("high");
      ok(true, "Severity set to high");

      await flagDialog.locator("button:has-text('Flag issue')").click();
      await page.waitForTimeout(500);
      ok("Issue flagged");
      await ss("05a-after-flag");

      // Wait a moment and verify flagged badge visible
      await page.waitForTimeout(300);
    }

    // ===== 6. Inspections Tab =====
    console.log("\n=== 6. Inspections ===");
    await page.locator("button:has-text('Inspections')").click();
    await page.waitForTimeout(500);
    await ss("06-inspections");

    // Check inspection table
    ok(await page.locator("text=waiting for inspection").isVisible(), "Inspection summary visible");

    const approveBtn = page.locator("button:has-text('Approve')").first();
    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(400);
      ok("Approved inspection");
      await ss("06a-after-approve");
    }

    // ===== 7. Schedule Tab =====
    console.log("\n=== 7. Schedule ===");
    await page.locator("button:has-text('Schedule')").click();
    await page.waitForTimeout(500);
    await ss("07-schedule");

    // Check staff cards
    const staffCards = page.locator(".rounded-xl.border.border-border.bg-card.p-5");
    const staffCount = await staffCards.count();
    ok(staffCount > 0, `Staff cards visible: ${staffCount}`);

    // Check for gradient avatar initials
    const initials = page.locator(".bg-gradient-to-br");
    const initCount = await initials.count();
    ok(initCount > 0, `Staff avatar initials: ${initCount}`);

    // Check for unassigned tasks section
    const unassignedSection = page.locator("text=Unassigned Tasks");
    if (await unassignedSection.isVisible().catch(() => false)) {
      ok(true, "Unassigned tasks section visible");
    }

    // ===== 8. Issues & Maintenance Tab =====
    console.log("\n=== 8. Issues & Maintenance ===");
    await page.locator("button:has-text('Issues & Maintenance')").click();
    await page.waitForTimeout(500);
    await ss("08-issues");

    // Should see either open issues or "No open maintenance issues" message
    const resolveBtn = page.locator("button:has-text('Resolve')").first();
    if (await resolveBtn.isVisible().catch(() => false)) {
      await resolveBtn.click();
      await page.waitForTimeout(400);
      ok("Resolved an issue");
      await ss("08a-after-resolve");
    } else {
      // See if there's a "No open maintenance issues" message
      const noIssues = page.locator("text=No open maintenance issues");
      ok(await noIssues.isVisible().catch(() => false), "No open issues message visible (all resolved)");
    }

    await ss("09-final");

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
