import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils";

let cashuDb: any;
beforeEach(async () => {
  localStorage.clear();
  const dexie = await import("src/stores/dexie");
  cashuDb = dexie.cashuDb;
  await cashuDb.delete();
  await cashuDb.open();
  setActivePinia(createPinia());
});

describe("P2PK flow", () => {
  it("locks and redeems a token", async () => {
    const { useWalletStore } = await import("src/stores/wallet");
    const { useProofsStore } = await import("src/stores/proofs");
    const { useReceiveTokensStore } = await import(
      "src/stores/receiveTokensStore"
    );
    const { useMintsStore } = await import("src/stores/mints");
    const { useP2PKStore } = await import("src/stores/p2pk");

    const walletStore = useWalletStore();
    const proofsStore = useProofsStore();
    const receiveStore = useReceiveTokensStore();
    const mintsStore = useMintsStore();
    const p2pkStore = useP2PKStore();

    vi.spyOn(proofsStore, "removeProofs").mockResolvedValue();
    const addSpy = vi.spyOn(proofsStore, "addProofs").mockResolvedValue();

    mintsStore.mints = [
      {
        url: "m",
        keys: [],
        keysets: [{ id: "kid", unit: "sat", active: true }],
        info: { nut_supports: [10, 11] },
      } as any,
    ];
    mintsStore.activeMintUrl = "m";
    mintsStore.activeUnit = "sat";

    walletStore.spendableProofs = vi.fn(() => [
      { secret: "s", amount: 1, id: "kid", C: "c" } as any,
    ]);
    walletStore.coinSelect = vi.fn(() => [
      { secret: "s", amount: 1, id: "kid", C: "c" } as any,
    ]);
    walletStore.getKeyset = vi.fn(() => "kid");

    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    const skHex = bytesToHex(sk);
    const pubHex = p2pkStore.maybeConvertNpub(nip19.npubEncode(pk));

    const sendWallet = {
      mint: { mintUrl: "m" },
      unit: "sat",
      send: vi.fn(async (_a: number, _p: any, opts: any) => {
        const secret = JSON.stringify(["P2PK", { data: opts.pubkey }]);
        return { keep: [], send: [{ id: "kid", amount: 1, C: "c", secret }] };
      }),
    } as any;

    const { sendProofs } = await walletStore.sendToLock(
      [{ secret: "s", amount: 1, id: "kid", C: "c" } as any],
      sendWallet,
      1,
      pubHex,
      "b"
    );

    const tokenStr = proofsStore.serializeProofs(sendProofs);
    receiveStore.receiveData.tokensBase64 = tokenStr;
    receiveStore.receiveData.p2pkPrivateKey = skHex;
    await Promise.resolve();

    const receiveWallet = {
      receive: vi.fn(async () => [
        { id: "kid", amount: 1, C: "c2", secret: "unlocked" },
      ]),
    } as any;
    vi.spyOn(walletStore, "mintWallet").mockReturnValue(receiveWallet);

    await walletStore.redeem("b");

    expect(addSpy).toHaveBeenLastCalledWith(
      [{ id: "kid", amount: 1, C: "c2", secret: "unlocked" }],
      undefined,
      "b",
      ""
    );
  });
});
