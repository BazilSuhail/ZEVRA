/* eslint-disable @typescript-eslint/no-require-imports */

// @noble/curves subpath exports need .js extension for Turbopack
// but TypeScript can't resolve them. This file bridges the gap.

const ed25519Module = require("@noble/curves/ed25519.js");

export const x25519 = ed25519Module.x25519;
export const ed25519 = ed25519Module.ed25519;
