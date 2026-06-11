import { z } from "zod";
import type { Zhad0Client } from "../client.js";
import type { Intent } from "../types.js";

const intentParameters = z.object({
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

export interface VercelAiToolShape {
  description: string;
  parameters: typeof intentParameters;
  execute: (args: z.infer<typeof intentParameters>) => Promise<string>;
}

export interface CreateZhad0AiToolOptions {
  description?: string;
}

/**
 * Returns a Vercel AI SDK `tool()`-compatible object.
 * Assign it directly inside the `tools` map passed to generateText / streamText.
 *
 * @example
 * import { createZhad0AiTool } from "@zhad0/sdk/vercel-ai";
 * import { Zhad0Client } from "@zhad0/sdk";
 * const client = new Zhad0Client({ network: "base-sepolia" });
 * const result = await generateText({
 *   model: openai("gpt-4o"),
 *   tools: { privateIntent: createZhad0AiTool(client) },
 *   prompt: "Swap 100 USDC to WETH privately",
 * });
 */
export function createZhad0AiTool(
  client: Zhad0Client,
  options: CreateZhad0AiToolOptions = {}
): VercelAiToolShape {
  return {
    description:
      options.description ??
      "Submit a private on-chain intent via the ZHAD0 ZK relay. " +
        "The intent is encrypted and ZK-proven before submission — " +
        "no contents are visible to observers or MEV bots.",
    parameters: intentParameters,
    execute: async (args) => {
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
