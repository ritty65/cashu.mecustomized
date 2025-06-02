<template>
  <q-card class="q-pa-md q-mb-md qcard creator-card">
    <q-card-section class="row items-center no-wrap">
      <q-avatar
        v-if="creator.profile?.picture"
        size="56px"
        class="creator-avatar"
      >
        <img :src="creator.profile.picture" alt="Creator image" />
      </q-avatar>
      <div class="q-ml-sm">
        <div class="text-subtitle1 name-line">
          {{
            creator.profile?.display_name ||
            creator.profile?.name ||
            shortPubkey
          }}
        </div>
        <div class="text-caption pubkey-line">{{ shortPubkey }}</div>
      </div>
    </q-card-section>
    <q-card-section v-if="creator.profile?.about">
      <div class="about-text">{{ truncatedAbout }}</div>
    </q-card-section>
    <q-card-section v-if="creator.profile?.lud16">
      <div class="row items-center">
        <q-icon name="bolt" size="xs" class="q-mr-xs" />
        <span>{{ creator.profile.lud16 }}</span>
      </div>
    </q-card-section>
    <q-card-section class="text-caption" v-if="creator.followers !== undefined">
      {{ $t('FindCreators.labels.followers') }}: {{ creator.followers }} |
      {{ $t('FindCreators.labels.following') }}: {{ creator.following }}
    </q-card-section>
    <q-card-section class="text-caption" v-if="joinedDateFormatted">
      {{ $t('FindCreators.labels.joined') }}: {{ joinedDateFormatted }}
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" flat @click="$emit('donate', creator)">
        {{ $t('FindCreators.actions.donate.label') }}
      </q-btn>
      <q-btn color="primary" flat @click="$emit('message', creator)">
        {{ $t('FindCreators.actions.message.label') }}
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { CreatorProfile } from "stores/creators";
import { date } from "quasar";

export default defineComponent({
  name: "CreatorProfileCard",
  props: {
    creator: {
      type: Object as () => CreatorProfile,
      required: true,
    },
  },
  emits: ["donate", "message"],
  setup(props) {
    const MAX_LENGTH = 160;
    const truncatedAbout = computed(() => {
      const about = props.creator.profile?.about || "";
      return about.length > MAX_LENGTH
        ? about.slice(0, MAX_LENGTH) + "…"
        : about;
    });
    const shortPubkey = computed(() => {
      const key = props.creator.pubkey;
      return key.slice(0, 8) + "…" + key.slice(-8);
    });
    const joinedDateFormatted = computed(() => {
      if (!props.creator.joined) return "";
      return date.formatDate(
        new Date(props.creator.joined * 1000),
        "YYYY-MM-DD"
      );
    });
    return {
      truncatedAbout,
      shortPubkey,
      joinedDateFormatted,
    };
  },
});
</script>

<style scoped>
.creator-avatar {
  border: 2px solid var(--q-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.creator-avatar img {
  object-fit: cover;
}
.creator-card.qcard {
  width: 100%;
  max-width: 280px;
}
.name-line,
.pubkey-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.about-text {
  max-height: 4.5em;
  overflow: hidden;
}
</style>
