import { bytesToNumber } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

async function hashToCurve(secretMessage) {
  let point;
  while (!point) {
    const hash = await sha256(secretMessage);
    const hashHex = bytesToHex(hash);
    const pointX = "02" + hashHex;
    try {
      point = secp256k1.ProjectivePoint.fromHex(pointX);
    } catch (error) {
      secretMessage = await sha256(secretMessage);
    }
  }
  return point;
}

async function step1Alice(secretMessage) {
  secretMessage = bytesToHex(secretMessage);
  secretMessage = new TextEncoder().encode(secretMessage);
  const Y = await hashToCurve(secretMessage);
  const r_bytes = secp256k1.utils.randomPrivateKey();
  const r = bytesToNumber(r_bytes);
  const P = secp256k1.ProjectivePoint.fromPrivateKey(r);
  const B_ = Y.add(P);
  return { B_: B_.toHex(true), r: bytesToHex(r_bytes) };
}

function step3Alice(C_, r, A) {
  const rInt = bytesToNumber(r);
  const C = C_.subtract(A.multiply(rInt));
  return C;
}

export { step1Alice, step3Alice, hashToCurve };
