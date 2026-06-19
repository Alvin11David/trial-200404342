import { watch } from "fs";
import { execSync } from "child_process";

const WATCH_DIRS = ["src", "test-screenshots"];
const COOLDOWN_MS = 30_000; // wait 30s after last change before committing

let timer = null;
let pending = false;

function commit() {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf8", cwd: "." }).trim();
    if (!status) return;

    const lines = status.split("\n").filter(Boolean);
    const summary = lines
      .slice(0, 5)
      .map((l) => l.trim())
      .join("; ");
    const msg = `${lines.length} — ${summary}`.slice(0, 120);

    execSync("git add -A", { cwd: "." });
    execSync(`git commit -m "${msg}"`, { cwd: "." });
    execSync("git push", { cwd: "." });
    console.log(`[auto-commit] ${new Date().toLocaleTimeString()} — committed & pushed ${lines.length} file(s)`);
  } catch (err) {
    if (!err.message?.includes("nothing to commit")) {
      console.error(`[auto-commit] error: ${err.message}`);
    }
  }
}

function onChange(event, filename) {
  if (!filename || filename.includes("node_modules") || filename.includes(".git")) return;
  if (pending) return;
  pending = true;

  clearTimeout(timer);
  timer = setTimeout(() => {
    pending = false;
    commit();
  }, COOLDOWN_MS);
}

console.log(`[auto-commit] watching ${WATCH_DIRS.join(", ")} (cooldown: ${COOLDOWN_MS / 1000}s)`);
console.log("[auto-commit] press Ctrl+C to stop\n");

for (const dir of WATCH_DIRS) {
  watch(dir, { recursive: true }, onChange);
}
