import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeSlideMints from '../../../src/pages/welcome/WelcomeSlideMints.vue'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<any>('vue-i18n')
  return { ...actual, useI18n: () => ({ t: (s: string) => s }) }
})
vi.mock('quasar', () => ({
  useQuasar: () => ({ notify: vi.fn() }),
  QIcon: { template: '<i></i>' },
  QBtn: { props: ['disable', 'label'], template: '<button :disabled="disable">{{label}}<slot/></button>' },
  QForm: { template: '<form @submit.prevent="$emit(\'submit\')"><slot/></form>' },
  QInput: { props: ['modelValue', 'placeholder'], template: '<input />' },
  QDialog: { props: ['modelValue'], template: '<div><slot/></div>' },
  QCard: { template: '<div><slot/></div>' },
  QCardSection: { template: '<div><slot/></div>' },
  QList: { template: '<div><slot/></div>' },
  QItem: { props: ['clickable'], template: '<div @click="$emit(\'click\')"><slot/></div>' },
  QItemSection: { template: '<div><slot/></div>' },
  QCardActions: { template: '<div><slot/></div>' },
  ClosePopup: {},
}))

describe('WelcomeSlideMints dynamic catalog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads reachable mints and enables browse button', async () => {
    const directory = [{ url: 'https://mint1' }, { url: 'https://mint2' }]
    const fetchMock = vi.fn((url: string) => {
      if (url === 'https://mints.cashu.space/mints.json') {
        return Promise.resolve({ ok: true, json: async () => directory })
      }
      if (url === 'https://mint1/v1/info') {
        return Promise.resolve({ ok: true, json: async () => ({ name: 'Mint One' }) })
      }
      if (url === 'https://mint2/v1/info') {
        return Promise.resolve({ ok: false })
      }
      return Promise.resolve({ ok: false })
    })
    vi.stubGlobal('fetch', fetchMock as any)

    const wrapper = mount(WelcomeSlideMints)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.vm.recommendedMints).toEqual([
      { url: 'https://mint1', label: 'Mint One' },
    ])
    const browseBtn = wrapper.findAll('button')[0]
    expect((browseBtn.element as HTMLButtonElement).disabled).toBe(false)
  })
})
