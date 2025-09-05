import { bytesToHex } from '@noble/curves/abstract/utils';
import { Buffer } from 'buffer/';
export function bytesToNumber(bytes) {
    return hexToNumber(bytesToHex(bytes));
}
export function hexToNumber(hex) {
    return BigInt(`0x${hex}`);
}
export function encodeBase64toUint8(base64String) {
    return Buffer.from(base64String, 'base64');
}
//# sourceMappingURL=utils.js.map