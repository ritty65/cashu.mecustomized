<template>
  <div class="full-width flex flex-center q-px-sm" @drop.prevent @dragover.prevent>
    <q-card class="q-pa-none column full-width" style="max-width:768px">
      <div class="col">
        <OnboardingStep :step="steps[current]" />
      </div>
      <footer class="q-pa-sm row items-center no-wrap">
        <div class="col-auto column items-start q-gutter-xs">
          <q-select
            v-model="selectedLanguage"
            :options="languageOptions"
            emit-value
            map-options
            dense
            outlined
            style="width:150px"
            :label="$t('onb.footer.language')"
            @update:model-value="changeLanguage"
          />
          <q-btn flat size="sm" class="q-px-none" @click="goRestore" :label="$t('onb.footer.restore')" />
        </div>
        <div class="col text-center">
          <div aria-live="polite">{{ $t('onb.footer.step',{current:current+1,total}) }}</div>
          <q-linear-progress class="q-mt-xs" color="primary" track-color="grey-3" :value="(current+1)/total" />
        </div>
        <div class="col-auto row items-center q-gutter-sm">
          <q-btn flat :label="$t('onb.nav.back')" :disable="current===0" v-if="current>0" @click="back" />
          <q-btn flat color="primary" :label="current===total-1?$t('onb.nav.next'):$t('onb.nav.next')" @click="next" />
          <q-btn flat :label="$t('onb.nav.skip')" @click="skip" />
        </div>
      </footer>
      <div class="text-caption text-center q-pb-sm">{{ $t('onb.footer.draghint') }}</div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import OnboardingStep from './OnboardingStep.vue';
import type { OnboardingStep as Step } from './types';
import { useOnboardingStore } from 'src/stores/onboarding';

const router = useRouter();
const { t, locale, availableLocales } = useI18n();
const onboarding = useOnboardingStore();

const steps = ref<Step[]>([
  {
    id: 1,
    titleKey: 'onb.1.title',
    subtitleKey: 'onb.1.subtitle',
    bulletsKeys: ['onb.1.badge.private','onb.1.badge.p2p','onb.1.badge.cr','onb.1.badge.client']
  },
  {
    id: 2,
    titleKey: 'onb.2.title',
    bodyKey: 'onb.2.body',
    ctas: [
      { labelKey: 'onb.2.cta.fresh', action: 'emit', eventName: 'onb_cta_fresh_key', variant:'primary' },
      { labelKey: 'onb.2.cta.import', action: 'emit', eventName: 'onb_cta_import_key_open', variant:'secondary' },
    ],
  },
  {
    id: 3,
    titleKey: 'onb.3.title',
    bodyKey: 'onb.3.body',
    ctas: [
      { labelKey: 'onb.3.cta.recommended', action: 'emit', eventName: 'onb_cta_recommended_mint', variant:'primary' },
      { labelKey: 'onb.3.cta.custom', action: 'emit', eventName: 'onb_cta_custom_mint_open', variant:'secondary' },
    ],
  },
  {
    id: 4,
    titleKey: 'onb.4.title',
    bodyKey: 'onb.4.body',
    ctas: [
      { labelKey: 'onb.4.cta.preset', action: 'route', to: '/wallet', params:{ amount:1000 }, variant:'primary' },
      { labelKey: 'onb.4.cta.custom', action: 'route', to: '/wallet', variant:'secondary' },
    ],
  },
  {
    id: 5,
    titleKey: 'onb.5.title',
    bodyKey: 'onb.5.body',
    ctas: [
      { labelKey: 'onb.5.cta.testpay', action: 'route', to: '/wallet', variant:'primary' },
      { labelKey: 'onb.5.cta.token', action: 'route', to: '/wallet', variant:'secondary' },
    ],
  },
  {
    id: 6,
    titleKey: 'onb.6.title',
    bodyKey: 'onb.6.body',
    ctas: [
      { labelKey: 'onb.6.cta.profile', action: 'route', to: '/creator-hub', variant:'primary' },
      { labelKey: 'onb.6.cta.find', action: 'route', to: '/find-creators', variant:'secondary' },
    ],
  },
  {
    id: 7,
    titleKey: 'onb.7.title',
    bodyKey: 'onb.7.body',
    ctas: [
      { labelKey: 'onb.7.cta.backup', action: 'route', to: '/settings', variant:'primary' },
      { labelKey: 'onb.7.cta.subs', action: 'route', to: '/subscriptions', variant:'secondary' },
    ],
  },
]);

const current = ref(0);
const total = steps.value.length;

const languageOptions = computed(() =>
  availableLocales.map((l) => ({ label: l, value: l }))
);
const selectedLanguage = ref(locale.value);
function changeLanguage(lang: string) {
  locale.value = lang;
}

function goRestore() {
  router.push('/restore');
}

function next() {
  console.log('onb_click_next');
  if (current.value < total - 1) {
    current.value++;
  } else {
    finish();
  }
}
function back() {
  console.log('onb_click_back');
  if (current.value > 0) current.value--;
}
function skip() {
  console.log('onb_click_skip');
  finish();
}
function finish() {
  onboarding.complete();
  router.replace('/wallet');
}
</script>
