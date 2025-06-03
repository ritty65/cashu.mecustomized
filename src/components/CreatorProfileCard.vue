<template>
  <q-card class="q-pa-md q-mb-md qcard creator-card shadow-2 rounded-borders">
    <q-card-section class="row items-center no-wrap">
      <template v-if="loading">
        <q-skeleton
          type="QAvatar"
          class="creator-avatar"
          width="56px"
          height="56px"
        />
        <div class="q-ml-sm" style="width: 100%">
          <q-skeleton type="text" width="120px" class="q-mb-xs" />
          <q-skeleton type="text" width="80px" />
        </div>
      </template>
      <template v-else>
        <q-avatar size="56px" class="creator-avatar">
          <img
            v-if="profile?.picture"
            :src="profile.picture"
            alt="Creator image"
          />
          <div v-else class="placeholder-avatar text-white flex flex-center">
            {{ initials }}
          </div>
        </q-avatar>
        <div class="q-ml-sm">
          <div class="text-subtitle1 ellipsis">
            {{ profile?.display_name || profile?.name || shortPubkey }}
          </div>
          <div class="text-caption ellipsis">{{ shortPubkey }}</div>
        </div>
      </template>
    </q-card-section>
    <q-card-section v-if="loading">
      <q-skeleton type="text" width="90%" class="q-mb-xs" />
      <q-skeleton type="text" width="70%" />
    </q-card-section>
    <q-card-section v-else-if="profile?.about">
      <div class="truncated-text">{{ truncatedAbout }}</div>
    </q-card-section>
    <q-card-section v-if="!loading && profile?.lud16">
      <div class="row items-center">
        <q-icon name="bolt" size="xs" class="q-mr-xs" />
        <span>{{ profile.lud16 }}</span>
      </div>
    </q-card-section>
    <q-card-section class="text-caption" v-if="loading">
      <q-skeleton type="text" width="60%" />
    </q-card-section>
    <q-card-section class="text-caption" v-else-if="followers !== undefined">
      {{ $t("FindCreators.labels.followers") }}: {{ followers }} |
      {{ $t("FindCreators.labels.following") }}: {{ following }}
    </q-card-section>
    <q-card-section class="text-caption" v-if="!loading && joinedDateFormatted">
      {{ $t("FindCreators.labels.joined") }}: {{ joinedDateFormatted }}
    </q-card-section>
    <q-card-actions class="q-mt-sm">
      <q-btn color="primary" unelevated class="full-width" :to="profileLink">
        <q-icon name="chevron_right" size="16px" class="q-mr-xs" />
        {{ $t("FindCreators.actions.view_profile.label") }}
      </q-btn>
    </q-card-actions>
    <q-card-actions align="right" class="q-gutter-sm">
      <q-btn color="primary" flat @click="$emit('donate', creator)">
        {{ $t("FindCreators.actions.donate.label") }}
      </q-btn>
      <q-btn color="primary" flat @click="$emit('message', creator)">
        {{ $t("FindCreators.actions.message.label") }}
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { CreatorProfile } from "stores/creators";
import { date } from "quasar";
import { useNostrStore } from "stores/nostr";

export default defineComponent({
  name: "CreatorProfileCard",
  props: {
    creator: {
      type: Object as () => CreatorProfile,
      required: true,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["donate", "message"],
  setup(props) {
    const MAX_LENGTH = 160;
    const nostrStore = useNostrStore();

    const profile = ref(props.creator.profile || null);
    const followers = ref<number | undefined>(props.creator.followers);
    const following = ref<number | undefined>(props.creator.following);
    const joined = ref<number | null | undefined>(props.creator.joined);
    const loading = ref(!profile.value);

    const loadDetails = async () => {
      if (profile.value || loading.value === false) return;
      loading.value = true;
      profile.value = await nostrStore.getProfile(props.creator.pubkey);
      followers.value = await nostrStore.fetchFollowerCount(
        props.creator.pubkey,
      );
      following.value = await nostrStore.fetchFollowingCount(
        props.creator.pubkey,
      );
      joined.value = await nostrStore.fetchJoinDate(props.creator.pubkey);
      loading.value = false;
    };

    watch(
      () => props.visible,
      (v) => {
        if (v) loadDetails();
      },
      { immediate: true },
    );

    const shortPubkey = computed(() =>
      props.creator.pubkey.length > 16
        ? `${props.creator.pubkey.slice(0, 8)}…${props.creator.pubkey.slice(-8)}`
        : props.creator.pubkey,
    );
    const initials = computed(() => {
      const name = profile.value?.display_name || profile.value?.name || "";
      if (!name) return "?";
      return name
        .split(" ")
        .map((p) => p.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
    });
    const profileLink = computed(() => `/creators/${props.creator.pubkey}`);
    const truncatedAbout = computed(() => {
      const about = profile.value?.about || "";
      return about.length > MAX_LENGTH
        ? about.slice(0, MAX_LENGTH) + "…"
        : about;
    });
    const joinedDateFormatted = computed(() => {
      if (!joined.value) return "";
      return date.formatDate(new Date(joined.value * 1000), "YYYY-MM-DD");
    });
    return {
      truncatedAbout,
      joinedDateFormatted,
      shortPubkey,
      profileLink,
      initials,
      profile,
      followers,
      following,
      joined,
      loading,
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
  border-radius: 8px;
  overflow: hidden;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.placeholder-avatar {
  background: #9ca3af;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.truncated-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
