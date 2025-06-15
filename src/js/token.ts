import { type Token, getDecodedToken } from "@cashu/cashu-ts";
import { useMintsStore, WalletProof } from "src/stores/mints";
import { useProofsStore } from "src/stores/proofs";
import buffer from "buffer";
const { Buffer } = buffer;
import { nip19 } from "nostr-tools";
import { ensureCompressed } from "src/utils/ecash";
import { randomBytes } from "@noble/hashes/utils";
export default { decode, getProofs, getMint, getUnit, getMemo };

/**
 * Decodes an encoded cashu token
 */
function decode(encoded_token: string) {
  if (!encoded_token || encoded_token === "") return;
  return getDecodedToken(encoded_token);
}

/**
 * Returns a list of proofs from a decoded token
 */
function getProofs(decoded_token: Token): WalletProof[] {
  if (!(decoded_token.proofs.length > 0)) {
    throw new Error("Token format wrong");
  }
  const proofs = decoded_token.proofs.flat();
  return useProofsStore().proofsToWalletProofs(
    proofs,
    undefined,
    "unassigned",
    ""
  );
}

function getMint(decoded_token: Token) {
  /*
      Returns first mint of a token (very rough way).
      */
  if (decoded_token.proofs.length > 0) {
    return decoded_token.mint;
  } else {
    return "";
  }
}

function getUnit(decoded_token: Token) {
  if (decoded_token.unit != null) {
    return decoded_token.unit;
  } else {
    // search for unit in mints[...].keysets[...].unit
    const mintStore = useMintsStore();
    const mint = getMint(decoded_token);
    const keysets = mintStore.mints
      .filter((m) => m.url === mint)
      .flatMap((m) => m.keysets);
    if (keysets.length > 0) {
      return keysets[0].unit;
    }
    return "";
  }
}

function getMemo(decoded_token: Token) {
  if (decoded_token.memo != null) {
    return decoded_token.memo;
  } else {
    return "";
  }
}

/**
 * Build a P2PK+timelock secret that mints understand (NUT-10/11)
 * @param creatorNpub  bech32 npub of the creator
 * @param locktime     unix seconds in the future
 * @param refundPubHex compressed secp256k1 pubkey of supporter
 */
export function buildP2PKSecret(
  creatorNpub: string,
  locktime: number,
  refundPubHex: string
): string {
  const decoded = nip19.decode(creatorNpub);
  if (decoded.type !== "npub") throw new Error("invalid npub");
  const creatorPubHex = ensureCompressed(
    Buffer.from(decoded.data as Uint8Array).toString("hex")
  );
  const secret = [
    "P2PK",
    {
      nonce: Buffer.from(randomBytes(16)).toString("hex"),
      data: creatorPubHex,
      tags: [
        ["locktime", String(locktime)],
        ["refund", refundPubHex],
      ],
    },
  ];
  return JSON.stringify(secret);
}
