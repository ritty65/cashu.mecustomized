import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const useMessengerUiStore = defineStore('messengerUi', {
  state: () => ({
    drawerOpen: useLocalStorage<boolean>('cashu.messenger.drawerOpen', true),
    drawerMini: false,
    drawerWidth: 320,
    drawerMiniWidth: 68,
    comfyMode: useLocalStorage<boolean>('cashu.messenger.comfyMode', false)
  }),
  getters: {
    effectiveDrawerWidth: (s) => (s.drawerOpen ? (s.drawerMini ? s.drawerMiniWidth : s.drawerWidth) : 0)
  },
  actions: {
    toggleDrawer() { this.drawerOpen = !this.drawerOpen },
    setMini(val: boolean) { this.drawerMini = val },
    setOpen(val: boolean) { this.drawerOpen = val }
  }
})
