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
} from "@workspace/zhad0-proof";

function canonicalStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalStringify).join(",") + "]";
  const obj = v as Record<string, unknown>;
  return (
    "{" +
    Object.keys(obj)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonicalStringify(obj[k]))
      .join(",") +
    "}"
  );
}

const GAS_BASE: Record<Intent["action"], number> = {
  TRANSFER: 21_000,
  SWAP: 180_000,
  LP_ADD: 240_000,
  LP_REMOVE: 220_000,
  BRIDGE: 320_000,
  CUSTOM: 150_000,
};

function estimateGas(intent: Intent, encrypted: EncryptedIntent): number {
  const payloadCost = Math.min(encrypted.ciphertext.length * 16, 600_000);
  return Math.min(GAS_BASE[intent.action] + payloadCost, PROTOCOL_GAS_CEILING);
}

export class Zhad0Client {
  readonly status = SDK_STATUS;

  private readonly agentAddress: string | undefined;
  private readonly baseUrl: string;
  private readonly framework: string;
  private readonly valueEth: string;
  private readonly network: string;
  private keyPromise: Promise<RawKey> | null = null;

  constructor(opts: Zhad0ClientOptions = {}) {
    this.agentAddress = opts.agentAddress;
    this.baseUrl = (opts.baseUrl ?? "https://zhad0.io/api").replace(/\/$/, "");
    this.framework = opts.framework ?? "Unknown";
    this.valueEth = opts.valueEth ?? "0";
    this.network = opts.network ?? "base-mainnet";
  }

  private getKey(): Promise<RawKey> {
    if (!this.keyPromise) this.keyPromise = generateThresholdSimKey();
    return this.keyPromise;
  }

  /** Encrypt an intent payload with AES-256-GCM. */
  async encryptIntent(intent: Intent): Promise<EncryptedIntent> {
    const parsed = IntentSchema.parse(intent);
    const canonical = canonicalStringify(parsed);
    const [key, intentHash] = await Promise.all([this.getKey(), sha256Hex(canonical)]);
    const { ciphertext, iv, keyFingerprint } = await encryptPlaintext(key, canonical);
    return {
      scheme: "AES-256-GCM",
      ciphertext,
      iv,
      keyFingerprint,
      intentHash,
      createdAt: Date.now(),
    };
  }

  /** Generate a real Schnorr secp256k1 NIZK proof of intent validity. */
  async proveIntent(intent: Intent, encrypted: EncryptedIntent): Promise<ZkIntentProof> {
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

  /**
   * Submit a private intent through the ZHAD0 Ghost Relay.
   *
   * Flow:
   *   1. Encrypts the intent payload with AES-256-GCM (client-side).
   *   2. Generates a real Schnorr secp256k1 NIZK proof (client-side).
   *   3. Locally verifies the proof before submission.
   *   4. If `agentAddress` is configured, POSTs proof to the relay API.
   *      The relay re-verifies the proof independently before storing it.
   *   5. Returns the full receipt including relay response.
   */
  async submitIntent(intent: Intent): Promise<SubmitReceipt> {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

    const encrypted = await this.encryptIntent(intent);
    const proof = await this.proveIntent(intent, encrypted);
    const verification = verifyIntentProof(proof);

    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const proveMs = Math.round(t1 - t0);

    // Submit to relay if agentAddress is set
    if (this.agentAddress) {
      try {
        const res = await fetch(`${this.baseUrl}/intents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submitterAddress: this.agentAddress,
            framework: this.framework,
            valueEth: this.valueEth,
            proof,
          }),
        });

        if (res.ok) {
          const data = await res.json() as {
            id?: string;
            proofHash?: string;
            feeEth?: string;
            relayerRegion?: string;
            status?: string;
          };
          return {
            status: verification.valid ? "PROVEN_OK" : "PROVEN_INVALID",
            intentHash: encrypted.intentHash,
            proofHash: data.proofHash ?? proof.proofHash,
            relayedId: data.id ?? null,
            proof,
            verified: verification.valid,
            proveMs,
            feeEth: data.feeEth ?? null,
            relayerRegion: data.relayerRegion ?? null,
            txHash: null,
            notice:
              "Proof submitted to Ghost Relay and independently verified. " +
              "On-chain anchoring to Base activates at mainnet launch.",
          };
        }

        // Relay rejected — surface the error
        const errBody = await res.json().catch(() => ({ error: res.statusText })) as { error?: string; reason?: string };
        throw new Error(
          `Relay rejected intent: ${errBody.error ?? res.statusText}${errBody.reason ? " — " + errBody.reason : ""}`,
        );
      } catch (e) {
        throw e instanceof Error ? e : new Error(String(e));
      }
    }

    // Local-only mode (no agentAddress configured)
    return {
      status: verification.valid ? "PROVEN_OK" : "PROVEN_INVALID",
      intentHash: encrypted.intentHash,
      proofHash: proof.proofHash,
      relayedId: null,
      proof,
      verified: verification.valid,
      proveMs,
      feeEth: null,
      relayerRegion: null,
      txHash: null,
      notice:
        "Proof generated and verified locally. " +
        "Set agentAddress in Zhad0Client options to submit to Ghost Relay.",
    };
  }

  wrapAgent<T extends object>(
    agent: T,
  ): T & { executeIntent: (i: Intent) => Promise<SubmitReceipt> } {
    const self = this;
    return new Proxy(agent, {
      get(target, prop, receiver) {
        if (prop === "executeIntent") return (i: Intent) => self.submitIntent(i);
        return Reflect.get(target, prop, receiver);
      },
    }) as T & { executeIntent: (i: Intent) => Promise<SubmitReceipt> };
  }
}
