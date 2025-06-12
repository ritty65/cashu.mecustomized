import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MissingSignerModal from '../../src/components/MissingSignerModal.vue'
import { useSignerStore } from '../../src/stores/signer'
import { useWalletStore } from '../../src/stores/wallet'

beforeEach(() => {
  localStorage.clear()
})

describe('MissingSignerModal', () => {
  it('allows redeem after selecting each signing option', async () => {
    const signer = useSignerStore()
    const wallet = useWalletStore()
    wallet.redeem = vi.fn(async () => true)

    const testOption = async (action: (wrapper: any) => Promise<void> | void, method: any) => {
      signer.reset()
      const wrapper = mount(MissingSignerModal)
      if (method === 'local') {
        ;(wrapper.vm as any).nsec = 'nsec123'
      }
      await action(wrapper)
      expect(signer.method).toBe(method)
      if (method === 'local') expect(signer.nsec).toBe('nsec123')
      await expect(wallet.redeem()).resolves.toBe(true)
    }

    await testOption((w) => (w.vm as any).chooseLocal(), 'local')
    await testOption((w) => (w.vm as any).chooseNip07(), 'nip07')
    await testOption((w) => (w.vm as any).chooseNip46(), 'nip46')
  })
})
