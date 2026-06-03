export {
  PROOF_SCHEME,
  PROTOCOL_GAS_CEILING,
  secretToScalar,
  commitmentFromSecret,
  hashPublicInputs,
  generateIntentProof,
  verifyIntentProof,
  type IntentPublicInputs,
  type ZkIntentProof,
  type GenerateProofInput,
  type VerifyResult,
} from "./proof.js";

export {
  IntentPublicInputsSchema,
  ZkIntentProofSchema,
  type ZkIntentProofInput,
} from "./schema.js";
