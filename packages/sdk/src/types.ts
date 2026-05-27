import { z } from "zod";

  export const IntentSchema = z.object({
    action: z.enum(["SWAP", "TRANSFER", "LP_ADD", "LP_REMOVE", "BRIDGE", "CUSTOM"]),
    tokenIn: z.string().optional(),
    tokenOut: z.string().optional(),
    amountIn: z.string().optional(),
    amountOutMin: z.string().optional(),
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

  export const SimulatedProofSchema = z.object({
    scheme: z.literal("RISC_ZERO_V1.2_SIMULATED"),
    proofHash: z.string(),
    publicInputsHash: z.string(),
    generatedAt: z.number(),
    warning: z.literal(
      "DESIGN_PREVIEW: no real ZK proof was generated. This is a stand-in for SDK ergonomics testing only."
    ),
  });
  export type SimulatedProof = z.infer<typeof SimulatedProofSchema>;

  export const SubmitReceiptSchema = z.object({
    status: z.enum(["SIMULATED_OK", "SIMULATED_REJECTED"]),
    intentHash: z.string(),
    proof: SimulatedProofSchema,
    relayMs: z.number(),
    txHash: z.null(),
    notice: z.literal(
      "ZHAD0 mainnet is not yet live. This receipt is a client-side simulation."
    ),
  });
  export type SubmitReceipt = z.infer<typeof SubmitReceiptSchema>;

  export interface Zhad0ClientOptions {
    network?: "base-mainnet" | "base-sepolia" | "devnet-local";
    relayerMode?: "ghost" | "direct" | "simulated";
  }

  export const SDK_STATUS = {
    phase: "DESIGN_PREVIEW",
    version: "0.0.0-design.1",
    mainnetLive: false,
    realProofs: false,
    realEncryption: true,
    message:
      "This SDK demonstrates the planned API surface. Encryption is real (AES-256-GCM via Web Crypto). ZK proofs and relayer submission are simulated until the Ghost Relay network and on-chain verifier are live.",
  } as const;
  