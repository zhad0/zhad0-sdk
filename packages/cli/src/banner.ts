// ZHAD0 pink: rgb(232, 60, 135)  — ANSI 38;2;232;60;135
const P  = "\x1b[38;2;232;60;135m"; // ZHAD0 pink
const W  = "\x1b[97m";               // bright white
const DIM = "\x1b[2m";               // dim
const R  = "\x1b[0m";                // reset
const B  = "\x1b[1m";                // bold

export const BANNER = [
  "",
  `${P}${B}  ██████╗ ██╗  ██╗ █████╗ ██████╗  ██████╗ ${R}`,
  `${P}${B}  ╚════██╗██║  ██║██╔══██╗██╔══██╗██╔═████╗${R}`,
  `${P}${B}   █████╔╝███████║███████║██║  ██║██║██╔██║${R}`,
  `${P}${B}  ██╔═══╝ ██╔══██║██╔══██║██║  ██║████╔╝██║${R}`,
  `${P}${B}  ███████╗██║  ██║██║  ██║██████╔╝╚██████╔╝${R}`,
  `${P}${B}  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ${R}`,
  "",
  `${DIM}  ZK-powered privacy for AI agents on Base L2${R}`,
  `${DIM}  https://zhad0.io${R}`,
  "",
].join("\n");

export const HELP_DASHBOARD = `${BANNER}
${W}${B}  COMMANDS${R}
${P}  ──────────────────────────────────────────────────${R}
  ${W}encrypt${R}  ${DIM}<file.json>${R}      Encrypt an intent with AES-256-GCM
  ${W}simulate${R} ${DIM}<file.json>${R}      Encrypt + simulate ZK proof + return receipt
  ${W}status${R}                   Show SDK capabilities and protocol status
  ${W}doctor${R}                   Check runtime environment and dependencies
  ${W}version${R}                  Print CLI version
  ${W}help${R}                     Show this screen

${W}${B}  OPTIONS${R}
${P}  ──────────────────────────────────────────────────${R}
  ${W}--pretty${R}                  Pretty-print JSON output
  ${W}--network${R} ${DIM}<name>${R}           ${DIM}base-mainnet${R} | ${DIM}base-sepolia${R} | ${DIM}devnet-local${R}

${W}${B}  EXAMPLES${R}
${P}  ──────────────────────────────────────────────────${R}
  ${DIM}$${R} zhad0 status
  ${DIM}$${R} zhad0 status --pretty
  ${DIM}$${R} echo '{"action":"SWAP","tokenIn":"0x...","amountIn":"1000"}' > intent.json
  ${DIM}$${R} zhad0 encrypt intent.json --pretty
  ${DIM}$${R} zhad0 simulate intent.json --pretty --network base-sepolia
  ${DIM}$${R} zhad0 doctor

${W}${B}  LIVE NOW${R}
${P}  ──────────────────────────────────────────────────${R}
  ${P}●${R} AES-256-GCM intent encryption
  ${P}●${R} Intent hash fingerprinting (SHA-256)
  ${DIM}○${R} ZK proofs (RISC Zero)          ${DIM}— mainnet pending${R}
  ${DIM}○${R} Ghost Relay network             ${DIM}— mainnet pending${R}

`;
