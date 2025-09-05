import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import { bytesToNumber, encodeBase64toUint8, hexToNumber } from '../util/utils.js';
import { Buffer } from 'buffer/';
const DOMAIN_SEPARATOR = hexToBytes('536563703235366b315f48617368546f43757276655f43617368755f');
export function hashToCurve(secret) {
    const msgToHash = sha256(Buffer.concat([DOMAIN_SEPARATOR, secret]));
    const counter = new Uint32Array(1);
    const maxIterations = 2 ** 16;
    for (let i = 0; i < maxIterations; i++) {
        const counterBytes = new Uint8Array(counter.buffer);
        const hash = sha256(Buffer.concat([msgToHash, counterBytes]));
        try {
            return pointFromHex(bytesToHex(Buffer.concat([new Uint8Array([0x02]), hash])));
        }
        catch (error) {
            counter[0]++;
        }
    }
    throw new Error('No valid point found');
}
export function hash_e(pubkeys) {
    const hexStrings = pubkeys.map((p) => p.toHex(false));
    const e_ = hexStrings.join('');
    const e = sha256(new TextEncoder().encode(e_));
    return e;
}
export function pointFromBytes(bytes) {
    return secp256k1.ProjectivePoint.fromHex(bytesToHex(bytes));
}
export function pointFromHex(hex) {
    return secp256k1.ProjectivePoint.fromHex(hex);
}
export const getKeysetIdInt = (keysetId) => {
    let keysetIdInt;
    if (/^[a-fA-F0-9]+$/.test(keysetId)) {
        keysetIdInt = hexToNumber(keysetId) % BigInt(2 ** 31 - 1);
    }
    else {
        //legacy keyset compatibility
        keysetIdInt = bytesToNumber(encodeBase64toUint8(keysetId)) % BigInt(2 ** 31 - 1);
    }
    return keysetIdInt;
};
export function createRandomPrivateKey() {
    return secp256k1.utils.randomPrivateKey();
}
export function serializeMintKeys(mintKeys) {
    const serializedMintKeys = {};
    Object.keys(mintKeys).forEach((p) => {
        serializedMintKeys[p] = bytesToHex(mintKeys[p]);
    });
    return serializedMintKeys;
}
export function deserializeMintKeys(serializedMintKeys) {
    const mintKeys = {};
    Object.keys(serializedMintKeys).forEach((p) => {
        mintKeys[p] = hexToBytes(serializedMintKeys[p]);
    });
    return mintKeys;
}
export function deriveKeysetId(keys) {
    const KEYSET_VERSION = '00';
    const mapBigInt = (k) => {
        return [BigInt(k[0]), k[1]];
    };
    const pubkeysConcat = Object.entries(serializeMintKeys(keys))
        .map(mapBigInt)
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([, pubKey]) => hexToBytes(pubKey))
        .reduce((prev, curr) => mergeUInt8Arrays(prev, curr), new Uint8Array());
    const hash = sha256(pubkeysConcat);
    const hashHex = Buffer.from(hash).toString('hex').slice(0, 14);
    return '00' + hashHex;
}
function mergeUInt8Arrays(a1, a2) {
    // sum of individual array lengths
    const mergedArray = new Uint8Array(a1.length + a2.length);
    mergedArray.set(a1);
    mergedArray.set(a2, a1.length);
    return mergedArray;
}
//# sourceMappingURL=index.js.map