<template>
  <div class="column items-center q-pa-md text-center">
    <div class="text-h5 q-mb-sm">{{ $t(step.titleKey) }}</div>
    <div v-if="step.subtitleKey" class="text-subtitle1 q-mb-md">
      {{ $t(step.subtitleKey) }}
    </div>
    <div v-if="step.bodyKey" class="text-body1 q-mb-md">
      {{ $t(step.bodyKey) }}
    </div>
    <div v-if="step.bulletsKeys" class="row q-gutter-sm q-mb-md justify-center">
      <q-badge v-for="b in step.bulletsKeys" :key="b" outline>{{ $t(b) }}</q-badge>
    </div>
    <div v-if="step.ctas" class="column q-gutter-sm q-mt-md" style="min-width:200px;">
      <q-btn
        v-for="cta in step.ctas"
        :key="cta.labelKey"
        :label="$t(cta.labelKey)"
        :color="cta.variant === 'secondary' ? 'secondary' : 'primary'"
        @click="$emit('cta', cta)"
        :outline="cta.variant === 'secondary'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { OnboardingStep as Step, OnboardingCTA } from '../../stores/onboarding';

defineProps<{ step: Step }>();

defineEmits<{ (e: 'cta', cta: OnboardingCTA): void }>();
</script>

