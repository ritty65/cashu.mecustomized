import { debug } from "src/js/logger";
import { defineStore } from "pinia";
import { useWalletStore } from "src/stores/wallet"; // invoiceData,
import { useUiStore } from "src/stores/ui"; // showInvoiceDetails
import { useSendTokensStore } from "src/stores/sendTokensStore"; // showSendTokens and sendData
import { useSettingsStore } from "./settings";
import { HistoryToken, useTokensStore } from "./tokens";
import { useNostrStore, SignerType } from "./nostr";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { Proof } from "@cashu/cashu-ts";
export const useWorkersStore = defineStore("workers", {
  state: () => {
    return {
      invoiceCheckListener: null as NodeJS.Timeout | null,
      tokensCheckSpendableListener: null as NodeJS.Timeout | null,
      invoiceWorkerRunning: false,
      tokenWorkerRunning: false,
      checkInterval: 5000,
    };
  },
  getters: {},

  actions: {
    clearAllWorkers: function () {
      if (this.invoiceCheckListener) {
        clearInterval(this.invoiceCheckListener);
        this.invoiceWorkerRunning = false;
      }
      if (this.tokensCheckSpendableListener) {
        clearInterval(this.tokensCheckSpendableListener);
        this.tokenWorkerRunning = false;
      }
    },
    invoiceCheckWorker: async function (quote: string) {
      const walletStore = useWalletStore();
      let nInterval = 0;
      this.clearAllWorkers();
      this.invoiceCheckListener = setInterval(async () => {
        try {
          this.invoiceWorkerRunning = true;
          nInterval += 1;

          // exit loop after 1m
          if (nInterval > 12) {
            debug("### stopping invoice check worker");
            this.clearAllWorkers();
          }
          debug("### invoiceCheckWorker setInterval", nInterval);

          // this will throw an error if the invoice is pending
          await walletStore.checkInvoice(quote, false);

          // only without error (invoice paid) will we reach here
          debug("### stopping invoice check worker");
          this.clearAllWorkers();
        } catch (error) {
          debug("invoiceCheckWorker: not paid yet");
        }
      }, this.checkInterval);
    },
    checkTokenSpendableWorker: async function (historyToken: HistoryToken) {
      const settingsStore = useSettingsStore();
      if (!settingsStore.checkSentTokens) {
        debug(
          "settingsStore.checkSentTokens is disabled, not kicking off checkTokenSpendableWorker"
        );
        return;
      }
      debug("### kicking off checkTokenSpendableWorker");
      this.tokenWorkerRunning = true;
      const walletStore = useWalletStore();
      const sendTokensStore = useSendTokensStore();
      let nInterval = 0;
      this.clearAllWorkers();
      this.tokensCheckSpendableListener = setInterval(async () => {
        try {
          nInterval += 1;
          // exit loop after 30s
          if (nInterval > 10) {
            debug("### stopping token check worker");
            this.clearAllWorkers();
          }
          debug("### checkTokenSpendableWorker setInterval", nInterval);
          let paid = await walletStore.checkTokenSpendable(historyToken, false);
          if (paid) {
            debug("### stopping token check worker");
            this.clearAllWorkers();
            sendTokensStore.showSendTokens = false;
          }
        } catch (error) {
          debug("checkTokenSpendableWorker: some error", error);
          this.clearAllWorkers();
        }
      }, this.checkInterval);
    },

    signWithRemote: async function (proofs: Proof[]): Promise<Proof[]> {
      const nostr = useNostrStore();
      await nostr.initSignerIfNotSet();
      if (
        nostr.signerType !== SignerType.NIP07 &&
        nostr.signerType !== SignerType.NIP46
      ) {
        return proofs;
      }
      const signFn =
        (nostr.signer as any)?.signSchnorr ||
        (window as any)?.nostr?.signSchnorr;
      if (!signFn) {
        throw new Error("Remote signer does not support signing");
      }
      const out: Proof[] = [];
      for (const p of proofs) {
        if (typeof p.secret === "string" && p.secret.startsWith("P2PK")) {
          const digest = sha256(new TextEncoder().encode(p.secret));
          const sig = await signFn(bytesToHex(digest));
          out.push({ ...p, witness: { signatures: [sig] } });
        } else {
          out.push(p);
        }
      }
      return out;
    },
  },
});
