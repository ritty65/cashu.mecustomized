import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import WelcomeSlideFeatures from "../../../src/pages/welcome/WelcomeSlideFeatures.vue";

describe("WelcomeSlideFeatures", () => {
  it("renders feature links", () => {
    const wrapper = mount(WelcomeSlideFeatures, {
      global: {
        mocks: { $t: (msg: string) => msg },
        stubs: {
          RouterLink: { props: ["to"], template: '<a :href="to"><slot/></a>' },
          "q-icon": { template: "<i></i>" },
        },
      },
    });

    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
    expect(hrefs).toEqual(["/creator-hub", "/subscriptions", "/buckets"]);
  });
});
