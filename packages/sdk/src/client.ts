import {
    IntentSchema,
    SDK_STATUS,
    type EncryptedIntent,
    type Intent,
    type SimulatedProof,
    type SubmitReceipt,
    type Zhad0ClientOptions,
  } from "./types.js";
  import {
    encryptPlaintext,
    generateThresholdSimKey,
    sha256Hex,
    type RawKey,
  } from "./crypto.js";

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

  export class Zhad0Client {
    readonly options: Required<Zhad0ClientOptions>;
    readonly status = SDK_STATUS;
    private keyPromise: Promise<RawKey> | null = null;

    constructor(opts: Zhad0ClientOptions = {}) {
      this.options = {
        network: opts.network ?? "devnet-local",
        relayerMode: opts.relayerMode ?? "simulated",
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

    async simulateProof(encrypted: EncryptedIntent): Promise<SimulatedProof> {
      const proofHash = await sha256Hex(
        `proof:${encrypted.intentHash}:${encrypted.keyFingerprint}`
      );
      const publicInputsHash = await sha256Hex(
        `inputs:${encrypted.intentHash}`
      );
      return {
        scheme: "RISC_ZERO_V1.2_SIMULATED",
        proofHash,
        publicInputsHash,
        generatedAt: Date.now(),
        warning:
          "DESIGN_PREVIEW: no real ZK proof was generated. This is a stand-in for SDK ergonomics testing only.",
      };
    }

    async submitIntent(intent: Intent): Promise<SubmitReceipt> {
      const t0 =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const encrypted = await this.encryptIntent(intent);
      const proof = await this.simulateProof(encrypted);
      const t1 =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        status: "SIMULATED_OK",
        intentHash: encrypted.intentHash,
        proof,
        relayMs: Math.round(t1 - t0),
        txHash: null,
        notice:
          "ZHAD0 mainnet is not yet live. This receipt is a client-side simulation.",
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
  