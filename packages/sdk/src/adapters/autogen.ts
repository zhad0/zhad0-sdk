/**
 * Autogen (Microsoft) adapter for ZHAD0.
 *
 * Autogen is a Python framework. This module provides:
 *   1. A Node.js helper that calls the ZHAD0 server-assisted relay endpoint,
 *      for use in Autogen tool bridges that spawn Node subprocesses.
 *   2. See python/zhad0_sdk/autogen_tool.py for the native Python wrapper.
 *
 * Server-assisted mode: proof generation happens on the ZHAD0 API server
 * (not in the Python agent process). The API endpoint is POST /api/intents/assisted.
 */

export interface Zhad0AssistedReceipt {
  id: string;
  proofHash: string;
  status: string;
  verified: boolean;
  agentFramework: string;
  relayedAt: string;
  feeEth: string;
  proveMs: number;
}

export interface AutogenToolShape {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  execute: (args: Record<string, string>) => Promise<string>;
}

export interface CreateAutogenToolOptions {
  apiUrl?: string;
  name?: string;
  description?: string;
}

/**
 * Returns an OpenAI function-calling compatible tool shape for use in
 * Autogen's `register_for_llm` / `register_for_execution` pattern via
 * a Node.js bridge or function executor.
 *
 * For native Python, use python/zhad0_sdk/autogen_tool.py directly.
 */
export function createZhad0AutogenTool(
  options: CreateAutogenToolOptions = {}
): AutogenToolShape {
  const apiUrl = options.apiUrl ?? "https://zhad0.io/api";

  return {
    name: options.name ?? "zhad0_private_intent",
    description:
      options.description ??
      "Submit a privacy-preserving on-chain intent via the ZHAD0 ZK relay. " +
        "The API generates a real zero-knowledge proof server-side (server-assisted mode). " +
        "Intent contents are never revealed to observers or MEV bots.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Intent type: SWAP | TRANSFER | LP_ADD | LP_REMOVE | BRIDGE | CUSTOM",
        },
        tokenIn: { type: "string", description: "Input token address" },
        tokenOut: { type: "string", description: "Output token address" },
        amountIn: { type: "string", description: "Input amount in base units" },
        submitterAddress: {
          type: "string",
          description: "Submitting agent's Base address (0x...)",
        },
      },
      required: ["action", "submitterAddress"],
    },
    execute: async (args) => {
      const res = await fetch(`${apiUrl}/intents/assisted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(`ZHAD0 API error: ${err["error"] ?? res.statusText}`);
      }
      const data = (await res.json()) as Zhad0AssistedReceipt;
      return JSON.stringify({
        status: data.status,
        verified: data.verified,
        proofHash: data.proofHash,
        relayedAt: data.relayedAt,
        feeEth: data.feeEth,
      });
    },
  };
}
