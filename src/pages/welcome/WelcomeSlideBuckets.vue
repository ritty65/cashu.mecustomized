<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="inventory" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.buckets.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.slides.buckets.text") }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
const id = "welcome-buckets-title";
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
