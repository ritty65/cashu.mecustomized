import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from '@noble/hashes/utils';
import { bytesToNumber } from '../util/utils.js';
import { hashToCurve, pointFromHex } from '../common/index.js';
import { getSignedOutput } from './NUT11.js';
export function createRandomBlindedMessage(privateKey) {
    return blindMessage(randomBytes(32), bytesToNumber(secp256k1.utils.randomPrivateKey()), privateKey);
}
export function blindMessage(secret, r, privateKey) {
    const Y = hashToCurve(secret);
    if (!r) {
        r = bytesToNumber(secp256k1.utils.randomPrivateKey());
    }
    const rG = secp256k1.ProjectivePoint.BASE.multiply(r);
    const B_ = Y.add(rG);
    if (privateKey !== undefined) {
        return getSignedOutput({ B_, r, secret }, privateKey);
    }
    return { B_, r, secret };
}
export function unblindSignature(C_, r, A) {
    const C = C_.subtract(A.multiply(r));
    return C;
}
export function constructProofFromPromise(promise, r, secret, key) {
    const A = key;
    const C = unblindSignature(promise.C_, r, A);
    const proof = {
        id: promise.id,
        amount: promise.amount,
        secret,
        C
    };
    return proof;
}
export const serializeProof = (proof) => {
    return {
        amount: proof.amount,
        C: proof.C.toHex(true),
        id: proof.id,
        secret: new TextDecoder().decode(proof.secret),
        witness: JSON.stringify(proof.witness)
    };
};
export const deserializeProof = (proof) => {
    return {
        amount: proof.amount,
        C: pointFromHex(proof.C),
        id: proof.id,
        secret: new TextEncoder().encode(proof.secret),
        witness: proof.witness ? JSON.parse(proof.witness) : undefined
    };
};
export const serializeBlindedMessage = (bm, amount) => {
    return {
        B_: bm.B_.toHex(true),
        amount: amount
    };
};
//# sourceMappingURL=index.js.map