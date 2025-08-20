<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="apps" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">{{ $t('Welcome.features.title') }}</h1>
      <p class="q-mt-sm">{{ $t('Welcome.features.lead') }}</p>
      <p class="text-caption q-mt-sm">{{ $t('Welcome.features.subtitle') }}</p>
      <p class="text-caption q-mt-sm">{{ $t('Welcome.features.intro') }}</p>
      <div class="q-mt-md text-left" style="display:inline-block; width:250px">
        <div v-for="f in featureLinks" :key="f.id" class="q-mb-sm">
          <router-link :to="f.to" @click="markVisited(f.id)">
            <q-btn class="full-width justify-between" outline>
              <span>{{ $t(f.label) }}</span>
              <q-icon v-if="welcome.featuresVisited[f.id]" name="check" color="positive" />
            </q-btn>
          </router-link>
          <div class="text-caption q-mt-xs">{{ $t(f.desc) }}</div>
        </div>
      </div>
      <p class="q-mt-md">{{ $t('Welcome.features.relation') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useWelcomeStore } from 'src/stores/welcome'

const id = 'welcome-features-title'
const welcome = useWelcomeStore()
const featureLinks = [
  {
    id: 'creatorHub',
    to: '/creator-hub',
    label: 'Welcome.features.bullets.creatorHub.label',
    desc: 'Welcome.features.bullets.creatorHub.desc',
  },
  {
    id: 'subscriptions',
    to: '/subscriptions',
    label: 'Welcome.features.bullets.subscriptions.label',
    desc: 'Welcome.features.bullets.subscriptions.desc',
  },
  {
    id: 'buckets',
    to: '/buckets',
    label: 'Welcome.features.bullets.buckets.label',
    desc: 'Welcome.features.bullets.buckets.desc',
  },
]

function markVisited(id: string) {
  ;(welcome.featuresVisited as any)[id] = true
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
