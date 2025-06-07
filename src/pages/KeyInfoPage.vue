<template>
  <div :class="[$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark', 'q-pa-md flex flex-center']">
    <q-card class="q-pa-md" style="max-width:400px; width:100%">
      <q-card-section class="text-h6">Nostr Keys</q-card-section>
      <q-input :model-value="pubkey" label="Pubkey" readonly class="q-mt-md">
        <template v-slot:append>
          <q-icon name="content_copy" class="cursor-pointer" @click="copyText(pubkey)" />
        </template>
      </q-input>
      <q-input :model-value="privKeyVisible ? privKeyHex : maskedPrivKey" label="Private Key (hex)" readonly class="q-mt-md">
        <template v-slot:prepend>
          <q-icon :name="privKeyVisible ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="privKeyVisible = !privKeyVisible" />
        </template>
        <template v-slot:append>
          <q-icon name="content_copy" class="cursor-pointer" @click="copyText(privKeyHex)" />
        </template>
      </q-input>
      <q-input :model-value="privKeyVisible ? privKeyNsec : maskedNsec" label="nsec" readonly class="q-mt-md">
        <template v-slot:prepend>
          <q-icon :name="privKeyVisible ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="privKeyVisible = !privKeyVisible" />
        </template>
        <template v-slot:append>
          <q-icon name="content_copy" class="cursor-pointer" @click="copyText(privKeyNsec)" />
        </template>
      </q-input>
      <q-card-actions align="around" class="q-mt-md">
        <q-btn color="primary" to="/identity">Manage Identity</q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useNostrStore, SignerType } from 'stores/nostr';
import { nip19 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

export default defineComponent({
  name: 'KeyInfoPage',
  mixins: [windowMixin],
  setup() {
    const nostr = useNostrStore();
    const privKeyVisible = ref(false);

    const pubkey = computed(() => nostr.pubkey);

    const privKeyHex = computed(() => {
      if (nostr.signerType === SignerType.SEED) return nostr.seedSignerPrivateKey;
      if (nostr.signerType === SignerType.PRIVATEKEY) return nostr.privateKeySignerPrivateKey;
      return '';
    });

    const privKeyNsec = computed(() => {
      if (!privKeyHex.value) return '';
      return nip19.nsecEncode(hexToBytes(privKeyHex.value));
    });

    const maskedPrivKey = computed(() => '*'.repeat(privKeyHex.value.length));
    const maskedNsec = computed(() => '*'.repeat(privKeyNsec.value.length));

    return { pubkey, privKeyHex, privKeyNsec, privKeyVisible, maskedPrivKey, maskedNsec };
  }
});
</script>
