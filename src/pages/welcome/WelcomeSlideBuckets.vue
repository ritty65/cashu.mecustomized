<template>
  <section
    class="q-pa-md flex flex-center"
    role="region"
    :aria-labelledby="headingId"
  >
    <div class="text-center">
      <q-icon name="inventory" size="4em" color="primary" />
      <h1 :id="headingId" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.buckets.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.slides.buckets.text") }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ headingId: string }>();
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
