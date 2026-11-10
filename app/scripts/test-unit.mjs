import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceDir = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = join(workspaceDir, "app");

// Pass explicit files: Node 22 does not expand recursive test globs.
const tests = readdirSync(sourceDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
  .map((entry) => join(entry.parentPath, entry.name))
  .toSorted();

if (tests.length === 0) {
  throw new Error("No colocated unit tests found under app/");
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...tests], {
  cwd: workspaceDir,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
