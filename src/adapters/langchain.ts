import { z } from "zod";
import type { Zhad0Client } from "../client.js";
import type { Intent } from "../types.js";

const intentSchema = z.object({
  action: z
    .enum(["SWAP", "TRANSFER", "LP_ADD", "LP_REMOVE", "BRIDGE", "CUSTOM"])
    .describe("Type of intent"),
  tokenIn: z.string().optional().describe("Input token address (0x...)"),
  tokenOut: z.string().optional().describe("Output token address (0x...)"),
  amountIn: z.string().optional().describe("Input amount in base units"),
  amountOutMin: z.string().optional().describe("Minimum output amount"),
  target: z.string().optional().describe("Target contract address"),
  calldata: z.string().optional().describe("Hex-encoded calldata"),
});

export interface LangChainToolShape {
  name: string;
  description: string;
  schema: typeof intentSchema;
  func: (input: z.infer<typeof intentSchema>) => Promise<string>;
}

export interface CreateZhad0ToolOptions {
  name?: string;
  description?: string;
}

/**
 * Returns a DynamicStructuredTool-compatible object for LangChain.
 * Pass the result directly into the `tools` array of any LangChain agent.
 *
 * @example
 * import { createZhad0Tool } from "@zhad0/sdk/langchain";
 * import { Zhad0Client } from "@zhad0/sdk";
 * const client = new Zhad0Client({ network: "base-sepolia" });
 * const agent = await createReactAgent({ llm, tools: [createZhad0Tool(client)] });
 */
export function createZhad0Tool(
  client: Zhad0Client,
  options: CreateZhad0ToolOptions = {}
): LangChainToolShape {
  return {
    name: options.name ?? "zhad0_private_intent",
    description:
      options.description ??
      "Submit a privacy-preserving on-chain intent via the ZHAD0 ZK relay. " +
        "Encrypts the intent with AES-256-GCM and generates a Schnorr zero-knowledge proof " +
        "before submission so no intent content is revealed to observers or relayers.",
    schema: intentSchema,
    func: async (input) => {
      const receipt = await client.submitIntent(input as Intent);
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
