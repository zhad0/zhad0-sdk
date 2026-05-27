# @zhad0/cli

  Command line interface for the [ZHAD0](https://zhad0.io) privacy SDK.

  > **Status: DESIGN_PREVIEW `v0.0.0-design.1`.** Encryption is real. Proof and relayer submission are simulated until mainnet.

  ## Install

  ```bash
  npm install -g @zhad0/cli
  # or
  pnpm add -g @zhad0/cli
  ```

  > Not yet published to npm. Run from the [monorepo](https://github.com/zhad0/zhad0-sdk) instead:
  > ```bash
  > git clone https://github.com/zhad0/zhad0-sdk.git
  > cd zhad0-sdk && pnpm install && pnpm build
  > node packages/cli/bin/zhad0.mjs status
  > ```

  ## Commands

  ```text
  zhad0 <command> [options]

    encrypt <file>     Encrypt an intent JSON file with AES-256-GCM.
    simulate <file>    Encrypt + simulate ZK proof + return a receipt.
    status             Print SDK status and capability matrix.
    version            Print version.
    help               Show help.

  Options
    --pretty           Pretty-print JSON output (default: compact).
    --network <name>   base-mainnet | base-sepolia | devnet-local
  ```

  ## Example

  `intent.json`:

  ```json
  {
    "action": "SWAP",
    "tokenIn":  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "tokenOut": "0x4200000000000000000000000000000000000006",
    "amountIn": "1000000000"
  }
  ```

  ```bash
  $ zhad0 encrypt intent.json --pretty
  {
    "scheme": "AES-256-GCM",
    "ciphertext": "0x...",
    "iv": "0x...",
    "keyFingerprint": "0x...",
    "intentHash": "0x...",
    "createdAt": 1716800000000
  }

  $ zhad0 simulate intent.json --pretty
  {
    "status": "SIMULATED_OK",
    "intentHash": "0x...",
    "proof": {
      "scheme": "RISC_ZERO_V1.2_SIMULATED",
      "proofHash": "0x...",
      "publicInputsHash": "0x...",
      "generatedAt": 1716800000000,
      "warning": "DESIGN_PREVIEW: no real ZK proof was generated. This is a stand-in for SDK ergonomics testing only."
    },
    "relayMs": 12,
    "txHash": null,
    "notice": "ZHAD0 mainnet is not yet live. This receipt is a client-side simulation."
  }

  $ zhad0 status --pretty
  {
    "phase": "DESIGN_PREVIEW",
    "version": "0.0.0-design.1",
    ...
  }
  ```

  ## License

  MIT (c) ZHAD0 Protocol
  