<template>
  <div
    class="full-width flex flex-center q-px-sm"
    @drop.prevent="dragFile"
    @dragover.prevent
  >
    <q-card class="q-pa-none column full-width" style="max-width: 768px">
      <q-carousel
        v-model="welcomeStore.currentSlide"
        animated
        class="col"
      >
        <q-carousel-slide
          v-for="(slide, index) in slides"
          :key="slide.key"
          :name="index"
        >
          <component :is="slide.component" v-bind="slide.props" />
        </q-carousel-slide>
      </q-carousel>
      <footer class="q-pa-sm row items-center no-wrap">
        <div class="col-auto column items-start q-gutter-xs">
          <q-select
            v-model="selectedLanguage"
            :options="languageOptions"
            emit-value
            map-options
            dense
            outlined
            style="width: 150px"
            @update:model-value="changeLanguage"
          />
          <q-btn
            flat
            size="sm"
            class="q-px-none"
            @click="openFileDialog"
            :label="$t('Welcome.actions.restore')"
          />
        </div>
        <div class="col text-center">
          <div aria-live="polite">
            {{
              $t('Welcome.progress', {
                current: welcomeStore.currentSlide + 1,
                total: welcomeStore.totalSlides,
              })
            }}
          </div>
          <q-linear-progress
            class="q-mt-xs"
            color="primary"
            track-color="grey-3"
            :value="(welcomeStore.currentSlide + 1) / welcomeStore.totalSlides"
          />
        </div>
        <div class="col-auto row items-center q-gutter-sm">
          <q-btn
            flat
            :label="$t('Welcome.actions.previous')"
            :disable="welcomeStore.currentSlide === 0"
            @click="welcomeStore.goToPrevSlide"
            v-if="welcomeStore.currentSlide > 0"
          />
          <q-btn
            flat
            color="primary"
            :label="
              welcomeStore.isLastSlide
                ? $t('Welcome.actions.finish')
                : $t('Welcome.actions.next')
            "
            :disable="!welcomeStore.canGoNext"
            @click="welcomeStore.goToNextSlide"
          />
          <q-btn
            flat
            v-if="showSkip"
            :label="$t('Welcome.actions.skip')"
            @click="welcomeStore.skipTutorial"
          />
        </div>
      </footer>
      <div class="text-caption text-center q-pb-sm">
        {{ $t('Welcome.hint') }}
      </div>
    </q-card>
    <input
      type="file"
      ref="fileUpload"
      class="hidden"
      @change="onChangeFileUpload"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useWelcomeStore } from 'src/stores/welcome';
import { useStorageStore } from 'src/stores/storage';
import WelcomeSlidePrivacy from './welcome/WelcomeSlidePrivacy.vue';
import WelcomeSlideMints from './welcome/WelcomeSlideMints.vue';
import WelcomeSlideProofs from './welcome/WelcomeSlideProofs.vue';
import WelcomeSlideBuckets from './welcome/WelcomeSlideBuckets.vue';
import WelcomeSlideBackup from './welcome/WelcomeSlideBackup.vue';
import WelcomeSlideTerms from './welcome/WelcomeSlideTerms.vue';
import WelcomeSlidePwa from './welcome/WelcomeSlidePwa.vue';
import WelcomeSlideFinish from './welcome/WelcomeSlideFinish.vue';

const $q = useQuasar();
const { locale, t } = useI18n();
const welcomeStore = useWelcomeStore();
const storageStore = useStorageStore();
const fileUpload = ref<HTMLInputElement | null>(null);
const selectedLanguage = ref('');
const languageOptions = [
  { label: 'English', value: 'en-US' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Italiano', value: 'it-IT' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Svenska', value: 'sv-SE' },
  { label: 'Ελληνικά', value: 'el-GR' },
  { label: 'Türkçe', value: 'tr-TR' },
  { label: 'ไทย', value: 'th-TH' },
  { label: 'العربية', value: 'ar-SA' },
  { label: '中文', value: 'zh-CN' },
  { label: '日本語', value: 'ja-JP' },
];

const deferredPrompt = ref<any>(null);
const slides = ref<{ key: string; component: any; props?: any }[]>([]);

function buildSlides() {
  const arr = [
    { key: 'privacy', component: WelcomeSlidePrivacy },
    { key: 'mints', component: WelcomeSlideMints },
    { key: 'proofs', component: WelcomeSlideProofs },
    { key: 'buckets', component: WelcomeSlideBuckets },
    { key: 'backup', component: WelcomeSlideBackup },
    { key: 'terms', component: WelcomeSlideTerms },
  ];
  if (welcomeStore.pwaSlideEligible) {
    arr.push({ key: 'pwa', component: WelcomeSlidePwa, props: { triggerInstall } });
  }
  arr.push({ key: 'finish', component: WelcomeSlideFinish, props: { restore: openFileDialog } });
  slides.value = arr;
  welcomeStore.setSlides(arr.map((s) => s.key));
}

function changeLanguage(lang: string) {
  if (lang === 'en') {
    lang = 'en-US';
  }
  locale.value = lang;
  localStorage.setItem('cashu.language', lang);
}

function onChangeFileUpload() {
  const file = fileUpload.value?.files?.[0];
  if (file) readFile(file);
}

function readFile(file: File) {
  const reader = new FileReader();
  reader.onload = (f) => {
    try {
      const backup = JSON.parse(String(f.target?.result));
      storageStore.restoreFromBackup(backup);
      $q.notify({ type: 'positive', message: t('Welcome.restore.success') });
    } catch (e) {
      $q.notify({ type: 'negative', message: t('Welcome.restore.error') });
    }
  };
  reader.readAsText(file);
}

function dragFile(ev: DragEvent) {
  const file = ev.dataTransfer?.files[0];
  if (file) readFile(file);
}

function openFileDialog() {
  fileUpload.value?.click();
}

function triggerInstall() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    deferredPrompt.value.userChoice.finally(() => {
      deferredPrompt.value = null;
    });
  }
}

const showSkip = ref(false);

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    welcomeStore.goToPrevSlide();
  } else if (e.key === 'ArrowRight') {
    if (welcomeStore.canGoNext) welcomeStore.goToNextSlide();
  } else if (e.key === 'Enter') {
    if (welcomeStore.canGoNext) welcomeStore.goToNextSlide();
  } else if (e.key === 'Escape') {
    if (showSkip.value) {
      welcomeStore.skipTutorial();
    } else if (welcomeStore.isLastSlide) {
      welcomeStore.finishTutorial();
    } else {
      e.preventDefault();
    }
  }
}

onMounted(() => {
  welcomeStore.initializeWelcome();
  const stored = localStorage.getItem('cashu.language');
  const initLocale = stored || navigator.language || 'en-US';
  selectedLanguage.value = initLocale === 'en' ? 'en-US' : initLocale;
  changeLanguage(selectedLanguage.value);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });
  buildSlides();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

watch(
  () => welcomeStore.currentSlide,
  () => {
    showSkip.value = ['privacy', 'mints', 'proofs', 'buckets'].includes(
      slides.value[welcomeStore.currentSlide]?.key,
    );
    nextTick(() => {
      const key = slides.value[welcomeStore.currentSlide]?.key;
      const el = document.getElementById(`welcome-${key}-title`);
      el?.focus();
    });
  },
  { immediate: true },
);
</script>

<style scoped>
.q-card {
  height: 100%;
}
.q-carousel {
  flex: 1;
}
</style>
