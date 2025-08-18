<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="install_mobile" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.pwa.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.slides.pwa.text") }}</p>
      <q-btn
        class="q-mt-md"
        color="primary"
        @click="triggerInstall"
        :label="$t('Welcome.slides.pwa.install.label')"
        aria-label="$t('Welcome.slides.pwa.install.label')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ triggerInstall: () => void }>();
const id = "welcome-pwa-title";

function triggerInstall() {
  props.triggerInstall();
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
