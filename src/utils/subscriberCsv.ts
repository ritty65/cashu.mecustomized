import type { Subscriber } from 'src/types/subscriber';

function escapeCsv(s: any): string {
  const str = (s ?? '').toString();
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function downloadSubscribersCsv(subs: Subscriber[], filename: string) {
  const header = ['Name', 'npub', 'Tier', 'Since'];
  const rows = subs.map((s) => [
    s.name ?? '',
    s.npub ?? '',
    s.tierName ?? '',
    s.startDate ?? ''
  ]);

  const lines = [header, ...rows]
    .map((cols) => cols.map(escapeCsv).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || 'subscribers.csv';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  link.remove();
}

