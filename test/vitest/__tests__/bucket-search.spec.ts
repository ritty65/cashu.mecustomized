import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BucketManager from '../../../src/components/BucketManager.vue'

const moveProofsMock = vi.fn()

vi.mock('../../../src/stores/proofs', () => ({
  useProofsStore: () => ({ moveProofs: moveProofsMock })
}))

vi.mock('../../../src/stores/buckets', () => ({
  useBucketsStore: () => ({
    bucketList: [
      { id: 'b1', name: 'Alpha', color: '#111' },
      { id: 'b2', name: 'Beta', color: '#222' },
      { id: 'b3', name: 'Gamma', color: '#333' }
    ],
    bucketBalances: {},
    addBucket: vi.fn(),
    editBucket: vi.fn(),
    deleteBucket: vi.fn()
  }),
  DEFAULT_BUCKET_ID: 'b1'
}))

vi.mock('../../../src/stores/mints', () => ({
  useMintsStore: () => ({ activeUnit: 'sat' })
}))

vi.mock('../../../src/stores/ui', () => ({
  useUiStore: () => ({ formatCurrency: (a: number) => String(a) })
}))

vi.mock('../../../src/js/notify', () => ({
  notifyError: vi.fn()
}))

describe('BucketManager search and drag', () => {
  it('filters buckets by search term', async () => {
    const wrapper = mount(BucketManager)
    const input = wrapper.find('input')
    await input.setValue('beta')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Beta')
    expect(wrapper.text()).not.toContain('Alpha')
  })

  it('drag enter highlights and drop notifies', async () => {
    const wrapper = mount(BucketManager)
    ;(wrapper.vm as any).$q.notify = vi.fn()
    const card = wrapper.findComponent({ name: 'BucketCard' })
    const dropEvent = { preventDefault: vi.fn(), dataTransfer: { getData: vi.fn(() => '["s"]') } } as any
    await card.trigger('dragenter')
    expect(card.classes()).toContain('drag-hover')
    await card.trigger('drop', dropEvent)
    await wrapper.vm.$nextTick()
    expect(moveProofsMock).toHaveBeenCalled()
    expect((wrapper.vm as any).$q.notify).toHaveBeenCalled()
  })
})
