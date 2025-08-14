export function shortNpub(npub: string, left = 10, right = 6): string {
  if (!npub) return "";
  if (npub.length <= left + right + 1) return npub;
  return `${npub.slice(0, left)}…${npub.slice(-right)}`;
}

export function previewText(s: string, max = 80): string {
  if (!s) return "";
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max - 1) + "…" : oneLine;
}

export function hostFromUrl(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
}
