<template>
  <q-stepper v-model="step" flat animated>
    <q-step :name="1" title="Nostr Identity" :done="welcome.hasIdentity">
      <div class="q-pa-md">
        <div class="text-h4 text-weight-bold q-mb-md">Set up your Nostr identity</div>
        <TaskModalIdentity inline @done="nextIf(welcome.hasIdentity)" />
        <Coachmark title="What is Nostr?">
          Your npub is a pseudonymous identity used for tips, DMs, and Lightning Address. Keys never leave this device unless you opt in with NIP-07.
        </Coachmark>
        <div class="row justify-end q-mt-md">
          <q-btn color="primary" label="Next" :disable="!welcome.hasIdentity" @click="step = 2" />
        </div>
      </div>
    </q-step>
    <q-step :name="2" title="Choose a Mint" :done="welcome.hasMint">
      <div class="q-pa-md">
        <div class="text-h4 text-weight-bold q-mb-md">Choose a mint</div>
        <TaskModalMint inline @done="nextIf(welcome.hasMint)" />
        <Coachmark title="How mints work">
          You pay a Lightning invoice, the mint issues private ecash proofs to your device. On spend, proofs are swapped for new ones.
        </Coachmark>
        <div class="row justify-between q-mt-md">
          <q-btn flat label="Back" @click="step = 1" />
          <q-btn color="primary" label="Next" :disable="!welcome.hasMint" @click="step = 3" />
        </div>
      </div>
    </q-step>
    <q-step :name="3" title="Add sats (optional)" :done="welcome.balanceSats > 0">
      <div class="q-pa-md">
        <div class="text-h4 text-weight-bold q-mb-md">
          Add sats
          <span
            id="nostr-status-chip"
            :class="chipClass"
            >{{ welcome.nostrReady ? 'Nostr: Ready' : 'Nostr: Not set' }}</span
          >
        </div>
        <TaskModalAddSats inline />
        <Coachmark title="Optional">
          You can also skip now and fund later from the Wallet page.
        </Coachmark>
        <div class="row justify-between q-mt-md">
          <q-btn flat label="Back" @click="step = 2" />
          <q-btn color="primary" label="Finish" :disable="!welcome.canFinish" @click="finish" />
        </div>
      </div>
    </q-step>
  </q-stepper>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWelcomeStore } from 'src/stores/welcome'
import TaskModalIdentity from './TaskModalIdentity.vue'
import TaskModalMint from './TaskModalMint.vue'
import TaskModalAddSats from './TaskModalAddSats.vue'
import Coachmark from './Coachmark.vue'

const welcome = useWelcomeStore()
const router = useRouter()
const step = ref(1)

const chipClass = computed(() =>
  welcome.nostrReady
    ? 'ml-2 inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white'
    : 'ml-2 inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300',
)

function nextIf(cond: boolean) {
  if (cond) step.value++
}

function finish() {
  welcome.markWelcomeCompleted()
  router.push('/wallet')
}
</script>
