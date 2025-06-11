import { defineStore } from 'pinia'
import { cashuDb } from './dexie'
import { useWalletStore } from './wallet'
import { useReceiveTokensStore } from './receiveTokensStore'
import { useSettingsStore } from './settings'
import { useNostrStore } from './nostr'
import { notifyWarning } from '../js/notify'

export const useLockedTokensRedeemWorker = defineStore('lockedTokensRedeemWorker', {
  state: () => ({
    checkInterval: 5000,
    worker: null as NodeJS.Timeout | null,
  }),
  actions: {
    startLockedTokensRedeemWorker() {
      if (this.worker) return
      this.worker = setInterval(() => this.processTokens(), this.checkInterval)
      // run immediately
      this.processTokens()
    },
    stopLockedTokensRedeemWorker() {
      if (this.worker) {
        clearInterval(this.worker)
        this.worker = null
      }
    },
    async processTokens() {
      const settingsStore = useSettingsStore()
      if (!settingsStore.autoRedeemLockedTokens) return
      const now = Math.floor(Date.now() / 1000)
      const entries = await cashuDb.lockedTokens
        .where('unlockTs')
        .belowOrEqual(now)
        .toArray()
      if (!entries.length) return
      const wallet = useWalletStore()
      const receiveStore = useReceiveTokensStore()
      for (const entry of entries) {
        try {
          receiveStore.receiveData.tokensBase64 = entry.tokenString
          receiveStore.receiveData.bucketId = entry.tierId
          let privkey = receiveStore.receiveData.p2pkPrivateKey
          if (!privkey) {
            privkey = useNostrStore().activePrivkeyHex
          }
          if (!privkey) throw new Error('No private key available for P2PK unlock')
          receiveStore.receiveData.p2pkPrivateKey = privkey
          await wallet.redeem(entry.tierId)
          await cashuDb.lockedTokens.delete(entry.id)
        } catch (err: any) {
          if (
            err?.response?.data?.code === 10003 ||
            err?.response?.data?.code === 11001
          ) {
            notifyWarning('These tokens are already spent or invalid.')
            continue
          }
          console.error('Failed to auto-redeem locked token', err)
        }
      }
    },
  },
})
