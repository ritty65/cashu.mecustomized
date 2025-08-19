import { describe, it, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOnboardingStore } from 'src/stores/onboarding';

describe('onboarding store', () => {
  it('defaults', () => {
    setActivePinia(createPinia());
    const store = useOnboardingStore();
    expect(store.isNewOnboardingEnabled).toBe(true);
    expect(store.hasCompletedOnboarding).toBe(false);
  });
});
