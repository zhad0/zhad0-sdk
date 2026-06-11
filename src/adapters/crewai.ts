/**
 * CrewAI adapter for ZHAD0.
 *
 * CrewAI is a Python framework. This module provides:
 *   1. A Node.js helper that calls the ZHAD0 server-assisted relay endpoint,
 *      for use in CrewAI tool bridges.
 *   2. See python/zhad0_sdk/crewai_tool.py for the native Python wrapper.
 *
 * Server-assisted mode: proof generation happens on the ZHAD0 API server.
 * The API endpoint is POST /api/intents/assisted.
 */

export interface CrewAiToolShape {
  name: string;
  description: string;
  run: (args: string | Record<string, unknown>) => Promise<string>;
}

export interface CreateCrewAiToolOptions {
  apiUrl?: string;
  name?: string;
  description?: string;
}

/**
 * Returns a CrewAI BaseTool-compatible object (duck-typed).
 * For native Python, use python/zhad0_sdk/crewai_tool.py directly.
 */
export function createZhad0CrewAiTool(
  options: CreateCrewAiToolOptions = {}
): CrewAiToolShape {
  const apiUrl = options.apiUrl ?? "https://zhad0.io/api";

  return {
    name: options.name ?? "zhad0_private_intent",
    description:
      options.description ??
      "Submit a privacy-preserving on-chain intent via the ZHAD0 ZK relay (server-assisted proof). " +
        "Pass JSON: {action, tokenIn, tokenOut, amountIn, submitterAddress}. " +
        "Returns proof hash and relay confirmation.",
    run: async (input) => {
      const args: Record<string, unknown> =
        typeof input === "string" ? JSON.parse(input) : input;

      const res = await fetch(`${apiUrl}/intents/assisted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(`ZHAD0 API error: ${err["error"] ?? res.statusText}`);
      }

      const data = (await res.json()) as {
        status: string;
        proofHash: string;
        verified: boolean;
        relayedAt: string;
        feeEth: string;
        proveMs: number;
      };

      return (
        `ZHAD0 relay confirmed. status=${data.status} verified=${data.verified} ` +
        `proofHash=${data.proofHash.slice(0, 12)}... fee=${data.feeEth}ETH`
      );
    },
  };
}
