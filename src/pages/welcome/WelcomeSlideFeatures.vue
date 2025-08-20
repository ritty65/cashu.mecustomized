<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="apps" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.features.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.features.lead") }}</p>
      <ul class="q-mt-md text-left" style="display: inline-block">
        <li>
          <router-link to="/creator-hub">
            {{ $t("Welcome.features.bullets.creatorHub.label") }}
          </router-link>
          - {{ $t("Welcome.features.bullets.creatorHub.desc") }}
        </li>
        <li>
          <router-link to="/subscriptions">
            {{ $t("Welcome.features.bullets.subscriptions.label") }}
          </router-link>
          - {{ $t("Welcome.features.bullets.subscriptions.desc") }}
        </li>
        <li>
          <router-link to="/buckets">
            {{ $t("Welcome.features.bullets.buckets.label") }}
          </router-link>
          - {{ $t("Welcome.features.bullets.buckets.desc") }}
        </li>
      </ul>
      <p class="q-mt-md">
        {{ $t("Welcome.features.relation") }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const id = "welcome-features-title";
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
