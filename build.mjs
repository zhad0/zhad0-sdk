import { build } from "esbuild";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

mkdirSync("dist/adapters", { recursive: true });

const alias = {
  "@workspace/zhad0-proof": resolve(__dir, "src/proof/index.ts"),
};

const shared = {
  bundle: true,
  platform: "node",
  target: "node18",
  external: ["node:*"],
  alias,
};

await build({
  ...shared,
  entryPoints: ["src/index.ts"],
  format: "cjs",
  outfile: "dist/index.cjs",
});

await build({
  ...shared,
  entryPoints: ["src/index.ts"],
  format: "esm",
  outfile: "dist/index.mjs",
});

const adapters = ["langchain", "vercel-ai", "agentkit", "eliza", "virtuals", "autogen", "crewai"];
for (const a of adapters) {
  await build({ ...shared, entryPoints: [`src/adapters/${a}.ts`], format: "cjs", outfile: `dist/adapters/${a}.cjs` });
  await build({ ...shared, entryPoints: [`src/adapters/${a}.ts`], format: "esm", outfile: `dist/adapters/${a}.mjs` });
}

console.log("SDK built to dist/");
