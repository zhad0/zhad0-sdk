import { z } from "zod";
import type { Zhad0Client } from "../client.js";
import type { Intent } from "../types.js";

const intentArgsSchema = z.object({
  action: z
    .enum(["SWAP", "TRANSFER", "LP_ADD", "LP_REMOVE", "BRIDGE", "CUSTOM"])
    .describe("Type of on-chain action"),
  tokenIn: z.string().optional().describe("Input token address"),
  tokenOut: z.string().optional().describe("Output token address"),
  amountIn: z.string().optional().describe("Input amount in base units"),
  amountOutMin: z.string().optional().describe("Minimum output amount"),
  target: z.string().optional().describe("Target contract address"),
  calldata: z.string().optional().describe("Hex-encoded calldata"),
});

export interface AgentKitActionShape {
  name: string;
  description: string;
  argsSchema: typeof intentArgsSchema;
  func: (
    walletProvider: unknown,
    args: z.infer<typeof intentArgsSchema>
  ) => Promise<string>;
}

export interface CreateZhad0ActionOptions {
  name?: string;
  description?: string;
}

/**
 * Returns a Coinbase AgentKit Action-compatible object.
 * Register it with your ActionProvider or pass it to AgentKit directly.
 *
 * @example
 * import { createZhad0Action } from "@zhad0/sdk/agentkit";
 * import { Zhad0Client } from "@zhad0/sdk";
 * const client = new Zhad0Client({ network: "base-sepolia" });
 * const action = createZhad0Action(client);
 * // agentkit.addAction(action);
 */
export function createZhad0Action(
  client: Zhad0Client,
  options: CreateZhad0ActionOptions = {}
): AgentKitActionShape {
  return {
    name: options.name ?? "zhad0PrivateIntent",
    description:
      options.description ??
      "Submit a privacy-preserving on-chain intent via ZHAD0. " +
        "The intent is encrypted and zero-knowledge proven before relay — " +
        "protecting your agent's strategy from MEV bots and on-chain observers.",
    argsSchema: intentArgsSchema,
    func: async (_walletProvider, args) => {
      const receipt = await client.submitIntent(args as Intent);
      return JSON.stringify({
        status: receipt.status,
        intentHash: receipt.intentHash,
        verified: receipt.verified,
        proveMs: receipt.proveMs,
        txHash: receipt.txHash,
        notice: receipt.notice,
      });
    },
  };
}
