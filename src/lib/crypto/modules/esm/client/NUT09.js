import { HDKey } from '@scure/bip32';
import { getKeysetIdInt } from '../common/index.js';
const STANDARD_DERIVATION_PATH = `m/129372'/0'`;
var DerivationType;
(function (DerivationType) {
    DerivationType[DerivationType["SECRET"] = 0] = "SECRET";
    DerivationType[DerivationType["BLINDING_FACTOR"] = 1] = "BLINDING_FACTOR";
})(DerivationType || (DerivationType = {}));
export const deriveSecret = (seed, keysetId, counter) => {
    return derive(seed, keysetId, counter, DerivationType.SECRET);
};
export const deriveBlindingFactor = (seed, keysetId, counter) => {
    return derive(seed, keysetId, counter, DerivationType.BLINDING_FACTOR);
};
const derive = (seed, keysetId, counter, secretOrBlinding) => {
    const hdkey = HDKey.fromMasterSeed(seed);
    const keysetIdInt = getKeysetIdInt(keysetId);
    const derivationPath = `${STANDARD_DERIVATION_PATH}/${keysetIdInt}'/${counter}'/${secretOrBlinding}`;
    const derived = hdkey.derive(derivationPath);
    if (derived.privateKey === null) {
        throw new Error('Could not derive private key');
    }
    return derived.privateKey;
};
//# sourceMappingURL=NUT09.js.map