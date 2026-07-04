// RFC 5054 2048-bit MODP Group — must match server exactly
const N_HEX =
  "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1" +
  "29024E088A67CC74020BBEA63B139B22514A08798E3404DD" +
  "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245" +
  "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
  "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D" +
  "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F" +
  "83655D23DCA3AD961C62F356208552BB9ED529077096966D" +
  "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B" +
  "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9" +
  "DE2BCBF6955817183995497CEA956AE515D2261898FA0510" +
  "15728E5A8AACAA68FFFFFFFFFFFFFFFF";

const G = 2n;
const N = BigInt("0x" + N_HEX);

// ─── Helpers ────────────────────────────────────────────────────────────

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  base = ((base % modulus) + modulus) % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = (result * base) % modulus;
    exponent >>= 1n;
    base = (base * base) % modulus;
  }
  return result;
}

function bigintToBytes(n: bigint): Uint8Array {
  const hex = n.toString(16).padStart(512, "0");
  const bytes = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBigint(bytes: Uint8Array): bigint {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt("0x" + hex);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function sha256(...args: Uint8Array[]): Promise<Uint8Array> {
  let total = 0;
  for (const a of args) total += a.length;
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const a of args) {
    combined.set(a, offset);
    offset += a.length;
  }
  const hash = await crypto.subtle.digest("SHA-256", combined);
  return new Uint8Array(hash);
}

// ─── Client SRP ─────────────────────────────────────────────────────────

function randomBigInt(bytes = 32): bigint {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bytesToBigint(arr);
}

/**
 * SRP-6a client: compute A, M1, and shared session key.
 *
 * Server sends B (hex) + srpSalt (hex) from loginStart.
 * Client computes x from sha256(srpSalt + password).
 *
 * Returns { A, M1, K } where A and M1 are hex strings for the server.
 */
export async function srpClient(params: {
  username: string;
  password: string;
  srpSalt: string;
  B: string;
}): Promise<{ A: string; M1: string; K: string }> {
  const { username, password, srpSalt, B } = params;
  const Bn = BigInt("0x" + B);

  // Client secret
  const a = randomBigInt();
  const A = modPow(G, a, N);

  // u = H(A, B)
  const uBytes = await sha256(bigintToBytes(A), bigintToBytes(Bn));
  const u = bytesToBigint(uBytes);

  // x = H(srpSalt + password) — same as server: sha256(hexSalt + password)
  const saltBytes = new TextEncoder().encode(srpSalt);
  const pwBytes = new TextEncoder().encode(password);
  const xHash = await sha256(saltBytes, pwBytes);
  const x = bytesToBigint(xHash);

  // k = H(N, G)
  const kBytes = await sha256(bigintToBytes(N), bigintToBytes(G));
  const k = bytesToBigint(kBytes);

  // S = (B - k * g^x)^(a + u * x) mod N
  const gx = modPow(G, x, N);
  const inner = ((Bn - k * gx) % N + N) % N;
  const S = modPow(inner, a + u * x, N);

  // K = H(S)
  const KBytes = await sha256(bigintToBytes(S));
  const K = bytesToHex(KBytes);

  // M1 = H(H(N) ^ H(g), H(salt), A, B, K)
  const hN = await sha256(bigintToBytes(N));
  const hg = await sha256(bigintToBytes(G));
  const xorHN_HG = new Uint8Array(32);
  for (let i = 0; i < 32; i++) xorHN_HG[i] = hN[i] ^ hg[i];

  // Server does: sha256(Buffer.from(srpSalt, 'hex')) — decode hex to raw bytes first
  const saltRaw = hexToBytes(srpSalt);
  const hSalt = await sha256(saltRaw);
  const hUser = await sha256(new TextEncoder().encode(username));

  const M1Bytes = await sha256(xorHN_HG, hSalt, bigintToBytes(A), bigintToBytes(Bn), KBytes);
  const M1 = bytesToHex(M1Bytes);

  return { A: A.toString(16), M1, K };
}

/**
 * Verify server proof M2 = H(A, M1, K).
 */
export async function verifyM2(
  A: string,
  M1: string,
  K: string
): Promise<boolean> {
  const ABytes = hexToBytes(A);
  const M1Bytes = hexToBytes(M1);
  const KBytes = hexToBytes(K);
  const expected = await sha256(ABytes, M1Bytes, KBytes);
  return bytesToHex(expected) === M1;
}
