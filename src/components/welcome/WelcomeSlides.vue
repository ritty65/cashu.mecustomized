<template>
  <q-carousel v-model="slide" animated swipeable>
    <q-carousel-slide v-for="s in slides" :name="s.name" :key="s.name">
      <component
        :is="s.component"
        @open-wallet="emit('open-wallet')"
        @add-mint="emit('add-mint')"
        @create-buckets="emit('create-buckets')"
        @restore="emit('restore')"
      />
    </q-carousel-slide>
  </q-carousel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WelcomeSlideFeatures from 'src/pages/welcome/WelcomeSlideFeatures.vue'
import WelcomeSlidePrivacy from 'src/pages/welcome/WelcomeSlidePrivacy.vue'
import WelcomeSlideMints from 'src/pages/welcome/WelcomeSlideMints.vue'
import WelcomeSlideProofs from 'src/pages/welcome/WelcomeSlideProofs.vue'
import WelcomeSlideBuckets from 'src/pages/welcome/WelcomeSlideBuckets.vue'
import WelcomeSlidePwa from 'src/pages/welcome/WelcomeSlidePwa.vue'
import WelcomeSlideTerms from 'src/pages/welcome/WelcomeSlideTerms.vue'
import WelcomeSlideFinish from 'src/pages/welcome/WelcomeSlideFinish.vue'

const emit = defineEmits([
  'open-wallet',
  'add-mint',
  'create-buckets',
  'restore'
])

const slide = ref(0)
const slides = [
  { name: 0, component: WelcomeSlideFeatures },
  { name: 1, component: WelcomeSlidePrivacy },
  { name: 2, component: WelcomeSlideMints },
  { name: 3, component: WelcomeSlideProofs },
  { name: 4, component: WelcomeSlideBuckets },
  { name: 5, component: WelcomeSlidePwa },
  { name: 6, component: WelcomeSlideTerms },
  { name: 7, component: WelcomeSlideFinish },
]
</script>
