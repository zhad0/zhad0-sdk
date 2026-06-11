import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";

/**
 * ZHAD0 zero-knowledge proof of intent validity.
 *
 * This is a REAL non-interactive zero-knowledge proof of knowledge built with
 * a Schnorr identification protocol made non-interactive via the Fiat-Shamir
 * transform over the secp256k1 curve.
 *
 * The prover demonstrates knowledge of the secret scalar `x` behind the public
 * commitment `P = x*G`, with the proof cryptographically bound to the intent's
 * public inputs (intent hash, nonce, gas estimate, gas ceiling). A verifier
 * learns nothing about `x` (zero-knowledge) yet is convinced the prover holds
 * it and that the public inputs were fixed at proving time.
 *
 * Mainnet target: migrate the validity relation to a RISC Zero Groth16 circuit
 * so all constraints (gas ceiling, schema, nonce monotonicity) are enforced
 * inside the zkVM and verified by an on-chain Solidity verifier.
 */

export const PROOF_SCHEME = "ZHAD0-SCHNORR-SECP256K1-v1" as const;

/** Protocol-wide maximum gas allowed per relayed intent. */
export const PROTOCOL_GAS_CEILING = 2_000_000;

const N = secp256k1.CURVE.n;
const G = secp256k1.Point.BASE;

export interface IntentPublicInputs {
  /** keccak/sha256 commitment to the encrypted intent payload (0x-prefixed hex). */
  intentHash: string;
  /** Monotonic per-submitter nonce, replay prevention. */
  nonce: number;
  /** Estimated execution gas for the intent. */
  gasEstimate: number;
  /** Maximum gas the circuit allows per intent. */
  gasCeiling: number;
}

export interface ZkIntentProof {
  scheme: typeof PROOF_SCHEME;
  /** Public commitment P = x*G, compressed hex (0x-prefixed). */
  commitment: string;
  /** Schnorr nonce point R = k*G, compressed hex (0x-prefixed). */
  r: string;
  /** Schnorr response s = k + e*x mod n, 32-byte hex (0x-prefixed). */
  s: string;
  publicInputs: IntentPublicInputs;
  /** Hash of the canonical public inputs (0x-prefixed). */
  publicInputsHash: string;
  /** Stable identifier for the proof object (0x-prefixed). */
  proofHash: string;
  generatedAt: number;
}

function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

function bytesToBigInt(b: Uint8Array): bigint {
  let x = 0n;
  for (const byte of b) x = (x << 8n) | BigInt(byte);
  return x;
}

function strip0x(h: string): string {
  return h.startsWith("0x") || h.startsWith("0X") ? h.slice(2) : h;
}

function scalarToHex(x: bigint): string {
  return "0x" + x.toString(16).padStart(64, "0");
}

function hashBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    buf.set(p, off);
    off += p.length;
  }
  return sha256(buf);
}

/** Hash arbitrary string parts into a scalar in [1, n-1]. */
function hashToScalar(...parts: string[]): bigint {
  const digest = hashBytes(...parts.map((p) => utf8ToBytes(p)));
  const x = mod(bytesToBigInt(digest), N);
  return x === 0n ? 1n : x;
}

/** Derive a deterministic secret scalar from arbitrary secret material. */
export function secretToScalar(secretMaterial: string): bigint {
  return hashToScalar("zhad0:secret:", secretMaterial);
}

/** Public commitment P = x*G for a secret scalar, compressed hex. */
export function commitmentFromSecret(secretMaterial: string): string {
  const x = secretToScalar(secretMaterial);
  return "0x" + G.multiply(x).toHex(true);
}

/** Canonical hash of the public inputs (0x-prefixed sha256). */
export function hashPublicInputs(pi: IntentPublicInputs): string {
  const canonical = [
    "zhad0:pi:v1",
    strip0x(pi.intentHash).toLowerCase(),
    String(pi.nonce),
    String(pi.gasEstimate),
    String(pi.gasCeiling),
  ].join("|");
  return "0x" + bytesToHex(hashBytes(utf8ToBytes(canonical)));
}

function challenge(rHex: string, commitmentHex: string, publicInputsHash: string): bigint {
  return hashToScalar(
    "zhad0:challenge:v1",
    strip0x(rHex).toLowerCase(),
    strip0x(commitmentHex).toLowerCase(),
    strip0x(publicInputsHash).toLowerCase(),
  );
}

function computeProofHash(p: {
  commitment: string;
  r: string;
  s: string;
  publicInputsHash: string;
}): string {
  const canonical = [
    PROOF_SCHEME,
    strip0x(p.commitment).toLowerCase(),
    strip0x(p.r).toLowerCase(),
    strip0x(p.s).toLowerCase(),
    strip0x(p.publicInputsHash).toLowerCase(),
  ].join("|");
  return "0x" + bytesToHex(hashBytes(utf8ToBytes(canonical)));
}

export interface GenerateProofInput {
  /** Secret material only the agent holds (e.g. intent key fingerprint + salt). */
  secretMaterial: string;
  publicInputs: IntentPublicInputs;
  /** Optional explicit randomness for the Schnorr nonce (testing); 32-byte hex. */
  nonceScalarHex?: string;
}

/** Generate a real Schnorr non-interactive zero-knowledge proof of intent validity. */
export function generateIntentProof(input: GenerateProofInput): ZkIntentProof {
  const x = secretToScalar(input.secretMaterial);
  const commitmentHex = "0x" + G.multiply(x).toHex(true);

  let k: bigint;
  if (input.nonceScalarHex) {
    k = mod(bytesToBigInt(hexToBytes(strip0x(input.nonceScalarHex))), N);
    if (k === 0n) k = 1n;
  } else {
    k = mod(bytesToBigInt(secp256k1.utils.randomPrivateKey()), N);
    if (k === 0n) k = 1n;
  }
  const rHex = "0x" + G.multiply(k).toHex(true);

  const publicInputsHash = hashPublicInputs(input.publicInputs);
  const e = challenge(rHex, commitmentHex, publicInputsHash);
  const s = mod(k + mod(e * x, N), N);
  const sHex = scalarToHex(s);

  const proofHash = computeProofHash({
    commitment: commitmentHex,
    r: rHex,
    s: sHex,
    publicInputsHash,
  });

  return {
    scheme: PROOF_SCHEME,
    commitment: commitmentHex,
    r: rHex,
    s: sHex,
    publicInputs: input.publicInputs,
    publicInputsHash,
    proofHash,
    generatedAt: Date.now(),
  };
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verify a Schnorr NIZK: checks s*G == R + e*P, that the public-inputs hash and
 * proof hash are internally consistent, and that intent constraints hold.
 */
export function verifyIntentProof(proof: ZkIntentProof): VerifyResult {
  try {
    if (proof.scheme !== PROOF_SCHEME) {
      return { valid: false, reason: "Unknown proof scheme" };
    }

    const expectedPiHash = hashPublicInputs(proof.publicInputs);
    if (expectedPiHash.toLowerCase() !== proof.publicInputsHash.toLowerCase()) {
      return { valid: false, reason: "Public inputs hash mismatch" };
    }

    const expectedProofHash = computeProofHash(proof);
    if (expectedProofHash.toLowerCase() !== proof.proofHash.toLowerCase()) {
      return { valid: false, reason: "Proof hash mismatch" };
    }

    const pi = proof.publicInputs;
    if (!Number.isFinite(pi.gasEstimate) || !Number.isFinite(pi.gasCeiling)) {
      return { valid: false, reason: "Invalid gas inputs" };
    }
    if (pi.gasEstimate <= 0) {
      return { valid: false, reason: "Gas estimate must be positive" };
    }
    if (pi.gasEstimate > pi.gasCeiling) {
      return { valid: false, reason: "Gas estimate exceeds ceiling" };
    }
    if (!Number.isInteger(pi.nonce) || pi.nonce < 0) {
      return { valid: false, reason: "Invalid nonce" };
    }

    const P = secp256k1.Point.fromHex(strip0x(proof.commitment));
    const R = secp256k1.Point.fromHex(strip0x(proof.r));
    const s = mod(bytesToBigInt(hexToBytes(strip0x(proof.s))), N);
    const e = challenge(proof.r, proof.commitment, proof.publicInputsHash);

    const lhs = G.multiply(s);
    const rhs = R.add(P.multiply(e));
    if (!lhs.equals(rhs)) {
      return { valid: false, reason: "Schnorr equation failed" };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : "Verification error" };
  }
}
