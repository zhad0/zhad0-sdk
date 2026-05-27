#!/usr/bin/env node
import { run } from "../dist/index.js";
run(process.argv.slice(2)).catch((err) => {
  process.stderr.write("[zhad0] " + (err?.message || err) + "\n");
  process.exit(1);
});
