import { secp256k1 } from '@noble/curves/secp256k1';
import { bytesToNumber } from '../util/utils.js';
import { createRandomPrivateKey, deriveKeysetId, hashToCurve } from '../common/index.js';
import { HDKey } from '@scure/bip32';
const DERIVATION_PATH = "m/0'/0'/0'";
export function createBlindSignature(B_, privateKey, amount, id) {
    const C_ = B_.multiply(bytesToNumber(privateKey));
    return { C_, amount, id };
}
export function getPubKeyFromPrivKey(privKey) {
    return secp256k1.getPublicKey(privKey, true);
}
export function createNewMintKeys(pow2height, seed) {
    let counter = 0n;
    const pubKeys = {};
    const privKeys = {};
    let masterKey;
    if (seed) {
        masterKey = HDKey.fromMasterSeed(seed);
    }
    while (counter < pow2height) {
        const index = (2n ** counter).toString();
        if (masterKey) {
            const k = masterKey.derive(`${DERIVATION_PATH}/${counter}`).privateKey;
            if (k) {
                privKeys[index] = k;
            }
            else {
                throw new Error(`Could not derive Private key from: ${DERIVATION_PATH}/${counter}`);
            }
        }
        else {
            privKeys[index] = createRandomPrivateKey();
        }
        pubKeys[index] = getPubKeyFromPrivKey(privKeys[index]);
        counter++;
    }
    const keysetId = deriveKeysetId(pubKeys);
    return { pubKeys, privKeys, keysetId };
}
export function verifyProof(proof, privKey) {
    const Y = hashToCurve(proof.secret);
    const aY = Y.multiply(bytesToNumber(privKey));
    return aY.equals(proof.C);
}
//# sourceMappingURL=index.js.map