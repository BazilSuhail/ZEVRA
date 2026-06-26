// ─── RFC 5054 2048-bit MODP Group ────────────────────────────────────────────

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

// ─── BigInt helpers ───────────────────────────────────────────────────────────

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

function bigintToBuf(n: bigint): Uint8Array {
  const hex = n.toString(16).padStart(512, "0");
  const bytes = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bufToBigInt(buf: Uint8Array): bigint {
  let hex = "";
  for (const b of buf) hex += b.toString(16).padStart(2, "0");
  return BigInt("0x" + hex);
}

// SHA-256 via native WebCrypto
async function sha256(...args: Uint8Array[]): Promise<Uint8Array> {
  const total = args.reduce((n, b) => n + b.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const b of args) {
    merged.set(b, offset);
    offset += b.length;
  }
  const hash = await crypto.subtle.digest("SHA-256", merged);
  return new Uint8Array(hash);
}

function bytesToHex(buf: Uint8Array): string {
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// ─── SRP Client ──────────────────────────────────────────────────────────────
// Matches server's SRP-6a implementation exactly.

export interface SrpClientState {
  a: bigint;
  A: bigint;
}

/**
 * Step 1: Generate client ephemeral (A).
 */
export function generateClientEphemeral(): SrpClientState {
  const aBytes = crypto.getRandomValues(new Uint8Array(32));
  const a = bufToBigInt(aBytes);
  const A = modPow(G, a, N);
  return { a, A };
}

/**
 * Step 2: Compute client proof M1.
 */
export async function computeM1(
  password: string,
  srpSalt: string,
  B_hex: string,
  state: SrpClientState,
  username: string
): Promise<{ M1: string; K: Uint8Array }> {
  const { a, A } = state;
  const B = BigInt("0x" + B_hex);

  if (A % N === 0n) throw new Error("Invalid client ephemeral");

  // x = SHA256(srpSalt + password)
  const xHash = await sha256(new TextEncoder().encode(srpSalt + password));
  const x = bufToBigInt(xHash);

  // u = SHA256(A, B)
  const u = bufToBigInt(await sha256(bigintToBuf(A), bigintToBuf(B)));

  // S = (B - g^x)^(a + u*x) mod N
  const gx = modPow(G, x, N);
  let base = (B - gx) % N;
  if (base < 0n) base += N;
  const S = modPow(base, a + u * x, N);

  // K = SHA256(S)
  const K = await sha256(bigintToBuf(S));

  // M1 = SHA256(H(N) XOR H(g), H(salt), A, B, K)
  const hN = await sha256(bigintToBuf(N));
  const hg = await sha256(bigintToBuf(G));
  const hSalt = await sha256(hexToBytes(srpSalt));

  const xorHN_HG = new Uint8Array(hN.length);
  for (let i = 0; i < hN.length; i++) {
    xorHN_HG[i] = hN[i] ^ hg[i];
  }

  const M1 = await sha256(xorHN_HG, hSalt, bigintToBuf(A), bigintToBuf(B), K);

  return { M1: bytesToHex(M1), K };
}

/**
 * Step 3: Verify server proof M2.
 */
export async function verifyM2(
  A: bigint,
  M1: string,
  K: Uint8Array,
  M2_server: string
): Promise<boolean> {
  const expected = await sha256(bigintToBuf(A), hexToBytes(M1), K);
  return bytesToHex(expected) === M2_server;
}
