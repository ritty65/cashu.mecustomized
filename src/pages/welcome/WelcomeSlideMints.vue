<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="factory" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t('Welcome.slides.mints.title') }}
      </h1>
      <p class="q-mt-sm">{{ $t('Welcome.slides.mints.text') }}</p>
    </div>
  </section>
</template>

<script setup>
const id = 'welcome-mints-title';
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
