<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="visibility_off" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t('Welcome.slides.privacy.title') }}
      </h1>
      <p class="q-mt-sm">{{ $t('Welcome.slides.privacy.text') }}</p>
      <p class="q-mt-sm">
        <router-link to="/about" class="text-primary">
          {{ $t('Welcome.slides.privacy.about') }}
        </router-link>
      </p>
    </div>
  </section>
</template>

<script setup>
const id = 'welcome-privacy-title';
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
