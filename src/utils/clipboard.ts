import { copyToClipboard, Notify } from "quasar";
export async function copyNpub(npub: string) {
  try {
    await copyToClipboard(npub);
    Notify.create({
      message: "npub copied",
      color: "positive",
      position: "top",
      timeout: 1500,
    });
  } catch {
    Notify.create({ message: "Copy failed", color: "negative" });
  }
}

export function shortenNpub(npub: string) {
  if (npub.length <= 12) return npub;
  return `${npub.slice(0, 6)}…${npub.slice(-4)}`;
}
