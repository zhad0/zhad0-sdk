import type { Zhad0Client } from "../client.js";
import type { Intent } from "../types.js";

export interface GameFunctionArg {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

export type GameFunctionStatus = "DONE" | "FAILED" | "IN_PROGRESS";

export interface GameFunctionResult {
  action_status: GameFunctionStatus;
  result: string;
  feedback_message?: string;
}

export interface GameFunctionShape {
  fn_name: string;
  fn_description: string;
  args: GameFunctionArg[];
  hint?: string;
  executable: (
    args: Record<string, string>,
    logger: (msg: string) => void
  ) => Promise<GameFunctionResult>;
}

export interface CreateZhad0GameFunctionOptions {
  fn_name?: string;
  fn_description?: string;
}

/**
 * Returns a Virtuals Protocol GAME SDK GameFunction-compatible object.
 * Register it with your GameWorker to give your GAME agent private intent submission.
 *
 * @example
 * import { createZhad0GameFunction } from "@zhad0/sdk/virtuals";
 * import { Zhad0Client } from "@zhad0/sdk";
 * const client = new Zhad0Client({ network: "base-sepolia" });
 * const worker = new GameWorker({ functions: [createZhad0GameFunction(client)] });
 */
export function createZhad0GameFunction(
  client: Zhad0Client,
  options: CreateZhad0GameFunctionOptions = {}
): GameFunctionShape {
  return {
    fn_name: options.fn_name ?? "submit_private_intent",
    fn_description:
      options.fn_description ??
      "Submit a private on-chain intent via the ZHAD0 zero-knowledge relay. " +
        "The intent is encrypted with AES-256-GCM and proven with a Schnorr ZK proof " +
        "before relay — invisible to MEV bots, front-runners, and on-chain observers.",
    args: [
      {
        name: "action",
        type: "string",
        description:
          "Intent type. One of: SWAP, TRANSFER, LP_ADD, LP_REMOVE, BRIDGE, CUSTOM",
        required: true,
      },
      {
        name: "tokenIn",
        type: "string",
        description: "Input token address (0x...)",
        required: false,
      },
      {
        name: "tokenOut",
        type: "string",
        description: "Output token address (0x...)",
        required: false,
      },
      {
        name: "amountIn",
        type: "string",
        description: "Input amount in base units (e.g. '1000000' for 1 USDC)",
        required: false,
      },
      {
        name: "amountOutMin",
        type: "string",
        description: "Minimum output amount (slippage protection)",
        required: false,
      },
    ],
    hint: "Use this for any on-chain action where privacy matters. The ZK proof is generated locally — no intent data leaves the agent in plaintext.",
    executable: async (args, logger) => {
      logger("[ZHAD0] Building encrypted intent...");
      try {
        const validActions = [
          "SWAP",
          "TRANSFER",
          "LP_ADD",
          "LP_REMOVE",
          "BRIDGE",
          "CUSTOM",
        ] as const;
        type ValidAction = (typeof validActions)[number];
        const action = validActions.includes(args.action as ValidAction)
          ? (args.action as ValidAction)
          : ("CUSTOM" as const);

        const intent: Intent = {
          action,
          tokenIn: args.tokenIn,
          tokenOut: args.tokenOut,
          amountIn: args.amountIn,
          amountOutMin: args.amountOutMin,
        };

        logger("[ZHAD0] Generating Schnorr ZK proof...");
        const receipt = await client.submitIntent(intent);
        logger(
          `[ZHAD0] Proof ${receipt.status} in ${receipt.proveMs}ms — hash ${receipt.intentHash.slice(0, 10)}...`
        );

        if (receipt.status === "PROVEN_INVALID") {
          return {
            action_status: "FAILED",
            result: `ZK proof verification failed`,
            feedback_message: "Retry with valid intent parameters",
          };
        }

        return {
          action_status: "DONE",
          result: JSON.stringify({
            status: receipt.status,
            intentHash: receipt.intentHash,
            verified: receipt.verified,
            proveMs: receipt.proveMs,
            txHash: receipt.txHash,
          }),
        };
      } catch (err) {
        logger(`[ZHAD0] Error: ${String(err)}`);
        return {
          action_status: "FAILED",
          result: String(err),
          feedback_message: "ZHAD0 relay error — check agent logs",
        };
      }
    },
  };
}
