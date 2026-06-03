export { Zhad0Client } from "./client.js";
export * from "./adapters/index.js";
export {
  IntentSchema,
  EncryptedIntentSchema,
  SDK_STATUS,
} from "./types.js";
export type {
  Intent,
  EncryptedIntent,
  ZkIntentProof,
  SubmitReceipt,
  Zhad0ClientOptions,
} from "./types.js";
export { sha256Hex } from "./crypto.js";
export {
  generateIntentProof,
  verifyIntentProof,
  commitmentFromSecret,
  PROTOCOL_GAS_CEILING,
  PROOF_SCHEME,
  ZkIntentProofSchema,
  type IntentPublicInputs,
} from "@zhad0/proof";
