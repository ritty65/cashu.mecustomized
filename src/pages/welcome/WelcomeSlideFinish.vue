<template>
  <section
    class="q-pa-md flex flex-center"
    role="region"
    :aria-labelledby="headingId"
  >
    <div class="text-center">
      <q-icon name="check_circle" size="4em" color="primary" />
      <h1 :id="headingId" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.finish.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.slides.finish.text") }}</p>
      <div class="q-mt-md column items-center">
        <q-btn
          color="primary"
          class="q-mb-sm"
          :label="$t('Welcome.slides.finish.actions.add_mint')"
          @click="$emit('add-mint')"
        />
        <q-btn
          flat
          color="primary"
          class="q-mb-sm"
          :label="$t('Welcome.slides.finish.actions.restore')"
          @click="$emit('restore')"
        />
        <q-btn
          flat
          color="primary"
          :label="$t('Welcome.slides.finish.actions.about')"
          @click="$emit('about')"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps<{ headingId: string }>();
const emit = defineEmits(["add-mint", "restore", "about"]);
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
