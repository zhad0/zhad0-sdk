import {
  IntentSchema,
  SDK_STATUS,
  type EncryptedIntent,
  type Intent,
  type SubmitReceipt,
  type ZkIntentProof,
  type Zhad0ClientOptions,
} from "./types.js";
import {
  encryptPlaintext,
  generateThresholdSimKey,
  sha256Hex,
  type RawKey,
} from "./crypto.js";
import {
  generateIntentProof,
  verifyIntentProof,
  PROTOCOL_GAS_CEILING,
} from "@zhad0/proof";

function canonicalStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalStringify).join(",") + "]";
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalStringify(obj[k]))
      .join(",") +
    "}"
  );
}

/** Deterministic gas estimate for an intent, derived from its action and size. */
function estimateGas(intent: Intent, encrypted: EncryptedIntent): number {
  const base: Record<Intent["action"], number> = {
    TRANSFER: 21_000,
    SWAP: 180_000,
    LP_ADD: 240_000,
    LP_REMOVE: 220_000,
    BRIDGE: 320_000,
    CUSTOM: 150_000,
  };
  const payloadCost = Math.min(encrypted.ciphertext.length * 16, 600_000);
  const estimate = base[intent.action] + payloadCost;
  return Math.min(estimate, PROTOCOL_GAS_CEILING);
}

export class Zhad0Client {
  readonly options: Required<Zhad0ClientOptions>;
  readonly status = SDK_STATUS;
  private keyPromise: Promise<RawKey> | null = null;

  constructor(opts: Zhad0ClientOptions = {}) {
    this.options = {
      network: opts.network ?? "devnet-local",
      relayerMode: opts.relayerMode ?? "ghost",
    };
  }

  private getKey(): Promise<RawKey> {
    if (!this.keyPromise) this.keyPromise = generateThresholdSimKey();
    return this.keyPromise;
  }

  async encryptIntent(intent: Intent): Promise<EncryptedIntent> {
    const parsed = IntentSchema.parse(intent);
    const canonical = canonicalStringify(parsed);
    const [key, intentHash] = await Promise.all([
      this.getKey(),
      sha256Hex(canonical),
    ]);
    const { ciphertext, iv, keyFingerprint } = await encryptPlaintext(
      key,
      canonical
    );
    return {
      scheme: "AES-256-GCM",
      ciphertext,
      iv,
      keyFingerprint,
      intentHash,
      createdAt: Date.now(),
    };
  }

  /**
   * Generate a real zero-knowledge proof of intent validity. The proof attests
   * that the client holds the secret behind the intent commitment and binds the
   * intent hash, nonce, and gas envelope — without revealing the intent itself.
   *
   * Proof scheme: Schnorr NIZK over secp256k1 (Fiat-Shamir transform).
   * Mainnet target: RISC Zero Groth16 zkVM circuit with on-chain Solidity verifier.
   */
  async proveIntent(
    intent: Intent,
    encrypted: EncryptedIntent
  ): Promise<ZkIntentProof> {
    const secretMaterial = `${encrypted.keyFingerprint}:${encrypted.intentHash}`;
    const gasEstimate = estimateGas(intent, encrypted);
    return generateIntentProof({
      secretMaterial,
      publicInputs: {
        intentHash: encrypted.intentHash.startsWith("0x")
          ? encrypted.intentHash
          : `0x${encrypted.intentHash}`,
        nonce: intent.nonce ?? 0,
        gasEstimate,
        gasCeiling: PROTOCOL_GAS_CEILING,
      },
    });
  }

  async submitIntent(intent: Intent): Promise<SubmitReceipt> {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const encrypted = await this.encryptIntent(intent);
    const proof = await this.proveIntent(intent, encrypted);
    const verification = verifyIntentProof(proof);
    const t1 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      status: verification.valid ? "PROVEN_OK" : "PROVEN_INVALID",
      intentHash: encrypted.intentHash,
      proof,
      verified: verification.valid,
      proveMs: Math.round(t1 - t0),
      txHash: null,
      notice:
        "Proof generated and verified locally. Submit to a Ghost Relay node to anchor on Base at mainnet launch.",
    };
  }

  wrapAgent<T extends object>(agent: T): T & { executeIntent: (i: Intent) => Promise<SubmitReceipt> } {
    const self = this;
    return new Proxy(agent, {
      get(target, prop, receiver) {
        if (prop === "executeIntent") {
          return (i: Intent) => self.submitIntent(i);
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as T & { executeIntent: (i: Intent) => Promise<SubmitReceipt> };
  }
}
