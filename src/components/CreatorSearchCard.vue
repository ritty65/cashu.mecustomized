<template>
  <q-card>
    <q-card-section class="row items-start no-wrap">
      <q-avatar size="40px" class="q-mr-md">
        <template v-if="profile?.picture">
          <img :src="profile.picture" />
        </template>
        <template v-else>
          <div class="placeholder text-white">{{ initials }}</div>
        </template>
      </q-avatar>
      <div class="col">
        <div class="row items-center no-wrap">
          <span class="text-subtitle1 ellipsis">{{ displayName }}</span>
          <q-badge v-if="nip05" color="primary" class="q-ml-xs" size="sm">NIP-05</q-badge>
        </div>
        <div v-if="profile?.about" class="text-caption ellipsis">{{ profile.about }}</div>
      </div>
    </q-card-section>
    <q-card-actions align="left" class="q-pt-none">
      <q-btn
        label="View Subscription Tiers"
        color="primary"
        outline
        size="sm"
        @click="emit('view')"
      />
      <q-btn label="Message" size="sm" @click="emit('message')" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useNostrStore } from 'src/stores/nostr';
import { nip19 } from 'nostr-tools';

const props = defineProps<{
  pubkey: string;
  profile?: any;
}>();

const emit = defineEmits(['view', 'message']);

const nostr = useNostrStore();

const profile = computed(() => props.profile || {});

const displayName = computed(() => {
  const p: any = profile.value;
  if (p?.display_name) return p.display_name;
  if (p?.name) return p.name;
  try {
    return nip19.npubEncode(nostr.resolvePubkey(props.pubkey));
  } catch {
    const pk = props.pubkey;
    return pk.slice(0, 8) + '...' + pk.slice(-4);
  }
});

const initials = computed(() => {
  const name = displayName.value.trim();
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const nip05 = computed(() => profile.value?.nip05 || '');
</script>

<style scoped>
.placeholder {
  background: var(--divider-color);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>
