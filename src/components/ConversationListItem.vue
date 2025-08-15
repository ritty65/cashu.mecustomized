<template>
  <q-item
    clickable
    class="conversation-item hover:bg-grey-2 dark:hover:bg-grey-8"
    :class="{ selected: props.selected }"
    :style="{
      borderLeft:
        '3px solid ' + (props.selected ? 'var(--q-primary)' : 'transparent'),
    }"
    @click="handleClick"
  >
    <q-item-section avatar>
      <q-avatar size="40px" class="relative-position">
        <template v-if="loaded && profile?.picture">
          <img :src="profile.picture" />
        </template>
        <template v-else-if="loaded">
          <div class="placeholder text-white text-body1">{{ initials }}</div>
        </template>
        <q-skeleton v-else type="circle" size="40px" />
        <q-badge
          class="status-dot"
          rounded
          :color="isOnline ? 'positive' : 'grey'"
        />
        <!-- Unread badge: overlay on avatar (top-right), always visible -->
        <q-badge
          v-if="unreadCount > 0"
          :label="unreadCount > 99 ? '99+' : String(unreadCount)"
          color="primary"
          text-color="white"
          class="unread-overlay"
          rounded
        />
      </q-avatar>
    </q-item-section>

    <q-item-section class="q-hoverable name-section">
      <template v-if="loaded">
        <q-item-label
          class="text-subtitle1 ellipsis"
          :class="{ 'text-weight-bold': unreadCount > 0 }"
          :title="displayName"
        >
          <q-icon
            v-if="isPinned"
            name="star"
            size="xs"
            color="warning"
            class="q-mr-xs"
          />
          {{ displayName }}
        </q-item-label>
        <q-item-label
          v-if="secondaryName"
          caption
          class="text-grey ellipsis"
          :title="secondaryName"
        >
          {{ secondaryName }}
        </q-item-label>
      </template>
      <template v-else>
        <q-skeleton type="text" width="60%" />
      </template>
    </q-item-section>

    <q-item-section class="q-hoverable snippet-section">
      <q-item-label
        caption
        class="snippet ellipsis"
        :class="{ 'text-weight-bold': unreadCount > 0 }"
        :title="displaySnippet"
      >
        <template v-if="loaded">
          <q-icon
            v-if="snippet.icon"
            :name="snippet.icon"
            size="14px"
            class="q-mr-xs"
          />
          {{ displaySnippet }}
        </template>
        <template v-else><q-skeleton type="text" width="80%" /></template>
      </q-item-label>
    </q-item-section>

    <q-item-section side top class="timestamp-section meta-actions text-right">
      <span class="timestamp text-caption">{{ timeAgo }}</span>
    </q-item-section>

    <q-item-section side class="items-center meta-actions">
      <q-btn
        flat
        dense
        round
        size="sm"
        :icon="isPinned ? 'star' : 'star_outline'"
        class="action-btn"
        @click.stop="togglePin"
      >
        <q-tooltip>{{ isPinned ? "Unpin" : "Pin" }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="more_vert"
        class="q-ml-sm action-btn"
        @click.stop="menu = true"
        aria-label="Conversation options"
      >
        <q-tooltip>Options</q-tooltip>
      </q-btn>
      <q-menu v-model="menu" anchor="bottom right" self="top right">
        <q-list style="min-width: 120px">
          <q-item clickable v-close-popup @click.stop="togglePin">
            <q-item-section avatar>
              <q-icon :name="isPinned ? 'star' : 'star_outline'" />
            </q-item-section>
            <q-item-section>
              {{ isPinned ? "Unpin" : "Pin" }}
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click.stop="showRaw = !showRaw">
            <q-item-section avatar>
              <q-icon name="vpn_key" />
            </q-item-section>
            <q-item-section>View Raw Key</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click.stop="deleteItem">
            <q-item-section avatar>
              <q-icon name="delete" />
            </q-item-section>
            <q-item-section>Delete</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { QBadge, QBtn } from "quasar";
import { useMessengerStore } from "src/stores/messenger";
import { useNostrStore } from "src/stores/nostr";
import { formatDistanceToNow } from "date-fns";
import { parseMessageSnippet } from "src/utils/message-snippet";

/**
 * Humanize drawer snippets so we never show raw JSON fragments.
 * Heuristics-only (no business logic change):
 *  - JSON with token/proofs/mint/cashu  -> "Sent a Cashu token"
 *  - JSON with cashu_subscription/recurrence -> "Subscription payment"
 *  - Any text containing 'subscription' -> "Subscription payment"
 *  - Very long http(s) link -> "Link"
 *  - Otherwise: the original text trimmed.
 */
function humanizeSnippet(raw: unknown): string {
  if (!raw) return "";
  const t = String(raw).trim();
  // Try JSON first (ignore errors)
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const obj = JSON.parse(t);
      if (obj && typeof obj === "object") {
        const o: any = obj;
        if (o.cashu || o.token || o.proofs || o.mint) return "Sent a Cashu token";
        if (o.cashu_subscription || o.subscription || o.recurrence)
          return "Subscription payment";
      }
    } catch {
      // fall through
    }
  }
  // Heuristics on plain text
  if (/"token"\s*:/.test(t) || /\bcashu\b/i.test(t)) return "Sent a Cashu token";
  if (/\bsubscription\b/i.test(t)) return "Subscription payment";
  if (/https?:\/\/\S{40,}/i.test(t)) return "Link";
  return t;
}

export default defineComponent({
  name: "ConversationListItem",
  components: { QBadge, QBtn },
  props: {
    pubkey: { type: String, required: true },
    lastMsg: { type: Object as () => any, default: () => ({}) },
    selected: { type: Boolean, default: false },
  },
  emits: ["click", "pin", "delete"],
  setup(props, { emit }) {
    const messenger = useMessengerStore();
    const nostr = useNostrStore();
    const isOnline = computed(() => messenger.connected);
    const isPinned = computed(() => messenger.pinned[props.pubkey]);
    const unreadCount = computed(
      () => messenger.unreadCounts[props.pubkey] || 0,
    );
    const profile = computed(() => {
      const entry: any = (nostr.profiles as any)[props.pubkey];
      return entry?.profile ?? entry ?? {};
    });
    const alias = computed(() => messenger.aliases[props.pubkey]);
    const profileName = computed(() => {
      const p: any = profile.value;
      return (
        p?.name ||
        p?.displayName ||
        p?.display_name ||
        props.pubkey.slice(0, 8) + "…"
      );
    });
    const displayName = computed(() => alias.value || profileName.value);
    const showRaw = ref(false);
    const menu = ref(false);
    const secondaryName = computed(() => {
      if (!alias.value) return showRaw.value ? props.pubkey : "";
      return showRaw.value ? props.pubkey : profileName.value;
    });

    const initials = computed(() => {
      const name = displayName.value;
      const words = name.split(/\s+/).filter(Boolean);
      const letters = words.slice(0, 2).map((w) => w[0]);
      return letters.join("").toUpperCase();
    });

    // consider profile fetched once the key exists, even if it has no fields
    const loaded = computed(() => profile.value !== undefined);

    const timeAgo = computed(() => {
      const ts = props.lastMsg?.created_at;
      if (!ts) return "";
      return formatDistanceToNow(ts * 1000, { addSuffix: true });
    });

    const snippet = computed(() =>
      parseMessageSnippet(props.lastMsg?.content || ""),
    );

    // Human-readable snippet text
    const displaySnippet = computed(() => humanizeSnippet(snippet.value?.text));

    const handleClick = () => emit("click", nostr.resolvePubkey(props.pubkey));
    const togglePin = () => emit("pin", nostr.resolvePubkey(props.pubkey));
    const deleteItem = () => emit("delete", nostr.resolvePubkey(props.pubkey));

    return {
      profile,
      displayName,
      initials,
      timeAgo,
      snippet,
      displaySnippet,
      handleClick,
      togglePin,
      deleteItem,
      loaded,
      unreadCount,
      showRaw,
      menu,
      secondaryName,
      isOnline,
      isPinned,
      props,
    };
  },
});
</script>

<style scoped>
.conversation-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 10px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  display: flex;
  gap: 8px;
  border-left: 3px solid transparent;
  overflow-x: hidden;
  min-width: 0;
  box-sizing: border-box;
  /* Let each row respond to its own inline size (tracks drawer width) */
  container-type: inline-size;
}

/* Unread badge overlay on avatar (top-right) */
.unread-overlay {
  position: absolute;
  top: -3px; right: -3px;
  z-index: 1;
  min-width: 18px; height: 18px; line-height: 18px;
  padding: 0 4px;
  font-size: 10px; font-weight: 700;
  box-shadow: 0 0 0 2px var(--q-color-dark), 0 2px 4px rgba(0,0,0,.15);
  pointer-events: none; /* don’t block avatar clicks */
}
.conversation-item.selected {
  background-color: color-mix(in srgb, var(--q-primary), transparent 92%);
}
.conversation-item:focus {
  border-left: 2px solid var(--q-primary);
}
.placeholder {
  background: var(--divider-color);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.timestamp {
  white-space: nowrap;
  font-size: 0.75rem;
}
.snippet {
  /* Slightly larger & clearer for readability */
  font-size: 0.8rem;
  line-height: 1.2;
  white-space: normal;
  /* Prefer natural word boundaries; still wrap very long tokens/npubs/URLs */
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  /* Improve perceived contrast without hard-coding theme colors */
  opacity: 0.9;
  /* Keep visual height predictable for virtualization: clamp to 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: calc(1.2em * 2);
}

/* Safety: links inside snippets (long URLs) should also break gracefully */
.snippet a {
  overflow-wrap: anywhere;
  word-break: break-all;
}

.name-section,
.snippet-section {
  flex: 1;
  min-width: 0;
}

.conversation-item .ellipsis {
  flex: 1;
  min-width: 0;
}

.drawer-collapsed .conversation-item .name-section,
.drawer-collapsed .conversation-item .snippet-section,
.drawer-collapsed .conversation-item .timestamp-section,
.drawer-collapsed .conversation-item .ellipsis {
  display: none;
}
.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--q-color-white);
}

/* So timestamp doesn't reserve unnecessary width; we'll hide it on hover anyway */
.timestamp-section {
  min-width: auto;
  text-align: right;
}

/* Let the controls cluster fit-content instead of forcing extra width */
:deep(.q-item__section[side]) {
  flex: 0 0 auto;
  min-width: fit-content;
}

/* Base: ensure icon buttons can actually shrink when container is narrow */
.action-btn { min-width: 0; padding: 0; }
.action-btn .q-icon { line-height: 1; }

/* Reveal-on-hover/focus behavior for desktop (pointer: fine).
   Keep everything visible on touch devices by default. */
@media (hover: hover) and (pointer: fine) {
  .meta-actions {
    opacity: 0;
    visibility: hidden;
    transition: opacity .15s ease;
  }
  .conversation-item:hover .meta-actions,
  .conversation-item:focus-within .meta-actions {
    opacity: 1;
    visibility: visible;
  }
}

/* Container-responsive sizing based on row width (i.e., drawer width) */
@container (max-width: 420px) {
  .action-btn {
    width: 28px;
    height: 28px;
  }
  .action-btn .q-icon {
    font-size: 18px;
  }
  /* tighten spacing between actions */
  .action-btn + .action-btn {
    margin-left: 2px !important;
  }
}

@container (max-width: 360px) {
  .action-btn {
    width: 24px;
    height: 24px;
  }
  .action-btn .q-icon {
    font-size: 16px;
  }
}

/* Container-responsive sizing based on row width (i.e., drawer width) */
@container (max-width: 420px) {
  .unread-overlay {
    min-width: 16px; height: 16px; line-height: 16px;
    font-size: 9px;
    top: -2px; right: -2px;
  }
}
@container (max-width: 360px) {
  .unread-overlay {
    min-width: 14px; height: 14px; line-height: 14px;
    font-size: 8px;
    top: -1px; right: -1px;
  }
}

/* Touch devices: keep tap targets comfy (badge still non-interactive) */
@media (hover: none) and (pointer: coarse) {
  .action-btn { width: 32px; height: 32px; }
  .unread-overlay {
    min-width: 20px; height: 20px; line-height: 20px;
    font-size: 11px;
  }
}

/* On very narrow drawers, drop the timestamp entirely to maximize text width. */
@media (max-width: 360px) {
  .timestamp-section {
    display: none;
  }
}
</style>
