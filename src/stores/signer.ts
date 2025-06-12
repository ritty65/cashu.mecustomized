import { defineStore } from 'pinia';
import { Dialog } from 'quasar';
import MissingSignerModal from 'src/components/MissingSignerModal.vue';
import { useWorkersStore } from './workers';
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
  },
});
