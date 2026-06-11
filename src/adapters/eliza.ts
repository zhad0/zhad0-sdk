import type { Zhad0Client } from "../client.js";
import type { Intent } from "../types.js";

export interface ElizaAction {
  name: string;
  description: string;
  similes: string[];
  examples: unknown[];
  validate: (runtime: unknown, message: ElizaMessage) => Promise<boolean>;
  handler: (
    runtime: unknown,
    message: ElizaMessage,
    state: unknown,
    options: unknown,
    callback?: (response: ElizaResponse) => Promise<unknown[]>
  ) => Promise<boolean>;
}

export interface ElizaMessage {
  content?: { text?: string; action?: string };
}

export interface ElizaResponse {
  text: string;
  action?: string;
}

export interface ElizaPlugin {
  name: string;
  description: string;
  actions: ElizaAction[];
}

const INTENT_ACTION_PATTERNS = [
  "ZHAD0_PRIVATE_SWAP",
  "ZHAD0_PRIVATE_TRANSFER",
  "ZHAD0_PRIVATE_INTENT",
  "SEND_PRIVATE_INTENT",
  "PRIVATE_SWAP",
  "ZK_RELAY",
];

function extractIntentFromText(text: string): Partial<Intent> {
  const lower = text.toLowerCase();
  const intent: Partial<Intent> = { action: "CUSTOM" };

  if (lower.includes("swap")) intent.action = "SWAP";
  else if (lower.includes("transfer") || lower.includes("send"))
    intent.action = "TRANSFER";
  else if (lower.includes("add liquidity")) intent.action = "LP_ADD";
  else if (lower.includes("remove liquidity")) intent.action = "LP_REMOVE";
  else if (lower.includes("bridge")) intent.action = "BRIDGE";

  const amountMatch = text.match(/[\d,]+(?:\.\d+)?/);
  if (amountMatch) {
    const raw = amountMatch[0].replace(",", "");
    intent.amountIn = String(Math.round(parseFloat(raw) * 1e6));
  }

  if (lower.includes("usdc")) intent.tokenIn = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  if (lower.includes("weth") || lower.includes("eth"))
    intent.tokenOut = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  return intent;
}

/**
 * Returns an Eliza (ai16z / @elizaos) plugin that gives your agent
 * the ability to submit private on-chain intents via ZHAD0.
 *
 * @example
 * import { createZhad0ElizaPlugin } from "@zhad0/sdk/eliza";
 * import { Zhad0Client } from "@zhad0/sdk";
 * const client = new Zhad0Client({ network: "base-sepolia" });
 * // character.plugins.push(createZhad0ElizaPlugin(client));
 */
export function createZhad0ElizaPlugin(client: Zhad0Client): ElizaPlugin {
  const privateIntentAction: ElizaAction = {
    name: "ZHAD0_PRIVATE_INTENT",
    description:
      "Submit a privacy-preserving on-chain intent via the ZHAD0 ZK relay. " +
      "Use when the user asks to swap, transfer, or execute any on-chain action privately.",
    similes: INTENT_ACTION_PATTERNS,
    examples: [
      [
        { user: "{{user1}}", content: { text: "Swap 100 USDC to WETH privately" } },
        {
          user: "{{agent}}",
          content: {
            text: "Submitting private SWAP intent via ZHAD0 ZK relay...",
            action: "ZHAD0_PRIVATE_INTENT",
          },
        },
      ],
      [
        { user: "{{user1}}", content: { text: "Send 0.5 ETH to 0xAbc... without anyone seeing" } },
        {
          user: "{{agent}}",
          content: {
            text: "Generating ZK proof and routing via Ghost Relay...",
            action: "ZHAD0_PRIVATE_INTENT",
          },
        },
      ],
    ],
    validate: async (_runtime, message) => {
      const text = message?.content?.text ?? "";
      const lower = text.toLowerCase();
      return (
        lower.includes("private") ||
        lower.includes("swap") ||
        lower.includes("zhad0") ||
        lower.includes("transfer") ||
        lower.includes("zk") ||
        lower.includes("bridge")
      );
    },
    handler: async (_runtime, message, _state, _options, callback) => {
      const text = message?.content?.text ?? "";
      try {
        const intent = extractIntentFromText(text);
        const receipt = await client.submitIntent(intent as Intent);

        const responseText =
          receipt.status === "PROVEN_OK"
            ? `Private intent submitted via ZHAD0. ZK proof verified (${receipt.proveMs}ms). Intent hash: ${receipt.intentHash.slice(0, 10)}... On-chain settlement queued for mainnet.`
            : `ZHAD0: Proof verification failed (${receipt.status}). Please retry.`;

        if (callback) {
          await callback({ text: responseText, action: "ZHAD0_PRIVATE_INTENT" });
        }
        return true;
      } catch (err) {
        if (callback) {
          await callback({ text: `ZHAD0 relay error: ${String(err)}` });
        }
        return false;
      }
    },
  };

  return {
    name: "zhad0-privacy",
    description:
      "ZHAD0 ZK privacy relay for Eliza agents. Enables private on-chain intents with real Schnorr zero-knowledge proofs.",
    actions: [privateIntentAction],
  };
}
