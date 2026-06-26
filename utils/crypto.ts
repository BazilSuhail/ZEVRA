import { x25519, ed25519 } from "./noble-curves";

// ─── Encoding helpers ─────────────────────────────────────────────────────────

export function bufToHex(buf: Uint8Array): string {
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bufToBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

export function base64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

export function concat(...bufs: Uint8Array[]): Uint8Array {
  const total = bufs.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const b of bufs) {
    out.set(b, offset);
    offset += b.length;
  }
  return out;
}

// ─── SHA-256 (native WebCrypto) ──────────────────────────────────────────────

export async function sha256(...inputs: Uint8Array[]): Promise<Uint8Array> {
  const merged = inputs.length === 1 ? inputs[0] : concat(...inputs);
  const hash = await crypto.subtle.digest("SHA-256", merged as unknown as ArrayBuffer);
  return new Uint8Array(hash);
}

export async function sha256Hex(...inputs: Uint8Array[]): Promise<string> {
  return bufToHex(await sha256(...inputs));
}

// ─── AES-256-GCM (native WebCrypto) ─────────────────────────────────────────

export async function aesEncrypt(
  key: Uint8Array,
  plaintext: Uint8Array
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer, tagLength: 16 },
    cryptoKey,
    plaintext as unknown as ArrayBuffer
  );
  const buf = new Uint8Array(encrypted);
  const tag = buf.slice(-16);
  const ciphertext = buf.slice(0, -16);
  return { ciphertext, iv, tag };
}

export async function aesDecrypt(
  key: Uint8Array,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const combined = concat(ciphertext, tag);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer, tagLength: 16 },
    cryptoKey,
    combined as unknown as ArrayBuffer
  );
  return new Uint8Array(decrypted);
}

// ─── X25519 Key Exchange (noble - universal browser support) ─────────────────

export function generateX25519KeyPair() {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function x25519DH(
  theirPublicKey: Uint8Array,
  myPrivateKey: Uint8Array
): Uint8Array {
  return x25519.getSharedSecret(myPrivateKey, theirPublicKey);
}

// ─── Ed25519 Signing (noble - universal browser support) ─────────────────────

export function generateEd25519KeyPair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function sign(
  message: Uint8Array,
  privateKey: Uint8Array
): Uint8Array {
  return ed25519.sign(message, privateKey);
}

export function verify(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return ed25519.verify(signature, message, publicKey);
}

// ─── Seal/Unseal private keys (matches server format) ────────────────────────
// Format: base64(iv):base64(tag):base64(ciphertext)

export async function sealPrivateKey(
  privateKey: Uint8Array,
  kek: Uint8Array
): Promise<string> {
  const { ciphertext, iv, tag } = await aesEncrypt(kek, privateKey);
  return `${bufToBase64(iv)}:${bufToBase64(tag)}:${bufToBase64(ciphertext)}`;
}

export async function unsealPrivateKey(
  sealed: string,
  kek: Uint8Array
): Promise<Uint8Array> {
  const [ivB64, tagB64, ctB64] = sealed.split(":");
  return aesDecrypt(
    kek,
    base64ToBuf(ctB64),
    base64ToBuf(ivB64),
    base64ToBuf(tagB64)
  );
}

// ─── Key Fingerprint (SHA-256 of public key) ─────────────────────────────────

export async function fingerprint(publicKey: Uint8Array): Promise<string> {
  const hash = await sha256(publicKey);
  const hex = bufToHex(hash);
  return hex
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join(" ");
}
