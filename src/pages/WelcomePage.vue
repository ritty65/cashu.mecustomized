<template>
  <q-dialog
    v-model="welcomeStore.showWelcome"
    persistent
    transition-show="slide-up"
    transition-hide="fadeOut"
    full-screen
    @drop.prevent="dragFile"
    @dragover.prevent
  >
    <q-card
      class="q-pa-none flex flex-column"
      style="height: 100%; max-width: 768px; margin: 0 auto"
    >
      <q-carousel v-model="welcomeStore.currentSlide" animated class="col">
        <q-carousel-slide
          v-for="(s, index) in slides"
          :key="s.id"
          :name="index"
        >
          <component
            :is="s.component"
            :heading-id="s.id"
            @add-mint="openAddMint"
            @restore="triggerRestore"
            @about="goAbout"
          />
        </q-carousel-slide>
      </q-carousel>

      <div
        class="q-pa-md row items-center justify-between"
        style="min-height: 64px"
      >
        <div class="row items-center">
          <q-select
            v-model="selectedLanguage"
            :options="languageOptions"
            emit-value
            dense
            map-options
            @update:model-value="changeLanguage"
            style="max-width: 150px"
          />
          <q-btn
            flat
            size="sm"
            :label="t('Welcome.actions.restore')"
            class="q-ml-sm"
            @click="triggerRestore"
          />
        </div>

        <div
          class="column items-center justify-center q-mx-sm"
          style="flex: 1"
          aria-live="polite"
        >
          <div>
            {{
              t('Welcome.progress.step', {
                current: welcomeStore.currentSlide + 1,
                total: welcomeStore.totalSlides,
              })
            }}
          </div>
          <q-linear-progress
            :value="(welcomeStore.currentSlide + 1) / welcomeStore.totalSlides"
            class="q-mt-xs"
          />
        </div>

        <div class="row items-center">
          <q-btn
            flat
            icon="arrow_left"
            :label="t('Welcome.actions.previous')"
            :disable="!welcomeStore.canGoPrev"
            @click="welcomeStore.goToPrevSlide"
            :aria-label="t('Welcome.actions.previous')"
          />
          <q-btn
            flat
            icon="arrow_right"
            :label="nextLabel"
            :disable="!welcomeStore.canGoNext"
            @click="welcomeStore.goToNextSlide"
            :aria-label="nextLabel"
            class="q-ml-sm"
          />
          <q-btn
            v-if="showSkip"
            flat
            icon="close"
            :label="t('Welcome.actions.skip')"
            @click="welcomeStore.skipTutorial"
            :aria-label="t('Welcome.actions.skip')"
            class="q-ml-sm"
          />
        </div>
      </div>
      <div class="text-center text-caption q-pb-sm">
        {{ t('Welcome.hints.dragDrop') }}
      </div>
      <input
        ref="fileUpload"
        type="file"
        class="hidden"
        @change="onChangeFileUpload"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  watch,
  nextTick,
  onBeforeUnmount,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useWelcomeStore } from 'src/stores/welcome';
import { useStorageStore } from 'src/stores/storage';
import { useMintsStore } from 'src/stores/mints';
import WelcomeSlidePrivacy from './welcome/WelcomeSlidePrivacy.vue';
import WelcomeSlideMints from './welcome/WelcomeSlideMints.vue';
import WelcomeSlideProofs from './welcome/WelcomeSlideProofs.vue';
import WelcomeSlideBuckets from './welcome/WelcomeSlideBuckets.vue';
import WelcomeSlideBackup from './welcome/WelcomeSlideBackup.vue';
import WelcomeSlideTerms from './welcome/WelcomeSlideTerms.vue';
import WelcomeSlidePwa from './welcome/WelcomeSlidePwa.vue';
import WelcomeSlideFinish from './welcome/WelcomeSlideFinish.vue';

const { t, locale } = useI18n();
const welcomeStore = useWelcomeStore();
const storageStore = useStorageStore();
const mintsStore = useMintsStore();

const fileUpload = ref<HTMLInputElement | null>(null);

const slides = computed(() => {
  const arr = [
    { id: 'welcome-privacy', component: WelcomeSlidePrivacy },
    { id: 'welcome-mints', component: WelcomeSlideMints },
    { id: 'welcome-proofs', component: WelcomeSlideProofs },
    { id: 'welcome-buckets', component: WelcomeSlideBuckets },
    { id: 'welcome-backup', component: WelcomeSlideBackup },
    { id: 'welcome-terms', component: WelcomeSlideTerms },
  ];
  if (welcomeStore.pwaSlideEligible) {
    arr.push({ id: 'welcome-pwa', component: WelcomeSlidePwa });
  }
  arr.push({ id: 'welcome-finish', component: WelcomeSlideFinish });
  return arr;
});

watch(
  () => welcomeStore.currentSlide,
  (idx) => {
    nextTick(() => {
      const id = slides.value[idx].id;
      document.getElementById(id)?.focus();
    });
  },
);

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

function changeLanguage(l: string) {
  if (l === 'en') l = 'en-US';
  locale.value = l;
  localStorage.setItem('cashu.language', l);
}

function triggerRestore() {
  fileUpload.value?.click();
}

function onChangeFileUpload() {
  const file = fileUpload.value?.files?.[0];
  if (file) readFile(file);
}

function readFile(file: File) {
  const reader = new FileReader();
  reader.onload = (f) => {
    try {
      const backup = JSON.parse(f.target?.result as string);
      storageStore.restoreFromBackup(backup);
    } catch (e) {
      console.error(e);
    }
  };
  reader.readAsText(file);
}

function dragFile(ev: DragEvent) {
  const file = ev.dataTransfer?.files[0];
  if (file) readFile(file);
}

function openAddMint() {
  welcomeStore.finishTutorial().then(() => {
    mintsStore.showAddMintDialog = true;
  });
}

function goAbout() {
  welcomeStore.finishTutorial('/about');
}

const showSkip = computed(() => welcomeStore.currentSlide < 4);
const nextLabel = computed(() =>
  welcomeStore.isLastSlide
    ? t('Welcome.actions.finish')
    : t('Welcome.actions.next'),
);

function handleKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    welcomeStore.goToNextSlide();
  } else if (e.key === 'ArrowLeft') {
    welcomeStore.goToPrevSlide();
  } else if (e.key === 'Enter') {
    if (welcomeStore.canGoNext) welcomeStore.goToNextSlide();
  } else if (e.key === 'Escape') {
    if (showSkip.value) {
      welcomeStore.skipTutorial();
    } else if (welcomeStore.isLastSlide) {
      welcomeStore.goToNextSlide();
    } else {
      e.preventDefault();
    }
  }
}

onMounted(() => {
  welcomeStore.initializeWelcome();
  const stored = localStorage.getItem('cashu.language');
  const initLocale = stored || locale.value || navigator.language || 'en-US';
  locale.value = initLocale === 'en' ? 'en-US' : initLocale;
  selectedLanguage.value = locale.value;
  window.addEventListener('keydown', handleKey);
  nextTick(() => {
    const id = slides.value[welcomeStore.currentSlide].id;
    document.getElementById(id)?.focus();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>

<style scoped>
.q-card {
  display: flex;
  flex-direction: column;
}
.q-carousel {
  flex: 1;
}
</style>
