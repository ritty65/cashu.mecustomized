import { Point } from "@noble/secp256k1";

/**
 * Converts a public key in any format (64-byte hex, 65-byte uncompressed hex,
 * or 33-byte compressed hex) into the standard 33-byte compressed hex format.
 *
 * @param hex The public key to compress.
 * @returns The compressed public key as a hex string starting with `02` or `03`.
 */
export function ensureCompressed(hex: string): string {
  hex = hex.toLowerCase().replace(/^0x/, "");

  // nostr-tools' `getPublicKey` returns a 64 byte x-only key.
  // Prepend `02` to convert it into a point on the curve.
  if (hex.length === 64) {
    hex = "02" + hex;
  }

  const point = Point.fromHex(hex);
  return point.toHex(true);
}
