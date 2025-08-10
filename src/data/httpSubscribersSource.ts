import type { Subscriber } from 'src/types/subscriber';

const API_URL = import.meta.env.VITE_SUBSCRIBERS_ENDPOINT as string | undefined;

export class SubscribersHttpError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function fetchSubscribers(creatorNpub?: string): Promise<Subscriber[]> {
  if (!API_URL) {
    throw new SubscribersHttpError(
      'SUBSCRIBERS_ENDPOINT_MISSING',
      'VITE_SUBSCRIBERS_ENDPOINT is not configured'
    );
  }

  const url = new URL(API_URL);
  if (creatorNpub) url.searchParams.set('creator', creatorNpub);

  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) {
    throw new SubscribersHttpError(
      'HTTP_ERROR',
      `HTTP ${res.status} fetching subscribers`,
      res.status
    );
  }

  const json = await res.json();
  const list = Array.isArray(json) ? json : json?.subscribers ?? [];
  return (list ?? []) as Subscriber[];
}

