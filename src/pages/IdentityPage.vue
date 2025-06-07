<template>
  <div :class="[$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark', 'q-pa-md flex flex-center']">
    <q-card class="q-pa-md" style="max-width:400px; width:100%">
      <q-card-section class="text-h6">Identity Setup</q-card-section>
      <q-input v-model="key" type="text" label="nsec or hex private key" class="q-mt-md" />
      <div class="text-negative text-caption q-mt-sm" v-if="error">{{ error }}</div>
      <q-card-actions align="around" class="q-mt-md">
        <q-btn color="primary" @click="useKey">Use Key</q-btn>
        <q-btn outline color="primary" @click="generateKey">Generate New</q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNostrStore } from 'stores/nostr';
import { nip19, generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

export default defineComponent({
  name: 'IdentityPage',
  setup() {
    const nostr = useNostrStore();
    const router = useRouter();
    const key = ref('');
    const error = ref('');

    const useKey = async () => {
      if (!key.value) return;
      try {
        let hex;
        if (key.value.startsWith('nsec')) {
          hex = bytesToHex(nip19.decode(key.value).data as Uint8Array);
        } else {
          hex = key.value;
        }
        nostr.privateKeySignerPrivateKey = hex;
        await nostr.initPrivateKeySigner();
        router.push('/wallet');
      } catch (e) {
        console.error(e);
        error.value = 'Invalid key';
      }
    };

    const generateKey = async () => {
      const sk = generateSecretKey();
      key.value = nip19.nsecEncode(sk);
      nostr.privateKeySignerPrivateKey = bytesToHex(sk);
      await nostr.initPrivateKeySigner();
      router.push('/wallet');
    };

    return { key, useKey, generateKey, error };
  }
});
</script>

