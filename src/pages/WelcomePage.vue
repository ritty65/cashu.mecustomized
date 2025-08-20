<template>
  <q-page class="q-pa-md welcome">
    <div class="q-mb-md">
      <q-toggle v-model="guided" label="Guided setup" />
    </div>
    <div v-if="guided">
      <WelcomeStepper />
    </div>
    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <TaskChecklist
          :tasks="tasks"
          :progress="progressLabel"
          :can-finish="welcome.canFinish"
          @run="runTask"
          @finish="finish"
        />
      </div>
      <div class="col-12 col-md-8">
        <LearnCards />
      </div>
    </div>
    <TaskModalIdentity v-if="!guided" v-model="showIdentity" />
    <TaskModalMint v-if="!guided" v-model="showMint" />
    <TaskModalAddSats v-if="!guided" v-model="showAddSats" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import TaskChecklist from 'src/components/welcome/TaskChecklist.vue'
import LearnCards from 'src/components/welcome/LearnCards.vue'
import TaskModalIdentity from 'src/components/welcome/TaskModalIdentity.vue'
import TaskModalMint from 'src/components/welcome/TaskModalMint.vue'
import TaskModalAddSats from 'src/components/welcome/TaskModalAddSats.vue'
import WelcomeStepper from 'src/components/welcome/WelcomeStepper.vue'
import { useWelcomeStore } from 'src/stores/welcome'
import type { WelcomeTask } from 'src/types/welcome'

const router = useRouter()
const welcome = useWelcomeStore()

const showIdentity = ref(false)
const showMint = ref(false)
const showAddSats = ref(false)
const guided = ref(localStorage.getItem('cashu.welcome.guided') === 'true')
watch(guided, v => localStorage.setItem('cashu.welcome.guided', String(v)))

const tasks = computed<WelcomeTask[]>(() => [
  {
    id: 'identity',
    icon: 'badge',
    title: 'Set up your Nostr Identity',
    desc: 'Use NIP-07, generate a new key, or import nsec.',
    done: () => welcome.hasIdentity,
    ctas: [],
  },
  {
    id: 'mint',
    icon: 'account_balance',
    title: 'Pick a Mint',
    desc: 'A mint bridges Lightning ↔ ecash. You can switch anytime.',
    done: () => welcome.hasMint,
    ctas: [],
  },
  {
    id: 'sats',
    icon: 'add_circle',
    title: 'Add sats (optional)',
    desc: 'Deposit via Lightning or paste a token.',
    optional: true,
    done: () => welcome.balanceSats > 0,
    ctas: [],
  },
])

const progressLabel = computed(() => {
  const required = tasks.value.filter(t => !t.optional)
  const done = required.filter(t => t.done()).length
  return `${done}/${required.length} required steps`
})

function runTask(task: WelcomeTask) {
  switch (task.id) {
    case 'identity':
      showIdentity.value = true
      break
    case 'mint':
      showMint.value = true
      break
    case 'sats':
      showAddSats.value = true
      break
  }
}

function finish() {
  welcome.markWelcomeCompleted()
  router.push('/wallet')
}
</script>
