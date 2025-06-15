import { boot } from "quasar/wrappers";
import NDK from "@nostr-dev-kit/ndk";
import { useSettingsStore } from "stores/settings";

export default boot(() => {
  // Prevent re-initialization during hot-reloads in development.
  if ((window as any).__NDK_READY) return;
  (window as any).__NDK_READY = true;

  const RELAYS = [
    "wss://relay.damus.io",
    "wss://relay.primal.net",
    "wss://nos.lol",
    "wss://nostr.wine",
    "wss://purplepag.es",
    "wss://relay.nostr.band",
  ];

  const settings = useSettingsStore();
  const ndk = new NDK({
    explicitRelayUrls:
      settings.defaultNostrRelays.length > 0
        ? settings.defaultNostrRelays
        : RELAYS,
  });
  ndk.connect();
  (window as any).ndk = ndk;
});
