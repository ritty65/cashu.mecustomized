/* ------------------------------------------------------------------
 *  src/stores/signer.ts              Fundstr – unified Schnorr signer
 * ------------------------------------------------------------------ */

import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils";
import { schnorr } from "@noble/curves/secp256k1";   // ← works in every version
import { nip19 } from "nostr-tools";

export type SignerMethod = "local" | "nip07" | "nip46" | null;

/* ------------------------------------------------------------------ */
/* Helper – bech32 nsec → 32‑byte hex                                  */
/* ------------------------------------------------------------------ */
function nsecToPrivHex(nsecOrHex: string): string {
  if (!nsecOrHex) return "";
  if (nsecOrHex.startsWith("nsec1")) {
    const { data, type } = nip19.decode(nsecOrHex);
    if (type !== "nsec") throw new Error("invalid nsec");
    return bytesToHex(data as Uint8Array);
  }
  return nsecOrHex.replace(/^0x/, "").toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Store                                                                */
/* ------------------------------------------------------------------ */
export const useSignerStore = defineStore("signer", {
  state: () => ({
    method: null as SignerMethod,                  // last method used
    privkeyHex: useLocalStorage<string>(
      "cashu.signer.privkey",
      ""
    ),                                             // local key if user saved one
  }),

  getters: {
    hasSigner(state): boolean {
      return (
        !!state.privkeyHex ||
        (typeof window !== "undefined" &&
          !!(window as any).nostr?.signSchnorr)
      );
    },
  },

  actions: {
    /* -------- key management -------- */
    /**
     * Store the given private key for local Schnorr signing. Accepts either a
     * bech32 encoded `nsec` string or a raw hex key. The decoded hex key is
     * persisted and the signer method switched to `"local"`.
     */
    setLocalPrivkey(raw: string) {
      this.privkeyHex = nsecToPrivHex(raw);
      this.method = "local";
    },

    reset() {
      this.privkeyHex = "";
      this.method = null;
    },

    /* -------- core signing -------- */
    async signData(msgHash: Uint8Array | string): Promise<string> {
      /* normalise hash to Uint8Array(32) */
      const bytes =
        typeof msgHash === "string"
          ? hexToBytes(msgHash.replace(/^0x/, ""))
          : msgHash;
      if (bytes.length !== 32)
        throw new Error("signData expects 32‑byte hash");

      /* 1️⃣ NIP‑07 browser extension */
      const ext = typeof window !== "undefined" && (window as any).nostr;
      if (ext?.signSchnorr) {
        try {
          const sig: string = await ext.signSchnorr(bytesToHex(bytes));
          if (sig && sig.length === 128) {
            this.method = "nip07";
            return sig.toLowerCase();
          }
        } catch (e) {
          console.warn("NIP‑07 sign failed:", e);
        }
      }

      /* 2️⃣ local private key */
      if (this.privkeyHex) {
        try {
          const sig = schnorr.sign(bytes, this.privkeyHex);
          this.method = "local";
          return bytesToHex(sig);
        } catch (e) {
          console.error("Local Schnorr sign failed:", e);
        }
      }

      /* 3️⃣ future NIP‑46 remote signer */
      throw new Error("No signer available");
    },
  },
});
