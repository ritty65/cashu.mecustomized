import { boot } from "quasar/wrappers";
import NDK from "@nostr-dev-kit/ndk";
import { useSettingsStore } from "stores/settings";

export default boot(() => {
  // Prevent re-initialization during hot-reloads in development.
  if ((window as any).__NDK_READY) return;
  (window as any).__NDK_READY = true;

  const settings = useSettingsStore();
  const ndk = new NDK({ explicitRelayUrls: settings.defaultNostrRelays });
  ndk.connect();
  (window as any).ndk = ndk;
});
