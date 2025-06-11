import { type Token, getDecodedToken } from "@cashu/cashu-ts";
import { useMintsStore, WalletProof } from "src/stores/mints";
import { useProofsStore } from "src/stores/proofs";
import { ensureCompressed } from "src/stores/p2pk";
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
  const proofs = decoded_token.proofs.flat().map((p) => {
    if (typeof p.secret === "string" && p.secret.startsWith('["P2PK"')) {
      try {
        const sec = JSON.parse(p.secret);
        if (sec[1]?.data && typeof sec[1].data === "string" && sec[1].data.length === 64) {
          sec[1].data = ensureCompressed(sec[1].data);
          p.secret = JSON.stringify(sec);
        }
      } catch {}
    }
    return p;
  });
  return useProofsStore().proofsToWalletProofs(proofs, undefined, "unassigned", "");
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
