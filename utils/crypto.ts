// ─── Client-Side End-to-End Encryption ──────────────────────────────────────
// All encryption/decryption happens client-side. Server never sees plaintext.
//
// Uses:
// - Argon2id (via @noble/hashes) for key derivation (matches server's argon2 npm)
// - X25519 (via @noble/curves) for key agreement
// - Ed25519 (via @noble/curves) for message signatures
// - AES-256-GCM (via WebCrypto) for symmetric encryption
// - HKDF (via @noble/hashes) for deriving encryption keys from ECDH shared secrets

import { argon2id } from "@noble/hashes/argon2.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { x25519, ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toBase64(buf: Uint8Array): string {
  let binary = "";
  for (const b of buf) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

// ─── 1. Key Derivation (Argon2id) ───────────────────────────────────────────
// Derives a Key Encryption Key (KEK) from password + salt.
// Uses same params as server: {m: 65536, t: 3, p: 4}

export function deriveKEK(password: string, saltB64: string): Uint8Array {
  const passwordBytes = new TextEncoder().encode(password);
  const salt = fromBase64(saltB64);
  return argon2id(passwordBytes, salt, {
    m: 65536,
    t: 3,
    p: 4,
    dkLen: 32,
  });
}

// ─── 2. Private Key Seal/Unseal (AES-256-GCM) ──────────────────────────────
// Server stores sealed keys as "iv:tag:ciphertext" (all base64).

async function aesGcmEncrypt(key: Uint8Array, plaintext: Uint8Array, iv?: Uint8Array) {
  const ivBytes = iv || crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey("raw", new Uint8Array(key), "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: new Uint8Array(ivBytes) }, cryptoKey, new Uint8Array(plaintext));
  const buf = new Uint8Array(encrypted);
  const tag = buf.slice(-16);
  const ciphertext = buf.slice(0, -16);
  return { ciphertext, iv: ivBytes, tag };
}

async function aesGcmDecrypt(key: Uint8Array, ciphertext: Uint8Array, iv: Uint8Array, tag: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", new Uint8Array(key), "AES-GCM", false, ["decrypt"]);
  const data = concat(ciphertext, tag);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, cryptoKey, new Uint8Array(data));
  return new Uint8Array(decrypted);
}

export async function sealPrivateKey(privateKey: Uint8Array, kek: Uint8Array): Promise<string> {
  const { ciphertext, iv, tag } = await aesGcmEncrypt(kek, privateKey);
  return `${toBase64(iv)}:${toBase64(tag)}:${toBase64(ciphertext)}`;
}

export async function unsealPrivateKey(sealed: string, kek: Uint8Array): Promise<Uint8Array> {
  const [ivB64, tagB64, ctB64] = sealed.split(":");
  const iv = fromBase64(ivB64);
  const tag = fromBase64(tagB64);
  const ciphertext = fromBase64(ctB64);
  return aesGcmDecrypt(kek, ciphertext, iv, tag);
}

// ─── 3. Message Encryption/Decryption (AES-256-GCM) ─────────────────────────

export async function encryptMessage(plaintext: string, groupKey: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const { ciphertext, tag } = await aesGcmEncrypt(groupKey, new TextEncoder().encode(plaintext), iv);
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    tag: toBase64(tag),
  };
}

export async function decryptMessage(ciphertextB64: string, ivB64: string, tagB64: string, groupKey: Uint8Array): Promise<string> {
  const ciphertext = fromBase64(ciphertextB64);
  const iv = fromBase64(ivB64);
  const tag = fromBase64(tagB64);
  const plaintext = await aesGcmDecrypt(groupKey, ciphertext, iv, tag);
  return new TextDecoder().decode(plaintext);
}

// ─── 4. Group Key Management (X25519 ECDH + HKDF) ──────────────────────────
// Each channel has a symmetric group key per epoch.
// The group key is encrypted for each member using X25519 ECDH.

export function generateGroupKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function deriveEncryptionKey(sharedSecret: Uint8Array, channelId: string, epoch: number): Uint8Array {
  const salt = sha256(new TextEncoder().encode(channelId));
  const info = new TextEncoder().encode(`zevra-epoch-${epoch}`);
  return hkdf(sha256, sharedSecret, salt, info, 32);
}

export async function encryptGroupKeyForReceiver(
  groupKey: Uint8Array,
  myPrivateKey: Uint8Array,
  receiverPublicKeyB64: string,
  channelId: string,
  epoch: number,
): Promise<string> {
  const receiverPub = fromBase64(receiverPublicKeyB64);
  const sharedSecret = x25519.getSharedSecret(myPrivateKey, receiverPub);
  const derivedKey = deriveEncryptionKey(sharedSecret, channelId, epoch);
  const { ciphertext, iv, tag } = await aesGcmEncrypt(derivedKey, groupKey);
  // Return as "iv:tag:ciphertext" base64
  return `${toBase64(iv)}:${toBase64(tag)}:${toBase64(ciphertext)}`;
}

export async function decryptGroupKey(
  encryptedGroupKeyB64: string,
  myPrivateKey: Uint8Array,
  senderPublicKeyB64: string,
  channelId: string,
  epoch: number,
): Promise<Uint8Array> {
  const senderPub = fromBase64(senderPublicKeyB64);
  const sharedSecret = x25519.getSharedSecret(myPrivateKey, senderPub);
  const derivedKey = deriveEncryptionKey(sharedSecret, channelId, epoch);
  const [ivB64, tagB64, ctB64] = encryptedGroupKeyB64.split(":");
  const iv = fromBase64(ivB64);
  const tag = fromBase64(tagB64);
  const ciphertext = fromBase64(ctB64);
  return aesGcmDecrypt(derivedKey, ciphertext, iv, tag);
}

// ─── 5. Message Signing (Ed25519) ───────────────────────────────────────────

export function signMessage(
  privateKeySign: Uint8Array,
  channelId: string,
  encryptedContent: string,
  sequenceNumber: number,
): string {
  const data = new TextEncoder().encode(`${channelId}:${encryptedContent}:${sequenceNumber}`);
  const sig = ed25519.sign(data, privateKeySign);
  return toBase64(sig);
}

export function verifySignature(
  publicKeySignB64: string,
  signatureB64: string,
  channelId: string,
  encryptedContent: string,
  sequenceNumber: number,
): boolean {
  try {
    const publicKey = fromBase64(publicKeySignB64);
    const signature = fromBase64(signatureB64);
    const data = new TextEncoder().encode(`${channelId}:${encryptedContent}:${sequenceNumber}`);
    return ed25519.verify(signature, data, publicKey);
  } catch {
    return false;
  }
}

// ─── 6. Key Pair Generation (for registration / key rotation) ────────────────

export function generateX25519KeyPair() {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

export function generateEd25519KeyPair() {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { toBase64, fromBase64, bytesToHex, hexToBytes };
