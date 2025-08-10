export type Frequency = "weekly" | "biweekly" | "monthly";

export type SubStatus = "active" | "pending" | "ended";

export interface Subscriber {
  /** Unique identifier or npub */
  id?: string;
  /** Display name */
  name?: string;
  /** Nostr public key */
  npub?: string;
  /** Optional NIP-05 identifier */
  nip05?: string;

  /** Simple tier name used by new subscribers UI */
  tier?: string;
  /** ISO timestamp or epoch seconds when joined */
  joinedAt?: number | string;

  /** Legacy fields kept for backwards compatibility */
  tierId?: string;
  tierName?: string;
  amountSat?: number;
  frequency?: Frequency;
  status?: SubStatus;
  startDate?: number;
  nextRenewal?: number;
  lifetimeSat?: number;
}
