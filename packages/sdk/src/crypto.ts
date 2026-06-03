function getCrypto(): Crypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  throw new Error(
    "[zhad0-sdk] Web Crypto (SubtleCrypto) is not available in this environment."
  );
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

function fromUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function asBuf(u: Uint8Array): BufferSource {
  return u as unknown as BufferSource;
}

export async function sha256Hex(input: string): Promise<string> {
  const c = getCrypto();
  const digest = await c.subtle.digest("SHA-256", asBuf(fromUtf8(input)));
  return "0x" + toHex(digest);
}

export interface RawKey {
  key: CryptoKey;
  fingerprint: string;
}

export async function generateThresholdSimKey(): Promise<RawKey> {
  const c = getCrypto();
  const key = await c.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const raw = await c.subtle.exportKey("raw", key);
  const fpDigest = await c.subtle.digest("SHA-256", raw);
  return { key, fingerprint: "0x" + toHex(fpDigest).slice(0, 16) };
}

export interface EncryptOutput {
  ciphertext: string;
  iv: string;
  keyFingerprint: string;
}

export async function encryptPlaintext(
  raw: RawKey,
  plaintext: string
): Promise<EncryptOutput> {
  const c = getCrypto();
  const iv = c.getRandomValues(new Uint8Array(12));
  const ct = await c.subtle.encrypt(
    { name: "AES-GCM", iv: asBuf(iv) },
    raw.key,
    asBuf(fromUtf8(plaintext))
  );
  return {
    ciphertext: "0x" + toHex(ct),
    iv: "0x" + toHex(iv),
    keyFingerprint: raw.fingerprint,
  };
}
