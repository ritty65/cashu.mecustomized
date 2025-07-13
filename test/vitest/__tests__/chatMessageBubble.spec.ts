import { beforeAll, describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

let ChatMessageBubble: any;
let SubscriptionPaymentBubble: any;
let AttachmentBubble: any;
let receiveToken: any;
const VALID_TOKEN =
  "cashuAeyJ0b2tlbiI6W3sicHJvb2ZzIjpbeyJpZCI6IkkyeU4raVJZZmt6VCIsImFtb3VudCI6MSw" +
  "iQyI6IjAyZTRkYmJmMGZmNDI4YTU4ZDZjNjZjMTljNjI0YWRlY2MxNzg0YzdlNTU5ODZhNGVmNDQ4NDM" +
  "5MzZhM2M4ZjM1OSIsInNlY3JldCI6ImZHWVpzSlVjME1mU1orVlhGandEZXNsNkJScW5wNmRSblZpUGQ" +
  "2L00yQ0k9In1dLCJtaW50IjoiaHR0cHM6Ly84MzMzLnNwYWNlOjMzMzgifV19";

vi.mock("../../../src/stores/receiveTokensStore", () => {
  receiveToken = vi.fn();
  return {
    useReceiveTokensStore: () => ({
      receiveToken,
      receiveData: { tokensBase64: "", bucketId: "default" },
    }),
  };
});

vi.mock("../../../src/stores/dexie", () => ({
  cashuDb: {
    proofs: { toArray: () => [] },
    lockedTokens: { where: () => ({ equals: () => ({ toArray: () => [] }) }) },
  },
}));

vi.mock("../../../src/stores/proofs", () => ({
  useProofsStore: () => ({ proofsToWalletProofs: (p: any) => p }),
}));

vi.mock("../../../src/stores/mints", () => ({
  useMintsStore: () => ({ mints: [], activeMintUrl: "", activeUnit: "" }),
}));

vi.mock("../../../src/stores/ui", () => ({
  useUiStore: () => ({ formatCurrency: (a: number, u?: string) => `${a} ${u ?? ''}` }),
}));

vi.mock("../../../src/composables/useClipboard", () => ({
  useClipboard: () => ({ copy: vi.fn() }),
}));

beforeAll(async () => {
  ChatMessageBubble = (await import("../../../src/components/ChatMessageBubble.vue")).default;
  SubscriptionPaymentBubble = (await import("../../../src/components/SubscriptionPaymentBubble.vue")).default;
  AttachmentBubble = (await import("../../../src/components/AttachmentBubble.vue")).default;
});

const baseMessage = {
  id: "1",
  pubkey: "p",
  created_at: 1,
  outgoing: false,
};

describe("ChatMessageBubble", () => {
  it("renders SubscriptionPaymentBubble for subscription messages", () => {
    const payload = { type: "cashu_subscription_payment", token: VALID_TOKEN, month_index: 1, total_months: 1 };
    const wrapper = mount(ChatMessageBubble, {
      props: { message: { ...baseMessage, content: JSON.stringify(payload) } },
    });
    expect(wrapper.findComponent(SubscriptionPaymentBubble).exists()).toBe(true);
  });

  it("redeem button calls receiveToken", async () => {
    const payload = { type: "cashu_subscription_payment", token: VALID_TOKEN, month_index: 1, total_months: 1 };
    const wrapper = mount(ChatMessageBubble, {
      props: { message: { ...baseMessage, content: JSON.stringify(payload) } },
    });
    await wrapper.find("button").trigger("click");
    expect(receiveToken).toHaveBeenCalled();
  });

  it("data url messages render attachment image", () => {
    const wrapper = mount(ChatMessageBubble, {
      props: { message: { ...baseMessage, content: "data:image/png;base64,AAA" } },
    });
    const att = wrapper.findComponent(AttachmentBubble);
    expect(att.exists()).toBe(true);
    expect(att.find("img").exists()).toBe(true);
  });
});
