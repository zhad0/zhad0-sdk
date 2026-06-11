# @zhad0/sdk

Official JavaScript/TypeScript SDK for the [ZHAD0 Protocol](https://zhad0.io) — a ZK privacy layer for AI agents on Base.

## What is LIVE today

| Feature | Status |
|---|---|
| AES-256-GCM intent encryption | **LIVE** |
| Schnorr secp256k1 NIZK proof generation | **LIVE** |
| Client-side proof verification | **LIVE** |
| Ghost Relay submission (`POST /api/intents`) | **LIVE** |
| Framework adapters (LangChain, AgentKit, Eliza, etc.) | **LIVE** |
| On-chain settlement to Base | SOON |
| RISC Zero Groth16 circuit | SOON |
| Token staking | SOON |

## Install

```bash
npm install @zhad0/sdk
# or
pnpm add @zhad0/sdk
# or
yarn add @zhad0/sdk
```

Node.js 18+ required.

## Quick start

```js
const { Zhad0Client } = require('@zhad0/sdk');

const client = new Zhad0Client({
  agentAddress: '0xYOUR_BASE_WALLET_ADDRESS',
  baseUrl: 'https://zhad0.io/api',  // default, can omit
});

const receipt = await client.submitIntent({
  action: 'TRANSFER',
});

console.log(receipt.status);        // PROVEN_OK
console.log(receipt.intentHash);    // 0x...
console.log(receipt.proofHash);     // 0x...
console.log(receipt.relayedId);     // relay record ID
console.log(receipt.feeEth);        // 0.00010000
console.log(receipt.relayerRegion); // us-east
console.log(receipt.proveMs);       // proof generation time in ms
```

## Client options

```ts
new Zhad0Client({
  // Required to submit intents to the Ghost Relay.
  // Must be a valid 0x-prefixed Base wallet address.
  agentAddress: '0xYOUR_BASE_WALLET_ADDRESS',

  // Optional. Defaults to 'https://zhad0.io/api'.
  baseUrl: 'https://zhad0.io/api',

  // Optional. Framework name for analytics (e.g. 'LangChain', 'AgentKit').
  // Defaults to 'Unknown'.
  framework: 'LangChain',

  // Optional. Intent ETH value for fee calculation. Defaults to '0'.
  valueEth: '0.1',
})
```

## Intent actions

```ts
type IntentAction =
  | 'TRANSFER'
  | 'SWAP'
  | 'LP_ADD'
  | 'LP_REMOVE'
  | 'BRIDGE'
  | 'CUSTOM';
```

## Submit receipt fields

```ts
interface SubmitReceipt {
  status: 'PROVEN_OK' | 'PROVEN_INVALID';
  intentHash: string;     // SHA-256 hash of the encrypted payload
  proofHash: string;      // Schnorr proof identifier
  relayedId: string|null; // Ghost Relay record ID (null if offline)
  proof: ZkIntentProof;   // Full Schnorr NIZK proof object
  verified: boolean;      // Client-side verification result
  proveMs: number;        // Proof generation time in ms
  feeEth: string|null;    // Fee charged by relay (null if offline)
  relayerRegion: string|null;
  txHash: null;           // null until mainnet contracts deploy
  notice: string;
}
```

## Framework adapters

### LangChain

```js
const { Zhad0Client } = require('@zhad0/sdk');
const { createZhad0Tool } = require('@zhad0/sdk/langchain');

const client = new Zhad0Client({ agentAddress: '0xYOUR_ADDRESS' });
const tool = createZhad0Tool(client);

// Use with any LangChain agent
const tools = [tool];
```

### Coinbase AgentKit

```js
const { Zhad0ActionProvider } = require('@zhad0/sdk/agentkit');

// Pass to AgentKit actionProviders
const provider = new Zhad0ActionProvider({ agentAddress: '0xYOUR_ADDRESS' });
```

### Eliza (elizaOS)

```js
const { zhad0Plugin } = require('@zhad0/sdk/eliza');

const character = {
  plugins: [zhad0Plugin({ agentAddress: '0xYOUR_ADDRESS' })],
};
```

### Vercel AI SDK

```js
const { zhad0VercelTool } = require('@zhad0/sdk/vercel-ai');
const { generateText } = require('ai');

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { zhad0: zhad0VercelTool({ agentAddress: '0xYOUR_ADDRESS' }) },
  prompt: 'Submit a private TRANSFER intent via ZHAD0',
});
```

Other adapters: `@zhad0/sdk/autogen`, `@zhad0/sdk/crewai`, `@zhad0/sdk/virtuals`

## How the proof works

Every call to `submitIntent`:

1. Serializes and encrypts the intent with AES-256-GCM (random IV, key via Web Crypto)
2. Derives a secret scalar from the key fingerprint and intent hash
3. Generates a real Schnorr NIZK proof over secp256k1 (Fiat-Shamir transform)
4. Verifies the proof locally before submission
5. POSTs `{ submitterAddress, proof }` to the Ghost Relay
6. The relay independently re-verifies the proof and rejects if invalid

No intent content is revealed to the relay or on-chain observers.

## Source

- GitHub: [github.com/zhad0/zhad0-sdk](https://github.com/zhad0/zhad0-sdk)
- Protocol: [zhad0.io](https://zhad0.io)
- CLI: [@zhad0/cli](https://www.npmjs.com/package/@zhad0/cli)
