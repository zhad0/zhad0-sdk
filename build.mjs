import { build } from "esbuild";
import { chmodSync, mkdirSync } from "fs";

mkdirSync("dist", { recursive: true });

const shared = {
  bundle: true,
  platform: "node",
  target: "node18",
  external: ["node:*"],
};

// CJS build for require() users
await build({
  ...shared,
  entryPoints: ["src/index.ts"],
  format: "cjs",
  outfile: "dist/index.cjs",
});

// ESM build for import users
await build({
  ...shared,
  entryPoints: ["src/index.ts"],
  format: "esm",
  outfile: "dist/index.mjs",
});

// Each adapter
const adapters = ["langchain", "vercel-ai", "agentkit", "eliza", "virtuals", "autogen", "crewai"];
for (const a of adapters) {
  await build({ ...shared, entryPoints: [`src/adapters/${a}.ts`], format: "cjs", outfile: `dist/adapters/${a}.cjs` });
  await build({ ...shared, entryPoints: [`src/adapters/${a}.ts`], format: "esm", outfile: `dist/adapters/${a}.mjs` });
}

console.log("SDK built to dist/");
