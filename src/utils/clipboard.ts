import { copyToClipboard, Notify } from "quasar";

export function shortenNpub(npub: string): string {
  if (npub.length <= 12) return npub;
  return `${npub.slice(0, 8)}…${npub.slice(-4)}`;
}

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
