# ZHAD0 SDK

Privacy-preserving on-chain intent submission for AI agent frameworks on Base L2.

Every intent is encrypted with **AES-256-GCM** and proven with a real **Schnorr NIZK** over secp256k1 before it ever leaves your agent process. No intent contents are visible to relayers, observers, or MEV bots.

## Packages

| Package | Description |
|---|---|
| [`@zhad0/sdk`](./packages/sdk) | Core client, adapters for 7 AI frameworks |
| [`@zhad0/proof`](./packages/proof) | Schnorr secp256k1 NIZK proof primitives |

## Installation

```bash
npm install @zhad0/sdk
# or
pnpm add @zhad0/sdk
# or
yarn add @zhad0/sdk
```

## Quickstart

```typescript
import { Zhad0Client } from '@zhad0/sdk';

const client = new Zhad0Client({ network: 'base-mainnet' });

const receipt = await client.submitIntent({
  action: 'SWAP',
  tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',  // USDC
  tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  amountIn: '1000000',     // 1 USDC (6 decimals)
  amountOutMin: '450000000000000', // min 0.00045 WETH
});

console.log(receipt.status);    // "PROVEN_OK"
console.log(receipt.verified);  // true
console.log(receipt.proveMs);   // ~2ms (Schnorr, client-side)
```

## Framework Adapters

### LangChain

```typescript
import { Zhad0Client } from '@zhad0/sdk';
import { createZhad0Tool } from '@zhad0/sdk/langchain';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

const client = new Zhad0Client({ network: 'base-mainnet' });
const agent = await createReactAgent({
  llm,
  tools: [createZhad0Tool(client)],
});
```

### Vercel AI SDK

```typescript
import { Zhad0Client } from '@zhad0/sdk';
import { createZhad0AiTool } from '@zhad0/sdk/vercel-ai';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const client = new Zhad0Client({ network: 'base-mainnet' });

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { privateIntent: createZhad0AiTool(client) },
  prompt: 'Swap 100 USDC to WETH privately',
});
```

### Coinbase AgentKit

```typescript
import { Zhad0Client } from '@zhad0/sdk';
import { createZhad0Action } from '@zhad0/sdk/agentkit';

const client = new Zhad0Client({ network: 'base-mainnet' });
const action = createZhad0Action(client);
// agentkit.addAction(action);
```

### Eliza (ai16z / elizaOS)

```typescript
import { Zhad0Client } from '@zhad0/sdk';
import { createZhad0ElizaPlugin } from '@zhad0/sdk/eliza';

const client = new Zhad0Client({ network: 'base-mainnet' });
// character.plugins.push(createZhad0ElizaPlugin(client));
```

### Virtuals Protocol GAME

```typescript
import { Zhad0Client } from '@zhad0/sdk';
import { createZhad0GameFunction } from '@zhad0/sdk/virtuals';
import { GameWorker } from '@virtuals-protocol/game';

const client = new Zhad0Client({ network: 'base-mainnet' });
const worker = new GameWorker({
  functions: [createZhad0GameFunction(client)],
});
```

### Autogen (Microsoft) — server-assisted

```typescript
import { createZhad0AutogenTool } from '@zhad0/sdk/autogen';

const tool = createZhad0AutogenTool({ apiUrl: 'https://zhad0.io/api' });
// Register with your Autogen Node.js bridge.
// For native Python agents, use python/zhad0_sdk/autogen_tool.py
```

### CrewAI — server-assisted

```typescript
import { createZhad0CrewAiTool } from '@zhad0/sdk/crewai';

const tool = createZhad0CrewAiTool({ apiUrl: 'https://zhad0.io/api' });
// For native Python agents, use python/zhad0_sdk/crewai_tool.py
```

> **Note:** LangChain, Vercel AI, AgentKit, Eliza, and Virtuals adapters generate ZK proofs client-side in your agent process. Autogen and CrewAI use server-assisted proof generation via the ZHAD0 relay API (`POST /api/intents/assisted`).

## Cryptography

### What is live today

- **AES-256-GCM** intent encryption via the Web Crypto API (SubtleCrypto). A per-intent 96-bit IV is generated with `crypto.getRandomValues`. Key material is derived via HKDF-SHA256.
- **Schnorr NIZK over secp256k1** (Fiat-Shamir transform). The prover demonstrates knowledge of the secret scalar `x` behind the public commitment `P = x·G`, with the proof cryptographically bound to the intent's public inputs (intent hash, nonce, gas estimate, gas ceiling). The verifier learns nothing about `x`.
- Proof verification is independent and deterministic: any party can call `verifyIntentProof(proof)` without contacting the relay.

### Mainnet target

- **RISC Zero Groth16 zkVM** circuit: all validity constraints (gas ceiling, schema, nonce monotonicity) enforced inside the zkVM and verifiable by a Solidity verifier on Base.
- **BLS12-381 threshold DKG** (2-of-3 Ghost Relayer cohort): no single party holds the decryption key.

### Using proof primitives directly

```typescript
import {
  generateIntentProof,
  verifyIntentProof,
  commitmentFromSecret,
  PROOF_SCHEME,
} from '@zhad0/proof';

const proof = generateIntentProof({
  secretMaterial: 'your-secret',
  publicInputs: {
    intentHash: '0xabc...',
    nonce: 0,
    gasEstimate: 180_000,
    gasCeiling: 2_000_000,
  },
});

const result = verifyIntentProof(proof);
console.log(result.valid); // true
```

## Status

| Feature | Status |
|---|---|
| AES-256-GCM intent encryption | Live |
| Schnorr secp256k1 NIZK proofs | Live |
| Off-chain Ghost Relay network | Live |
| 7 framework adapters | Live |
| On-chain settlement (Base) | Launching at mainnet |
| $ZHAD0 token and staking | Launching at mainnet |
| RISC Zero Groth16 circuit | Launching at mainnet |
| On-chain governance | Launching at mainnet |

## Links

- Website: [zhad0.io](https://zhad0.io)
- SDK docs: [zhad0.io/sdk](https://zhad0.io/sdk)
- Whitepaper: [zhad0.io/whitepaper](https://zhad0.io/whitepaper)
- Network: [zhad0.io/network](https://zhad0.io/network)

## License

MIT — see [LICENSE](./LICENSE)
