<template>
  <div class="full-width flex flex-center q-px-sm" @drop.prevent="dragFile" @dragover.prevent>
    <q-card class="q-pa-none column full-width" style="max-width:768px">
      <q-carousel v-model="store.currentStep" animated class="col">
        <q-carousel-slide v-for="step in steps" :key="step.id" :name="step.id">
          <OnboardingStep :step="step" @cta="handleCta" />
        </q-carousel-slide>
      </q-carousel>
      <footer class="q-pa-sm row items-center no-wrap">
        <div class="col-auto column items-start q-gutter-xs">
          <q-select v-model="selectedLanguage" :options="languageOptions" emit-value map-options dense outlined style="width:150px" :label="$t('onb.footer.language')" @update:model-value="changeLanguage" />
          <q-btn flat size="sm" class="q-px-none" @click="openFileDialog" :label="$t('onb.footer.restore')" />
        </div>
        <div class="col text-center">
          <div aria-live="polite">{{ $t('onb.footer.step', { current: store.currentStep + 1, total: store.totalSteps }) }}</div>
          <q-linear-progress class="q-mt-xs" color="primary" track-color="grey-3" :value="(store.currentStep + 1) / store.totalSteps" />
        </div>
        <div class="col-auto row items-center q-gutter-sm">
          <q-btn flat :label="$t('onb.nav.back')" :disable="store.currentStep === 0" @click="store.goPrev" />
          <q-btn flat color="primary" :label="$t('onb.nav.next')" @click="store.goNext" />
          <q-btn flat :label="$t('onb.nav.skip')" @click="store.skip" />
        </div>
      </footer>
      <div class="text-caption text-center q-pb-sm">{{ $t('onb.footer.draghint') }}</div>
    </q-card>
    <input type="file" ref="fileUpload" class="hidden" @change="onChangeFileUpload" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import router from 'src/router';
import { useOnboardingStore, OnboardingStep as Step } from '../../stores/onboarding';
import OnboardingStep from './OnboardingStep.vue';

const store = useOnboardingStore();
const { locale } = useI18n();

const steps: Step[] = [
  { id: 0, titleKey: 'onb.1.title', subtitleKey: 'onb.1.subtitle', bulletsKeys: ['onb.1.badge.private','onb.1.badge.p2p','onb.1.badge.cr','onb.1.badge.client'] },
  { id: 1, titleKey: 'onb.2.title', bodyKey: 'onb.2.body', ctas: [{ labelKey: 'onb.2.cta.fresh', action: 'emit', variant: 'primary' }, { labelKey: 'onb.2.cta.import', action: 'emit', variant: 'secondary', guarded: true }] },
  { id: 2, titleKey: 'onb.3.title', bodyKey: 'onb.3.body', ctas: [{ labelKey: 'onb.3.cta.recommended', action: 'emit', variant: 'primary' }, { labelKey: 'onb.3.cta.custom', action: 'emit', variant: 'secondary' }] },
  { id: 3, titleKey: 'onb.4.title', bodyKey: 'onb.4.body', ctas: [{ labelKey: 'onb.4.cta.preset', action: 'route', to: '/wallet', variant: 'primary', params: { amount:1000 } }, { labelKey: 'onb.4.cta.custom', action: 'route', to: '/wallet', variant: 'secondary' }] },
  { id: 4, titleKey: 'onb.5.title', bodyKey: 'onb.5.body', ctas: [{ labelKey: 'onb.5.cta.testpay', action: 'route', to: '/wallet', variant: 'primary' }, { labelKey: 'onb.5.cta.token', action: 'route', to: '/wallet', variant: 'secondary' }] },
  { id: 5, titleKey: 'onb.6.title', bodyKey: 'onb.6.body', ctas: [{ labelKey: 'onb.6.cta.profile', action: 'route', to: '/creator-hub', variant: 'primary' }, { labelKey: 'onb.6.cta.find', action: 'route', to: '/find-creators', variant: 'secondary' }] },
  { id: 6, titleKey: 'onb.7.title', bodyKey: 'onb.7.body', ctas: [{ labelKey: 'onb.7.cta.backup', action: 'emit', variant: 'primary' }, { labelKey: 'onb.7.cta.subs', action: 'route', to: '/subscriptions', variant: 'secondary' }] }
];
store.setSteps(steps);

const fileUpload = ref<HTMLInputElement | null>(null);
const selectedLanguage = ref('');
const languageOptions = [
  { label: 'English', value: 'en-US' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Deutsch', value: 'de-DE' },
];

function changeLanguage(lang: string) {
  locale.value = lang;
  localStorage.setItem('cashu.language', lang);
}

function openFileDialog() {
  fileUpload.value?.click();
}

function onChangeFileUpload() {
  // Placeholder for restore flow
}

function dragFile() {
  // placeholder
}

function handleCta(cta: any) {
  if (cta.action === 'route' && cta.to) {
    router.push(cta.to);
  }
}
</script>

