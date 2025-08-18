<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="check_circle" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.finish.title") }}
      </h1>
      <div class="q-mt-lg column items-center">
        <q-btn
          color="primary"
          class="q-mb-sm"
          @click="addMint"
          :label="$t('Welcome.slides.finish.addMint.label')"
          aria-label="$t('Welcome.slides.finish.addMint.label')"
        />
        <q-btn
          flat
          color="primary"
          class="q-mb-sm"
          @click="restore"
          :label="$t('Welcome.slides.finish.restore.label')"
          aria-label="$t('Welcome.slides.finish.restore.label')"
        />
        <q-btn
          flat
          color="primary"
          :label="$t('Welcome.slides.finish.about.label')"
          to="/about"
          aria-label="$t('Welcome.slides.finish.about.label')"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useWelcomeStore } from "src/stores/welcome";

const props = defineProps<{ restore: () => void }>();
const router = useRouter();
const welcomeStore = useWelcomeStore();
const id = "welcome-finish-title";

function addMint() {
  welcomeStore.finishTutorial();
  router.push("/wallet?mint=");
}

function restore() {
  props.restore();
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
