/* ------------------------------------------------------------------
 *  src/stores/p2pk.ts           Fundstr – P2PK key manager (compat v2)
 * ------------------------------------------------------------------ */

import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha256";
import { ensureCompressed } from "src/utils/ecash";
import token from "src/js/token";                          // <- needed by wrappers

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface P2PKKey {
  publicKey: string;   // 33‑byte hex (02/03…)
  privateKey: string;  // 32‑byte hex
  used: boolean;
  usedCount: number;
}

export interface P2PKInfo {
  pubkey: string;
  locktime?: number;
  refundKeys: string[];
}

/* ------------------------------------------------------------------ */
/* Store                                                                */
/* ------------------------------------------------------------------ */

export const useP2PKStore = defineStore("p2pk", {
  state: () => ({
    p2pkKeys: useLocalStorage<P2PKKey[]>("cashu.P2PKKeys", []),
    showP2PkButtonInDrawer: useLocalStorage<boolean>(
      "cashu.p2pk.showP2PkButtonInDrawer",
      false
    ),
    showP2PKDialog: false,
    showP2PKData: {} as P2PKKey,
  }),

  getters: {
    haveAny: (state) => (keys: string[]): boolean =>
      keys.some(
        (k) => state.p2pkKeys.findIndex((kp) => kp.publicKey === k) !== -1
      ),
  },

  actions: {
    /* -------------------------------------------------- */
    /*   IMPORT / GENERATE KEYS                           */
    /* -------------------------------------------------- */

    haveThisKey(key: string) {
      return this.p2pkKeys.some((m) => m.publicKey === key);
    },

    maybeConvertNpub(key: string): string {
      if (!key) return "";
      if (key.startsWith("npub1")) {
        const { type, data } = nip19.decode(key);
        if (type === "npub" && data.length === 64) key = "02" + data;
      }
      return ensureCompressed(key);
    },

    isValidPubkey(key: string) {
      try {
        return !!this.maybeConvertNpub(key);
      } catch {
        return false;
      }
    },

    addPrivateKey(keyOrNsec: string) {
      const privHex =
        keyOrNsec.startsWith("nsec1")
          ? bytesToHex(nip19.decode(keyOrNsec).data as Uint8Array)
          : keyOrNsec.replace(/^0x/, "").toLowerCase();

      const pubHex = ensureCompressed("02" + getPublicKey(privHex));
      if (this.haveThisKey(pubHex)) return;

      this.p2pkKeys.push({
        publicKey: pubHex,
        privateKey: privHex,
        used: false,
        usedCount: 0,
      });
    },

    generateKeypair() {
      const sk = generateSecretKey();
      const pk = ensureCompressed("02" + getPublicKey(sk));
      this.p2pkKeys.push({
        publicKey: pk,
        privateKey: bytesToHex(sk),
        used: false,
        usedCount: 0,
      });
    },

    setPrivateKeyUsed(privHex: string) {
      const k = this.p2pkKeys.find((x) => x.privateKey === privHex);
      if (k) {
        k.used = true;
        k.usedCount += 1;
      }
    },

    /* -------------------------------------------------- */
    /*   CORE HELPERS                                     */
    /* -------------------------------------------------- */

    hashSecret(secret: string): string {
      return bytesToHex(sha256(new TextEncoder().encode(secret)));
    },

    /** modern parser – single source of truth */
    getSecretP2PKInfo(secret: string): P2PKInfo {
      try {
        const obj = JSON.parse(secret);
        if (!Array.isArray(obj) || obj[0] !== "P2PK") {
          return { pubkey: "", refundKeys: [] };
        }

        const { data, tags = [] } = obj[1] || {};
        const mainKey = ensureCompressed(data);

        const findTag = (n: string) =>
          (tags as string[][]).find((t) => t[0] === n);

        const locktime = findTag("locktime")
          ? parseInt(findTag("locktime")![1], 10)
          : undefined;

        const refundKeys: string[] = findTag("refund")
          ? findTag("refund")!.slice(1).map((k) => this.maybeConvertNpub(k))
          : [];

        const now = Math.floor(Date.now() / 1000);

        /* decide active key */
        if (locktime && now > locktime && refundKeys.length) {
          for (const r of refundKeys) {
            if (this.haveThisKey(r)) return { pubkey: r, locktime, refundKeys };
          }
          return { pubkey: refundKeys[0], locktime, refundKeys };
        }
        return { pubkey: mainKey, locktime, refundKeys };
      } catch {
        return { pubkey: "", refundKeys: [] };
      }
    },

    /* -------------------------------------------------- */
    /*   ***  Back‑compat layer for old code  ***          */
    /* -------------------------------------------------- */

    /** old name kept for ReceiveTokenDialog.vue */
    getSecretP2PKPubkey(secret: string): { pubkey: string; locktime?: number } {
      const { pubkey, locktime } = this.getSecretP2PKInfo(secret);
      return { pubkey, locktime };
    },

    isLocked(proofs: { secret: string }[]): boolean {
      return proofs.some((p) => this.getSecretP2PKInfo(p.secret).pubkey);
    },

    isLockedToUs(proofs: { secret: string }[]): boolean {
      return proofs.every((p) => {
        const { pubkey } = this.getSecretP2PKInfo(p.secret);
        return pubkey ? this.haveThisKey(pubkey) : true;
      });
    },

    /** helpers that inspect a *whole token string* (used by dialogs) */
    getTokenPubkey(encodedToken: string): string | undefined {
      const dec = token.decode(encodedToken);
      if (!dec) return;
      for (const p of token.getProofs(dec)) {
        const { pubkey } = this.getSecretP2PKInfo(p.secret);
        if (pubkey) return pubkey;
      }
    },

    getTokenRefundPubkey(encodedToken: string): string | undefined {
      const dec = token.decode(encodedToken);
      if (!dec) return;
      for (const p of token.getProofs(dec)) {
        const { refundKeys } = this.getSecretP2PKInfo(p.secret);
        if (refundKeys.length) return refundKeys[0];
      }
    },

    getPrivateKeyForP2PKEncodedToken(encodedToken: string): string {
      const dec = token.decode(encodedToken);
      if (!dec) return "";
      const proofs = token.getProofs(dec);
      if (!this.isLocked(proofs) || !this.isLockedToUs(proofs)) return "";

      for (const p of proofs) {
        const { pubkey } = this.getSecretP2PKInfo(p.secret);
        if (pubkey && this.haveThisKey(pubkey)) {
          return this.p2pkKeys.find((k) => k.publicKey === pubkey)!.privateKey;
        }
      }
      return "";
    },

    getTokenLocktime(encodedToken: string): number | undefined {
      const dec = token.decode(encodedToken);
      if (!dec) return;
      const times = token
        .getProofs(dec)
        .map((p) => this.getSecretP2PKInfo(p.secret).locktime)
        .filter((t) => t !== undefined) as number[];
      return times.length ? Math.max(...times) : undefined;
    },
  },
});
