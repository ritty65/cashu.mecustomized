<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="apps" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">{{ $t('Welcome.features.title') }}</h1>
      <p class="q-mt-sm">{{ $t('Welcome.features.lead') }}</p>
      <p class="text-caption q-mt-sm">{{ $t('Welcome.features.subtitle') }}</p>
      <p class="text-caption q-mt-sm">{{ $t('Welcome.features.intro') }}</p>
      <div class="q-mt-md text-left">
        <div class="row q-col-gutter-md justify-center" style="max-width:400px;margin:0 auto;">
          <div v-for="f in featureLinks" :key="f.id" class="col-12 col-sm-4">
            <q-card class="cursor-pointer" @click="openFeature(f)">
              <q-card-section class="row items-center no-wrap">
                <div class="col">{{ $t(f.label) }}</div>
                <q-icon
                  v-if="welcome.featuresVisited[f.id]"
                  name="check"
                  color="positive"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <q-dialog v-model="dialog">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ selectedFeature ? $t(selectedFeature.label) : '' }}</div>
            <div class="q-mt-sm">{{ selectedFeature ? $t(selectedFeature.desc) : '' }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="$t('global.actions.close.label')" v-close-popup />
            <q-btn
              flat
              color="primary"
              :label="$t('global.actions.enter.label')"
              @click="goToSelected"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <p class="q-mt-md">{{ $t('Welcome.features.relation') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWelcomeStore } from 'src/stores/welcome'

const id = 'welcome-features-title'
const welcome = useWelcomeStore()
const router = useRouter()
const dialog = ref(false)
const selectedFeature = ref<any>(null)
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

function openFeature(f: any) {
  selectedFeature.value = f
  dialog.value = true
  markVisited(f.id)
}

function goToSelected() {
  if (selectedFeature.value) {
    router.push(selectedFeature.value.to)
    dialog.value = false
  }
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
