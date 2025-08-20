import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useWelcomeStore } from '../../../src/stores/welcome'
import { useRestoreStore } from '../../../src/stores/restore'
import { useSignerStore } from '../../../src/stores/signer'

function createTestRouter() {
  const routes = [
    { path: '/wallet', component: { template: '<div />' } },
    { path: '/welcome', component: { template: '<div />' } },
    { path: '/restore', component: { template: '<div />' } },
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
      next('/welcome?first=1')
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
  it('redirects to /welcome when not onboarded', async () => {
    const router = createTestRouter()
    const welcome = useWelcomeStore()
    welcome.welcomeCompleted = false
    const restore = useRestoreStore()
    restore.restoringState = false
    await router.push('/wallet')
    expect(router.currentRoute.value.fullPath).toBe('/welcome?first=1')
  })

  it('allows navigation when onboarded', async () => {
    const router = createTestRouter()
    const welcome = useWelcomeStore()
    const signer = useSignerStore()
    signer.method = 'local'
    welcome.markWelcomeCompleted()
    await router.push('/wallet')
    expect(router.currentRoute.value.fullPath).toBe('/wallet')
  })
})
