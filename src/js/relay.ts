export function sanitizeRelayUrl(
  url: string,
  existing: string[] = [],
): { url?: string; error?: "duplicate" | "invalid" } {
  if (!url) return { error: "invalid" };
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "ws:" && protocol !== "wss:") {
      return { error: "invalid" };
    }
    const normalized = parsed.toString();
    const lower = normalized.toLowerCase();
    if (existing.some((r) => r.toLowerCase() === lower)) {
      return { error: "duplicate" };
    }
    return { url: normalized };
  } catch {
    return { error: "invalid" };
  }
}
