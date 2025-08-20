import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useWelcomeStore } from '../../../src/stores/welcome'
import { useRestoreStore } from '../../../src/stores/restore'
import { useSignerStore } from '../../../src/stores/signer'

function buildRouter() {
  const routes = [
    { path: '/wallet', component: { template: 'wallet' } },
    { path: '/welcome', component: { template: 'welcome' } },
    { path: '/restore', component: { template: 'restore' } },
  ]
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.beforeEach((to, from, next) => {
    const welcome = useWelcomeStore()
    const restore = useRestoreStore()
    if (
      to.path !== '/welcome' &&
      (!welcome.hasKey || !welcome.welcomeCompleted) &&
      !restore.restoringState &&
      to.path !== '/restore'
    ) {
      next('/welcome')
      return
    }
    next()
  })
  return router
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('router guard', () => {
  it('redirects to welcome when key missing or welcome incomplete', async () => {
    const router = buildRouter()
    await router.push('/wallet')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/welcome')
  })

  it('allows navigation when key and welcome completed', async () => {
    const router = buildRouter()
    const signer = useSignerStore()
    signer.method = 'local'
    const welcome = useWelcomeStore()
    welcome.markWelcomeCompleted()
    await router.push('/wallet')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/wallet')
  })
})
