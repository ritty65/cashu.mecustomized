import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import WelcomeSlideFeatures from "../../../src/pages/welcome/WelcomeSlideFeatures.vue";
import WelcomeSlideNostr from "../../../src/pages/welcome/WelcomeSlideNostr.vue";
import WelcomeSlideMints from "../../../src/pages/welcome/WelcomeSlideMints.vue";
import { setActivePinia, createPinia } from 'pinia'
import { useWelcomeStore } from '../../../src/stores/welcome'
import { useMintsStore } from '../../../src/stores/mints'
import { useNostrStore } from '../../../src/stores/nostr'
import { vi } from 'vitest'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<any>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (s: string) => s })
  }
})

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

describe('WelcomeSlideNostr', () => {
  it('marks setup completion on generate', async () => {
    setActivePinia(createPinia())
    const nostr = useNostrStore()
    nostr.initWalletSeedPrivateKeySigner = async () => {}
    const wrapper = mount(WelcomeSlideNostr, {
      global: {
        mocks: { t: (msg: string) => msg },
        stubs: { 'q-icon': { template: '<i></i>' }, 'q-btn': { template: '<button @click="$emit(\'click\')"><slot/></button>' }, 'q-form': { template: '<form @submit.prevent="(e)=>$emit(\'submit\',e)"><slot/></form>' }, 'q-input': { props:['modelValue','label'], template: '<input />' } }
      }
    })
    const welcome = useWelcomeStore()
    const btns = wrapper.findAll('button')
    await btns[0].trigger('click')
    expect(welcome.nostrSetupCompleted).toBe(true)
  })
})

describe('WelcomeSlideMints', () => {
  it('sets mintConnected when adding mint', async () => {
    setActivePinia(createPinia())
    const mints = useMintsStore()
    mints.addMint = async (d: any) => ({ url: d.url }) as any
    const wrapper = mount(WelcomeSlideMints, {
      global: {
        mocks: { t: (msg: string) => msg },
        stubs: {
          'q-icon': { template: '<i></i>' },
          'q-input': { props:['modelValue','placeholder'], template: '<input />' },
          'q-form': { template: '<form @submit.prevent="(e)=>$emit(\'submit\',e)"><slot/></form>' },
          'q-btn': { template: '<button @click="$emit(\'click\')"><slot/></button>' }
        }
      }
    })
    await wrapper.find('form').trigger('submit')
    const welcome = useWelcomeStore()
    expect(welcome.mintConnected).toBe(true)
  })
})
