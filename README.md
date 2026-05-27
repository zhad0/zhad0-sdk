# ZHAD0 SDK

  > ZK-powered privacy layer for autonomous AI agents on Base L2.
  >
  > **Status: DESIGN_PREVIEW `v0.0.0-design.1`.** Real AES-256-GCM client-side encryption is shipped today. ZK proofs and the Ghost Relay network are simulated until mainnet is live.

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
  [![Status](https://img.shields.io/badge/status-design__preview-ff3d8a.svg)](https://zhad0.xyz)
  [![Network](https://img.shields.io/badge/network-Base__L2-0052ff.svg)](https://base.org)

  ## What is ZHAD0

  ZHAD0 is a privacy middleware for AI agents running financial strategies on Base L2. Agent intents are encrypted off-chain, accompanied by a zero-knowledge proof of validity, and executed through a decentralised Ghost Relay network. The agent wallet, the intent contents, and the strategy stay invisible to MEV bots and on-chain observers.

  This repository ships the **client side** of that stack: a TypeScript SDK and a CLI that demonstrate the planned API surface with real cryptography where possible.

  ## Packages

  | Package | Description |
  |---|---|
  | [`@zhad0/sdk`](./packages/sdk) | TypeScript SDK. Real Web Crypto AES-256-GCM. Simulated ZK proof helpers. `wrapAgent()` Proxy. |
  | [`@zhad0/cli`](./packages/cli) | Command line tool: `zhad0 encrypt`, `zhad0 simulate`, `zhad0 status`. |

  ## Quick start

  ```bash
  git clone https://github.com/zhad0/zhad0-sdk.git
  cd zhad0-sdk
  pnpm install
  pnpm build

  # Inspect the SDK
  node packages/cli/bin/zhad0.mjs status

  # Encrypt a sample intent
  echo '{"action":"SWAP","tokenIn":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","tokenOut":"0x4200000000000000000000000000000000000006","amountIn":"1000000000"}' > intent.json
  node packages/cli/bin/zhad0.mjs simulate intent.json --pretty
  ```

  ## What is real today

  | Capability | Status |
  |---|---|
  | Client-side AES-256-GCM (Web Crypto SubtleCrypto) | LIVE |
  | Canonical JSON intent hashing (SHA-256) | LIVE |
  | `wrapAgent()` Proxy adds `executeIntent` to any object | LIVE |
  | Zod-validated intent schemas | LIVE |
  | `simulateProof()` SHA-256 stand-in for RISC Zero | SIMULATED |
  | `submitIntent()` returns `txHash: null` with notice | SIMULATED |
  | Ghost Relay network submission | PLANNED |
  | Base L2 verifier | PLANNED |
  | Threshold key recovery | PLANNED |
  | Gasless mode | PLANNED |
  | Multi-chain support | PLANNED |

  ## Honesty notice

  ZHAD0 is in design phase. There is:

  * No mainnet deployment of the verifier.
  * No externally audited circuit.
  * No live Ghost Relayer network.
  * No public `@zhad0/sdk` or `@zhad0/cli` package on npm yet.
  * No `ZHAD0` token distribution.

  Anything labelled `LIVE` in this repo describes code that is actually implemented and executes deterministically against Web Crypto. Anything labelled `PLANNED` is design specification only.

  ## Project

  * Website: [zhad0.xyz](https://zhad0.xyz)
  * Organization: [github.com/zhad0](https://github.com/zhad0)
  * Issues: [github.com/zhad0/zhad0-sdk/issues](https://github.com/zhad0/zhad0-sdk/issues)
  * License: [MIT](./LICENSE)
  