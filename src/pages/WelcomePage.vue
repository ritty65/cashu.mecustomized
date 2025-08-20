<template>
  <q-page class="q-pa-md flex flex-center">
    <div style="width:100%;max-width:600px">
      <component :is="slides[welcome.currentSlide]" />
      <div class="row justify-between q-mt-lg">
        <q-btn flat :disable="welcome.currentSlide === 0" @click="prev" :label="$t('Welcome.footer.previous')" />
        <q-btn
          color="primary"
          :label="welcome.currentSlide === LAST_WELCOME_SLIDE ? $t('Welcome.footer.finish') : $t('Welcome.footer.next')"
          :disable="!welcome.canProceed(welcome.currentSlide)"
          @click="next"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import WelcomeSlideFeatures from './welcome/WelcomeSlideFeatures.vue'
import WelcomeSlideNostr from './welcome/WelcomeSlideNostr.vue'
import WelcomeSlidePwa from './welcome/WelcomeSlidePwa.vue'
import WelcomeSlideBackup from './welcome/WelcomeSlideBackup.vue'
import WelcomeSlideMints from './welcome/WelcomeSlideMints.vue'
import WelcomeSlideTerms from './welcome/WelcomeSlideTerms.vue'
import { useWelcomeStore, LAST_WELCOME_SLIDE } from 'src/stores/welcome'
import { useRouter } from 'vue-router'

const welcome = useWelcomeStore()
const router = useRouter()

const slides = [
  WelcomeSlideFeatures,
  WelcomeSlideNostr,
  WelcomeSlidePwa,
  WelcomeSlideBackup,
  WelcomeSlideMints,
  WelcomeSlideTerms,
]

function next() {
  if (welcome.currentSlide === LAST_WELCOME_SLIDE) {
    welcome.closeWelcome()
    router.push('/')
  } else if (welcome.canProceed(welcome.currentSlide)) {
    welcome.currentSlide++
  }
}

function prev() {
  if (welcome.currentSlide > 0) welcome.currentSlide--
}
</script>
