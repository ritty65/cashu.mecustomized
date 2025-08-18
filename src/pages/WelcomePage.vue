<template>
  <div
    class="full-width flex flex-center q-px-sm"
    @drop.prevent="dragFile"
    @dragover.prevent
  >
    <q-card class="q-pa-none column full-width" style="max-width: 768px">
      <q-carousel v-model="welcomeStore.currentSlide" animated class="col">
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
            :label="$t('Welcome.footer.language')"
            @update:model-value="changeLanguage"
          />
          <q-btn
            flat
            size="sm"
            class="q-px-none"
            @click="openFileDialog"
            :label="$t('Welcome.footer.restoreCta')"
          />
        </div>
        <div class="col text-center">
          <div aria-live="polite">
            {{
              $t("Welcome.footer.step", {
                n: welcomeStore.currentSlide + 1,
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
            :label="$t('Welcome.footer.previous')"
            :disable="welcomeStore.currentSlide === 0"
            @click="welcomeStore.goToPrevSlide"
            v-if="welcomeStore.currentSlide > 0"
          />
          <q-btn
            flat
            color="primary"
            :label="
              welcomeStore.isLastSlide
                ? $t('Welcome.footer.finish')
                : $t('Welcome.footer.next')
            "
            :disable="!welcomeStore.canGoNext"
            @click="welcomeStore.goToNextSlide"
          />
          <q-btn
            flat
            v-if="showSkip"
            :label="$t('Welcome.footer.skip')"
            @click="welcomeStore.skipTutorial"
          />
        </div>
      </footer>
      <div class="text-caption text-center q-pb-sm">
        {{ $t("Welcome.footer.hint") }}
      </div>
    </q-card>
    <AddMintDialog
      :addMintData="mintsStore.addMintData"
      :showAddMintDialog="mintsStore.showAddMintDialog"
      @update:showAddMintDialog="mintsStore.showAddMintDialog = $event"
      :addMintBlocking="mintsStore.addMintBlocking"
      @add="mintsStore.addMint"
    />
    <input
      type="file"
      ref="fileUpload"
      class="hidden"
      @change="onChangeFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { useWelcomeStore } from "src/stores/welcome";
import { useStorageStore } from "src/stores/storage";
import { useMintsStore } from "src/stores/mints";
import { useBucketsStore } from "src/stores/buckets";
import { useMnemonicStore } from "src/stores/mnemonic";
import WelcomeSlidePrivacy from "./welcome/WelcomeSlidePrivacy.vue";
import WelcomeSlideMints from "./welcome/WelcomeSlideMints.vue";
import WelcomeSlideProofs from "./welcome/WelcomeSlideProofs.vue";
import WelcomeSlideBuckets from "./welcome/WelcomeSlideBuckets.vue";
import WelcomeSlideBackup from "./welcome/WelcomeSlideBackup.vue";
import WelcomeSlideTerms from "./welcome/WelcomeSlideTerms.vue";
import WelcomeSlidePwa from "./welcome/WelcomeSlidePwa.vue";
import WelcomeSlideFinish from "./welcome/WelcomeSlideFinish.vue";
import AddMintDialog from "src/components/AddMintDialog.vue";

const $q = useQuasar();
const { locale, t } = useI18n();
const welcomeStore = useWelcomeStore();
const storageStore = useStorageStore();
const mintsStore = useMintsStore();
const bucketsStore = useBucketsStore();
const mnemonicStore = useMnemonicStore();
const fileUpload = ref<HTMLInputElement | null>(null);
const selectedLanguage = ref("");
const languageOptions = [
  { label: "English", value: "en-US" },
  { label: "Español", value: "es-ES" },
  { label: "Italiano", value: "it-IT" },
  { label: "Deutsch", value: "de-DE" },
  { label: "Français", value: "fr-FR" },
  { label: "Svenska", value: "sv-SE" },
  { label: "Ελληνικά", value: "el-GR" },
  { label: "Türkçe", value: "tr-TR" },
  { label: "ไทย", value: "th-TH" },
  { label: "العربية", value: "ar-SA" },
  { label: "中文", value: "zh-CN" },
  { label: "日本語", value: "ja-JP" },
];

const deferredPrompt = ref<any>(null);
const slides = ref<{ key: string; component: any; props?: any }[]>([]);

function buildSlides() {
  const arr = [
    { key: "privacy", component: WelcomeSlidePrivacy },
    {
      key: "mints",
      component: WelcomeSlideMints,
      props: { onAddMint: openAddMintDialog },
    },
    { key: "proofs", component: WelcomeSlideProofs },
    {
      key: "buckets",
      component: WelcomeSlideBuckets,
      props: { onCreateBuckets: createStarterBuckets },
    },
    {
      key: "backup",
      component: WelcomeSlideBackup,
      props: { onRevealSeed, onDownloadBackup },
    },
    { key: "terms", component: WelcomeSlideTerms },
    welcomeStore.pwaSlideEligible
      ? {
          key: "pwa",
          component: WelcomeSlidePwa,
          props: { deferredPrompt },
        }
      : null,
    {
      key: "finish",
      component: WelcomeSlideFinish,
      props: { onAddMint: openAddMintDialog, onRestore: openFileDialog },
    },
  ].filter(Boolean) as any[];
  slides.value = arr;
  welcomeStore.setSlides(arr.map((s) => s.key));
}

function changeLanguage(lang: string) {
  if (lang === "en") {
    lang = "en-US";
  }
  locale.value = lang;
  localStorage.setItem("cashu.language", lang);
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
    } catch (e) {}
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

function openAddMintDialog() {
  mintsStore.showAddMintDialog = true;
}

function createStarterBuckets() {
  bucketsStore.createStarterBuckets();
  $q.notify({ type: "positive", message: t("Welcome.buckets.ctaPrimary") });
}

function onRevealSeed() {
  $q.dialog({ title: t("Welcome.backup.revealSeed"), message: mnemonicStore.mnemonic });
}

function onDownloadBackup() {
  storageStore.exportWalletState();
}

const showSkip = ref(false);

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowLeft") {
    welcomeStore.goToPrevSlide();
  } else if (e.key === "ArrowRight") {
    if (welcomeStore.canGoNext) welcomeStore.goToNextSlide();
  } else if (e.key === "Enter") {
    if (welcomeStore.canGoNext) welcomeStore.goToNextSlide();
  } else if (e.key === "Escape") {
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
  const stored = localStorage.getItem("cashu.language");
  const initLocale = stored || navigator.language || "en-US";
  selectedLanguage.value = initLocale === "en" ? "en-US" : initLocale;
  changeLanguage(selectedLanguage.value);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });
  buildSlides();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

watch(
  () => welcomeStore.currentSlide,
  () => {
    showSkip.value = ["privacy", "mints", "proofs", "buckets"].includes(
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
