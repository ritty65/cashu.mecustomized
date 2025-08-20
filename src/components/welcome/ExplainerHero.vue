<template>
  <section id="explainer-hero" class="max-w-3xl mx-auto">
    <div class="bg-slate-800/80 ring-1 ring-slate-700/60 rounded-xl shadow-sm">
      <div class="px-5 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-lg md:text-xl font-semibold text-slate-100">Welcome</h1>
          <p class="text-sm text-slate-400">Get set up in about 2 minutes.</p>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-2.5 py-1"
          >
            <span class="inline-block h-2 w-2 rounded-full bg-emerald-400/80"></span>
            Guided setup
          </span>
        </div>
      </div>
      <div class="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="rounded-lg bg-slate-900/40 ring-1 ring-slate-700/60 p-4">
          <h2 class="text-sm font-semibold text-slate-200">What this app does</h2>
          <ul class="mt-3 space-y-2 text-sm text-slate-400">
            <li class="flex gap-2">
              <svg
                class="h-5 w-5 text-emerald-400/90 flex-none"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7 7h10v10H7z" />
              </svg>
              Private ecash: spend &amp; share with privacy using blind signatures.
            </li>
            <li class="flex gap-2">
              <svg
                class="h-5 w-5 text-blue-400/90 flex-none"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Lightning in/out: deposit with an LN invoice; pay LN invoices from your tokens.
            </li>
            <li class="flex gap-2">
              <svg
                class="h-5 w-5 text-violet-400/90 flex-none"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18m9-9H3" />
              </svg>
              Nostr identity: pseudonymous key for subscriptions, DMs, and optional Lightning Address.
            </li>
          </ul>
        </div>
        <div class="rounded-lg bg-slate-900/40 ring-1 ring-slate-700/60 p-4">
          <h2 class="text-sm font-semibold text-slate-200">Setup at a glance</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <span
                class="mt-0.5 inline-block h-2 w-2 rounded-full"
                :class="welcome.nostrReady ? 'bg-emerald-400/90' : 'bg-emerald-400/40'"
              ></span>
              <div>
                <p class="text-slate-200">Set up your Nostr Identity</p>
                <p class="text-slate-400 text-xs">Use npub, generate a new key, or import nsec.</p>
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span
                class="mt-0.5 inline-block h-2 w-2 rounded-full"
                :class="welcome.hasMint ? 'bg-blue-400/90' : 'bg-blue-400/40'"
              ></span>
              <div>
                <p class="text-slate-200">Pick a Mint</p>
                <p class="text-slate-400 text-xs">A mint bridges Lightning ↔ ecash. You can switch anytime.</p>
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span
                class="mt-0.5 inline-block h-2 w-2 rounded-full"
                :class="welcome.balanceSats > 0 ? 'bg-slate-500/90' : 'bg-slate-500/40'"
              ></span>
              <div>
                <p class="text-slate-200">Add sats (optional)</p>
                <p class="text-slate-400 text-xs">Deposit via Lightning or paste a token.</p>
              </div>
            </li>
          </ul>
          <div class="mt-4 flex items-center justify-between">
            <p class="text-xs text-slate-500">{{ progressLabel }}</p>
            <button
              id="btn-get-started"
              @click="$emit('get-started')"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              Get started
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.293 5.293a1 1 0 011.414 0L18 9.586a2 2 0 010 2.828l-4.293 4.293a1 1 0 01-1.414-1.414L14.586 12H4a1 1 0 110-2h10.586l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWelcomeStore } from 'src/stores/welcome'

defineEmits<{ (e: 'get-started'): void }>()

const welcome = useWelcomeStore()

const progressLabel = computed(() => {
  const required = [welcome.nostrReady, welcome.hasMint]
  const done = required.filter(Boolean).length
  return `${done}/${required.length} required steps`
})
</script>
