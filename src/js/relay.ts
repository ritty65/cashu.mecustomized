export function normalizeRelayUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function validateRelayUrl(url: string, existing: string[]): 'valid' | 'duplicate' | 'invalid' {
  const trimmed = normalizeRelayUrl(url);
  if (!/^wss?:\/\//i.test(trimmed)) {
    return 'invalid';
  }
  const lower = trimmed.toLowerCase();
  const existingLower = existing.map(r => normalizeRelayUrl(r).toLowerCase());
  if (existingLower.includes(lower)) {
    return 'duplicate';
  }
  return 'valid';
}
