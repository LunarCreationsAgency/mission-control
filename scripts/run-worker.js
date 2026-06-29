#!/usr/bin/env node
/**
 * Standalone Agent Worker Runner
 * Usage: node scripts/run-worker.js
 */

const path = require("path");
require("ts-node/register");

// Point to the worker module
const { runWorkerCycle } = require(path.resolve(__dirname, "../src/lib/agent-worker.ts"));

(async () => {
  console.log("🤖 Agent Worker starting...");
  const { executed, errors } = await runWorkerCycle();
  console.log(`✅ Executed: ${executed}`);
  if (errors.length > 0) {
    console.log(`❌ Errors (${errors.length}):`);
    errors.forEach((e) => console.log("  -", e));
  }
  process.exit(0);
})();
