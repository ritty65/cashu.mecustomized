<template>
  <div class="column items-center q-pa-lg text-center">
    <MiniDiagram class="q-mb-lg" />
    <h2 class="text-h5 q-mb-md">{{ $t(step.titleKey) }}</h2>
    <div v-if="step.subtitleKey" class="q-mb-md">{{ $t(step.subtitleKey) }}</div>
    <div v-if="step.bodyKey" class="q-mb-md">{{ $t(step.bodyKey) }}</div>
    <div v-if="step.bulletsKeys" class="row q-gutter-sm q-mb-md">
      <q-badge v-for="b in step.bulletsKeys" :key="b">{{ $t(b) }}</q-badge>
    </div>
    <div v-if="step.ctas" class="column q-gutter-sm q-mt-md">
      <q-btn
        v-for="cta in step.ctas"
        :key="cta.labelKey"
        :label="$t(cta.labelKey)"
        :color="cta.variant === 'secondary' ? 'secondary' : 'primary'"
        :outline="cta.variant === 'secondary'"
        @click="handleCta(cta)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import MiniDiagram from './MiniDiagram.vue';
import type { OnboardingCTA, OnboardingStep as Step } from './types';
import { useOnboardingStore } from 'src/stores/onboarding';

const props = defineProps<{ step: Step }>();

const router = useRouter();
const onboarding = useOnboardingStore();

function handleCta(cta: OnboardingCTA) {
  onboarding.complete();
  if (cta.action === 'route' && cta.to) {
    router.push({ path: cta.to, params: cta.params });
  } else if (cta.action === 'emit' && cta.eventName) {
    // simple analytics emit
    console.log(cta.eventName);
  } else if (cta.action === 'openModal' && cta.eventName) {
    console.log(cta.eventName);
  }
}
</script>
