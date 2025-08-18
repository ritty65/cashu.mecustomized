<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="check_circle" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.finish.title") }}
      </h1>
      <div class="q-mt-lg column items-center">
        <q-btn
          color="primary"
          class="q-mb-sm"
          @click="addMint"
          :label="$t('Welcome.finish.ctas.addMint')"
        />
        <q-btn
          flat
          color="primary"
          class="q-mb-sm"
          @click="restore"
          :label="$t('Welcome.finish.ctas.restore')"
        />
        <q-btn
          flat
          color="primary"
          class="q-mb-sm"
          @click="openWallet"
          :label="$t('Welcome.finish.ctas.openWallet')"
        />
        <q-btn
          flat
          color="primary"
          :label="$t('Welcome.finish.ctas.about')"
          to="/about"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useWelcomeStore } from "src/stores/welcome";

const props = defineProps<{ onAddMint?: () => void; onRestore?: () => void }>();
const welcomeStore = useWelcomeStore();
const id = "welcome-finish-title";

function addMint() {
  props.onAddMint?.();
}

function restore() {
  props.onRestore?.();
}

function openWallet() {
  welcomeStore.finishTutorial();
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
