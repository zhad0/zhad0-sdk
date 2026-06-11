import { z } from "zod";
import type { ZkIntentProof } from "@workspace/zhad0-proof";

export const IntentSchema = z.object({
  action: z.enum(["SWAP", "TRANSFER", "LP_ADD", "LP_REMOVE", "BRIDGE", "CUSTOM"]),
  tokenIn: z.string().optional(),
  tokenOut: z.string().optional(),
  amountIn: z.string().optional(),
  amountOutMin: z.string().optional(),
  amount: z.string().optional(),
  to: z.string().optional(),
  target: z.string().optional(),
  calldata: z.string().optional(),
  nonce: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Intent = z.infer<typeof IntentSchema>;

export const EncryptedIntentSchema = z.object({
  scheme: z.literal("AES-256-GCM"),
  ciphertext: z.string(),
  iv: z.string(),
  keyFingerprint: z.string(),
  intentHash: z.string(),
  createdAt: z.number(),
});
export type EncryptedIntent = z.infer<typeof EncryptedIntentSchema>;

export type { ZkIntentProof } from "@workspace/zhad0-proof";

export interface SubmitReceipt {
  status: "PROVEN_OK" | "PROVEN_INVALID";
  intentHash: string;
  proofHash: string;
  relayedId: string | null;
  proof: ZkIntentProof;
  verified: boolean;
  proveMs: number;
  feeEth: string | null;
  relayerRegion: string | null;
  txHash: null;
  notice: string;
}

export interface Zhad0ClientOptions {
  /**
   * Your Base wallet address (0x...). Required to submit intents to the relay.
   * Generate an API key first via: POST https://zhad0.io/api/keys
   */
  agentAddress?: string;
  /**
   * Base URL for the ZHAD0 API. Defaults to https://zhad0.io/api
   */
  baseUrl?: string;
  /**
   * Agent framework name for analytics (e.g. "LangChain", "AgentKit").
   * Defaults to "Unknown".
   */
  framework?: string;
  /**
   * Estimated intent value in ETH (used for fee calculation). Defaults to "0".
   */
  valueEth?: string;
  network?: "base-mainnet" | "base-sepolia" | "devnet-local";
  relayerMode?: "ghost" | "direct" | "simulated";
}

export const SDK_STATUS = {
  phase: "PRE_LAUNCH",
  version: "0.1.1",
  mainnetLive: false,
  realProofs: true,
  realEncryption: true,
  proofScheme: "ZHAD0-SCHNORR-SECP256K1-v1",
  message:
    "Encryption is real (AES-256-GCM via Web Crypto) and zero-knowledge proofs are real " +
    "(Schnorr NIZK over secp256k1, independently verifiable). " +
    "On-chain anchoring and the RISC Zero Groth16 circuit activate at mainnet launch.",
} as const;
