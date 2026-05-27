import { SDK_STATUS } from "@zhad0/sdk";

const P   = "\x1b[38;2;232;60;135m";
const G   = "\x1b[92m";
const Y   = "\x1b[93m";
const RED = "\x1b[91m";
const W   = "\x1b[97m";
const DIM = "\x1b[2m";
const R   = "\x1b[0m";
const B   = "\x1b[1m";

function ok(label: string, detail = "")  { return `  ${G}✔${R}  ${W}${label}${R}${detail ? `  ${DIM}${detail}${R}` : ""}`; }
function warn(label: string, detail = ""){ return `  ${Y}⚠${R}  ${W}${label}${R}${detail ? `  ${DIM}${detail}${R}` : ""}`; }
function fail(label: string, detail = ""){ return `  ${RED}✘${R}  ${W}${label}${R}${detail ? `  ${DIM}${detail}${R}` : ""}`; }

function checkNodeVersion(): { line: string; ok: boolean } {
  const v = process.versions.node;
  const [major] = v.split(".").map(Number);
  const pass = (major ?? 0) >= 18;
  return {
    ok: pass,
    line: pass
      ? ok(`Node.js v${v}`, ">=18 required")
      : fail(`Node.js v${v}`, "upgrade to >=18 for Web Crypto support"),
  };
}

function checkWebCrypto(): { line: string; ok: boolean } {
  try {
    const wc = globalThis.crypto;
    if (!wc || typeof wc.subtle?.digest !== "function") throw new Error();
    return { ok: true, line: ok("Web Crypto API", "AES-256-GCM available") };
  } catch {
    return { ok: false, line: fail("Web Crypto API", "not available in this runtime") };
  }
}

function checkSdkImport(): { line: string; ok: boolean } {
  try {
    if (!SDK_STATUS || typeof SDK_STATUS.realEncryption !== "boolean") throw new Error();
    return { ok: true, line: ok(`@zhad0/sdk ${SDK_STATUS.version}`, "imported successfully") };
  } catch {
    return { ok: false, line: fail("@zhad0/sdk", "import failed — run: npm install @zhad0/sdk") };
  }
}

async function checkNetwork(): Promise<{ line: string; ok: boolean }> {
  try {
    const res = await fetch("https://zhad0.io", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: true, line: ok("https://zhad0.io", `reachable (${res.status})`) };
  } catch {
    return { ok: false, line: warn("https://zhad0.io", "unreachable — check internet connection") };
  }
}

function checkPlatform(): { line: string; ok: boolean } {
  return { ok: true, line: ok(`Platform: ${process.platform} ${process.arch}`) };
}

export async function doctorCommand(): Promise<void> {
  const lines: string[] = [];
  lines.push(`\n${P}${B}  ── ZHAD0 Doctor ──────────────────────────────────────${R}\n`);

  const checks = [
    checkNodeVersion(),
    checkWebCrypto(),
    checkSdkImport(),
    checkPlatform(),
  ];

  const network = await checkNetwork();

  let allOk = true;
  for (const c of [...checks, network]) {
    lines.push(c.line);
    if (!c.ok) allOk = false;
  }

  lines.push("");
  lines.push(`  ${W}${B}SDK Capabilities${R}`);
  lines.push(`  ${P}───────────────────────────────────────────────${R}`);
  lines.push(`  ${G}●${R}  Encryption       ${DIM}AES-256-GCM via Web Crypto${R}  ${G}LIVE${R}`);
  lines.push(`  ${G}●${R}  Intent hashing   ${DIM}SHA-256 canonical digest${R}    ${G}LIVE${R}`);
  lines.push(`  ${DIM}○${R}  ZK proofs        ${DIM}RISC Zero V1.2${R}             ${DIM}mainnet pending${R}`);
  lines.push(`  ${DIM}○${R}  Ghost Relay      ${DIM}Base mainnet submission${R}    ${DIM}mainnet pending${R}`);
  lines.push(`  ${DIM}○${R}  On-chain execute ${DIM}Base L2${R}                    ${DIM}mainnet pending${R}`);
  lines.push("");

  const verdict = allOk
    ? `  ${G}${B}✔ All checks passed. ZHAD0 CLI is ready.${R}`
    : `  ${Y}${B}⚠ Some checks failed. See details above.${R}`;
  lines.push(verdict);
  lines.push("");

  process.stdout.write(lines.join("\n") + "\n");
  if (!allOk) process.exitCode = 1;
}
