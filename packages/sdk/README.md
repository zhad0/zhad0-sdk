# @zhad0/sdk

  > ZK-powered privacy SDK for AI agents on Base L2.
  >
  > **Status: DESIGN_PREVIEW `v0.0.0-design.1`.** Real Web Crypto AES-256-GCM is shipped. ZK proofs and Ghost Relay submission are simulated until mainnet is live.

  ## Install

  ```bash
  npm install @zhad0/sdk
  # or
  pnpm add @zhad0/sdk
  # or
  yarn add @zhad0/sdk
  ```

  > Not yet published to npm. For now install from the [monorepo](https://github.com/zhad0/zhad0-sdk):
  > ```bash
  > git clone https://github.com/zhad0/zhad0-sdk.git
  > cd zhad0-sdk && pnpm install && pnpm build
  > ```

  ## Capability matrix

  | Capability | Status |
  |---|---|
  | Client-side AES-256-GCM encryption (Web Crypto) | LIVE |
  | Canonical JSON intent hashing (SHA-256) | LIVE |
  | `wrapAgent()` Proxy that adds `executeIntent()` to any object | LIVE |
  | Zod-validated intent schemas | LIVE |
  | `simulateProof()` SHA-256 stand-in for RISC Zero | SIMULATED |
  | `submitIntent()` returns `txHash: null` | SIMULATED |
  | Ghost Relay network submission | PLANNED |
  | Base L2 verifier | PLANNED |
  | Threshold key recovery | PLANNED |
  | Gasless mode, multi-chain | PLANNED |

  ## Quick usage

  ```ts
  import { Zhad0Client } from '@zhad0/sdk';

  const z = new Zhad0Client({ network: 'base-mainnet', relayerMode: 'simulated' });

  const encrypted = await z.encryptIntent({
    action: 'SWAP',
    tokenIn:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    tokenOut: '0x4200000000000000000000000000000000000006',
    amountIn: '1000000000',
  });

  console.log(encrypted.scheme);     // 'AES-256-GCM'
  console.log(encrypted.ciphertext); // '0x...'
  console.log(encrypted.intentHash); // '0x...'

  const receipt = await z.submitIntent({
    action: 'SWAP',
    tokenIn:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    tokenOut: '0x4200000000000000000000000000000000000006',
    amountIn: '1000000000',
  });

  console.log(receipt.status);       // 'SIMULATED_OK'
  console.log(receipt.proof.scheme); // 'RISC_ZERO_V1.2_SIMULATED'
  console.log(receipt.txHash);       // null
  ```

  ## Wrap an existing agent

  ```ts
  import { Zhad0Client } from '@zhad0/sdk';

  const z = new Zhad0Client();
  const privateAgent = z.wrapAgent(myAgent);

  const receipt = await privateAgent.executeIntent({
    action: 'SWAP',
    tokenIn:  '0x...',
    tokenOut: '0x...',
    amountIn: '1000000',
  });
  ```

  ## API

  ### `new Zhad0Client(options?)`

  ```ts
  interface Zhad0ClientOptions {
    network?:     'base-mainnet' | 'base-sepolia' | 'devnet-local'; // default 'devnet-local'
    relayerMode?: 'ghost' | 'direct' | 'simulated';                 // default 'simulated'
  }
  ```

  ### `client.encryptIntent(intent): Promise<EncryptedIntent>`

  Validates the intent with Zod, canonicalises to deterministic JSON (recursive sorted-key serialisation), generates an AES-256-GCM key (cached per client), encrypts with a random 96-bit IV, returns:

  ```ts
  {
    scheme: 'AES-256-GCM',
    ciphertext: string,     // hex with 0x prefix
    iv: string,             // hex
    keyFingerprint: string, // first 8 bytes of SHA-256(rawKey)
    intentHash: string,     // SHA-256(canonical_json)
    createdAt: number,      // unix ms
  }
  ```

  ### `client.simulateProof(encrypted): Promise<SimulatedProof>`

  Returns a deterministic SHA-256 stand-in. **Not a real ZK proof.** Output carries an explicit `warning` field.

  ### `client.submitIntent(intent): Promise<SubmitReceipt>`

  Encrypts, simulates the proof, returns a receipt with `txHash: null` and a notice explaining mainnet is not yet live.

  ### `client.wrapAgent(agent)`

  Returns a Proxy of `agent` with an added `executeIntent(intent)` method that delegates to `submitIntent`.

  ### `SDK_STATUS`

  ```ts
  {
    phase: 'DESIGN_PREVIEW',
    version: '0.0.0-design.1',
    mainnetLive: false,
    realProofs: false,
    realEncryption: true,
    message: '...',
  }
  ```

  ## License

  MIT (c) ZHAD0 Protocol
  