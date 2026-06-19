/**
 * Re-upsert all client-verified chemical mixes (TYPE + full payload).
 * Run: node scripts/upsert-all-client-mixes.js
 */
const { execSync } = require("child_process");
const path = require("path");

const scripts = [
  "upsert-sod-spray-mixes.js",
  "upsert-deep-root-fungal-mixes.js",
  "upsert-fungal-batch2-mixes.js",
  "upsert-insecticide-spray-mixes.js",
  "upsert-basil-weed-mite-mixes.js",
  "upsert-multi-purpose-root-drenchs.updated.js",
];

const root = path.join(__dirname, "..");

for (const script of scripts) {
  console.log(`\n========== ${script} ==========\n`);
  execSync(`node scripts/${script}`, { cwd: root, stdio: "inherit" });
}

console.log("\n========== TYPE AUDIT ==========\n");
try {
  execSync("node scripts/audit-all-mix-types.js", { cwd: root, stdio: "inherit" });
} catch {
  process.exitCode = 1;
}
