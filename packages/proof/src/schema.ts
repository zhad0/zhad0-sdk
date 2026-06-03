import { z } from "zod";
import { PROOF_SCHEME } from "./proof.js";

const hex = z.string().regex(/^0x[0-9a-fA-F]+$/, "Expected 0x-prefixed hex");

export const IntentPublicInputsSchema = z.object({
  intentHash: hex,
  nonce: z.number().int().nonnegative(),
  gasEstimate: z.number().int().positive(),
  gasCeiling: z.number().int().positive(),
});

export const ZkIntentProofSchema = z.object({
  scheme: z.literal(PROOF_SCHEME),
  commitment: hex,
  r: hex,
  s: hex,
  publicInputs: IntentPublicInputsSchema,
  publicInputsHash: hex,
  proofHash: hex,
  generatedAt: z.number(),
});

export type ZkIntentProofInput = z.infer<typeof ZkIntentProofSchema>;
