import { beforeEach, describe, expect, it, vi } from "vitest";

var sendDm: any;
var walletSendP2PK: any;

vi.mock("../../../src/stores/nostr", () => {
  sendDm = vi.fn(async () => ({
    success: true,
    event: { id: "1", created_at: 0 },
  }));
  return {
    useNostrStore: () => ({
      sendNip04DirectMessage: sendDm,
      initSignerIfNotSet: vi.fn(),
      privateKeySignerPrivateKey: "priv",
      seedSignerPrivateKey: "",
      pubkey: "pub",
      signerType: "seed",
      connected: true,
      relays: [] as string[],
      get privKeyHex() {
        return this.privateKeySignerPrivateKey;
      },
    }),
  };
});

vi.mock("../../../src/stores/wallet", () => {
  walletSendP2PK = vi.fn(async () => "TOKEN");
  return {
    useWalletStore: () => ({ sendP2PK: walletSendP2PK }),
  };
});

vi.mock("../../../src/stores/mints", () => ({
  useMintsStore: () => ({
    activeUnitCurrencyMultiplyer: 1,
    activeMintUrl: "mint",
    activeUnit: "sat",
    activeProofs: [{ secret: "a", amount: 1, id: "id", bucketId: "b" }],
  }),
}));

vi.mock("../../../src/js/message-utils", () => ({
  sanitizeMessage: vi.fn((s: string) => s),
}));

import { useMessengerStore } from "../../../src/stores/messenger";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("messenger.sendToken", () => {
  it("sends token DM and logs message", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const store = useMessengerStore();
    await store.sendToken("receiver", 1, "b", "note");
    expect(walletSendP2PK).toHaveBeenCalledWith(1, "receiver", 3600);
    expect(sendDm).toHaveBeenCalledWith(
      "receiver",
      JSON.stringify({
        token: "TOKEN",
        amount: 1,
        bucketId: "b",
        memo: "note",
        unlockTime: 3600,
      }),
      "priv",
      "pub"
    );
    expect(store.conversations.receiver.length).toBe(1);
    vi.useRealTimers();
  });
});
