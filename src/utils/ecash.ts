/* ------------------------------------------------------------------
 *  src/utils/ecash.ts                 Fundstr – low‑level ecash helpers
 * ------------------------------------------------------------------ */

import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha256";
import { Proof } from "@cashu/cashu-ts";

const Point = secp256k1.ProjectivePoint;

/* ------------------------------------------------------------------ */
/* 1.  Key‑format helper                                               */
/* ------------------------------------------------------------------ */

/**
 * Ensure a hex pubkey is 33‑byte SEC‑compressed (66 hex chars 02/03…).
 * Accepts raw 32‑byte hex, 65‑byte uncompressed hex (prefix 04), or
 * already‑compressed hex.
 */
export function ensureCompressed(hex: string): string {
  hex = hex.toLowerCase().replace(/^0x/, "");
  if (/^(02|03)[0-9a-f]{64}$/.test(hex)) return hex;                // ok
  if (/^[0-9a-f]{64}$/.test(hex)) {                                 // 32‑byte raw
    return bytesToHex(Point.fromHex("02" + hex).toRawBytes(true));
  }
  if (/^04[0-9a-f]{128}$/.test(hex)) {                              // uncompressed
    return bytesToHex(Point.fromHex(hex).toRawBytes(true));
  }
  throw new Error(`invalid pubkey format: ${hex}`);
}

/* ------------------------------------------------------------------ */
/* 2.  Tag helpers (locktime/refund must be **strings**)               */
/* ------------------------------------------------------------------ */

/** Cast every tag value → string, as required by NUT‑10 §Tags :contentReference[oaicite:0]{index=0} */
function stringifyTag(tag: [string, ...any[]]): string[] {
  return tag.map((v) => (typeof v === "string" ? v : String(v)));
}

/* ------------------------------------------------------------------ */
/* 3.  P2PK lock / unlock utilities                                    */
/* ------------------------------------------------------------------ */

/**
 * Mutate a set of proofs **in‑place** so that each proof.secret is
 * transformed into P2PK‑locked form:
 *   ["P2PK",{ nonce, data:<receiverPk>, tags:[["locktime","123"],["refund",...]] }]
 */
export function lockProofs(
  proofs: Proof[],
  receiverPubkey: string,
  locktime?: number,
  refundPubkey?: string
): Proof[] {
  receiverPubkey = ensureCompressed(receiverPubkey);

  return proofs.map((p) => {
    const nonce = crypto.randomUUID().replace(/-/g, "");
    const tags: string[][] = [];

    if (locktime) tags.push(stringifyTag(["locktime", locktime]));
    if (refundPubkey) {
      tags.push(stringifyTag(["refund", ensureCompressed(refundPubkey)]));
    }

    const secretObj = [
      "P2PK",
      {
        nonce,
        data: receiverPubkey,
        ...(tags.length ? { tags } : {}),
      },
    ];

    return {
      ...p,
      secret: JSON.stringify(secretObj),
    };
  });
}

/**
 * Iterate through **locked** proofs and attach Schnorr witness signatures
 * produced by `signFn(msgHash)`.
 *
 * The mint expects signatures on **SHA‑256(secretString)** (NUT‑11 §Signature scheme) :contentReference[oaicite:1]{index=1}
 */
export async function unlockProofs(
  proofs: Proof[],
  signFn: (msgHash: Uint8Array) => Promise<string>
): Promise<Proof[]> {
  return Promise.all(
    proofs.map(async (p) => {
      if (typeof p.secret !== "string" || !p.secret.startsWith('["P2PK"')) {
        return p; // not locked
      }

      const msgHash = sha256(new TextEncoder().encode(p.secret));
      const sigHex = await signFn(msgHash);

      /* Witness is a JSON string: { "signatures": [ "<hex>" ] } */
      const witness = JSON.stringify({ signatures: [sigHex] });

      return { ...p, witness };
    })
  );
}

/* ------------------------------------------------------------------ */
/* 4.  Convenience SHA‑256 helper (parallel with one in p2pk store)    */
/* ------------------------------------------------------------------ */

export function hashSecretString(secret: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(secret)));
}
