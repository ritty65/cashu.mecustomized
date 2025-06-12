import { defineStore } from 'pinia';
import { Dialog } from 'quasar';
import MissingSignerModal from 'src/components/MissingSignerModal.vue';
import { useWorkersStore } from './workers';
import { decodeToken } from '@cashu/token';
import { schnorr } from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { nip19 } from 'nostr-tools';
import type { Proof } from '@cashu/cashu-ts';

export type SignerMethod = 'local' | 'nip07' | 'nip46' | null;

export const useSignerStore = defineStore('signer', {
  state: () => ({
    method: null as SignerMethod,
    nsec: '',
    requesting: false,
  }),
  actions: {
    reset() {
      this.method = null;
      this.nsec = '';
      this.requesting = false;
    },
    async requestWitness(proofs: Proof[]): Promise<Proof[]> {
      this.requesting = true;
      let signed = await useWorkersStore().signWithRemote(proofs);
      if (!signed.some((p: any) => p.witness?.signatures?.length > 0)) {
        const dlg = Dialog.create({ component: MissingSignerModal });
        const ok = await new Promise<boolean>((resolve) => {
          dlg.onOk(() => resolve(true));
          dlg.onCancel(() => resolve(false));
          dlg.onDismiss(() => resolve(false));
        });
        if (!ok) {
          this.requesting = false;
          throw new Error('No private key or remote signer available for P2PK unlock');
        }
        signed = await useWorkersStore().signWithRemote(proofs);
      }
      this.requesting = false;
      return signed;
    },

    async createP2PKWitness(tokenString: string): Promise<{ signatures: string[] } | null> {
      const decoded = decodeToken(tokenString);
      if (!decoded || !decoded.token?.length) return null;
      const proofs = decoded.token[0].proofs;
      if (!proofs?.length) return null;

      const secrets = proofs
        .map((p: any) => p.secret)
        .filter((s: any) => typeof s === 'string');
      if (!secrets.length) return null;

      let method = this.method;
      let signSchnorr: ((h: string) => Promise<string>) | undefined;
      const loadSigner = () => {
        if (method === 'local' && this.nsec) {
          const key = nip19.decode(this.nsec).data as Uint8Array;
          signSchnorr = async (h: string) => schnorr.sign(h, key);
        } else if (method === 'nip07') {
          signSchnorr = (window as any)?.nostr?.signSchnorr;
        } else if (method === 'nip46') {
          signSchnorr = (window as any)?.nostr?.signSchnorr;
        }
      };
      loadSigner();
      if (!signSchnorr) {
        const dlg = Dialog.create({ component: MissingSignerModal });
        const ok = await new Promise<boolean>((resolve) => {
          dlg.onOk(() => resolve(true));
          dlg.onCancel(() => resolve(false));
          dlg.onDismiss(() => resolve(false));
        });
        if (!ok) return null;
        method = this.method;
        loadSigner();
        if (!signSchnorr) return null;
      }

      const signatures: string[] = [];
      for (const s of secrets) {
        const h = sha256(new TextEncoder().encode(s));
        const sig = await signSchnorr(bytesToHex(h));
        signatures.push(sig);
      }
      return { signatures };
    },
  },
});
