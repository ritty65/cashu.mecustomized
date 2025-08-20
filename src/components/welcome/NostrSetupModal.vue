<template>
  <q-dialog v-model="model" persistent>
    <div class="bg-slate-800 rounded-xl shadow-lg ring-1 ring-slate-700/60 max-w-lg w-full">
      <div class="flex items-center justify-between px-5 py-4">
        <div>
          <h3 class="text-base font-semibold text-slate-100">Nostr Identity</h3>
          <p class="text-xs text-slate-400">Generate or import your key; manage relays & optional Lightning Address.</p>
        </div>
        <button
          class="text-slate-400 hover:text-slate-100 text-xl leading-none"
          @click="close"
          aria-label="Close"
        >&times;</button>
      </div>
      <div class="px-5 pb-5 space-y-6 overflow-y-auto" style="max-height:80vh">
        <section class="rounded-lg bg-slate-900/40 ring-1 ring-slate-700/60 p-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-200">Quick start — generate a new key</h4>
            <button
              id="btn-generate-nostr-key"
              class="rounded-md bg-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
              @click="generate"
            >
              Generate
            </button>
          </div>
          <div v-if="generated" class="mt-4 space-y-3">
            <div>
              <label class="text-[11px] uppercase tracking-wide text-slate-400">Public key (npub)</label>
              <div class="mt-1 flex items-center gap-2 rounded-md bg-slate-900/80 ring-1 ring-slate-700/60 px-3 py-2">
                <code id="npub-display" class="text-xs text-slate-200 truncate">{{ npub }}</code>
                <button
                  id="copy-npub"
                  class="ml-auto text-[11px] rounded bg-slate-700/70 px-2 py-1 text-slate-200 hover:bg-slate-700"
                  @click="copy(npub)"
                >
                  Copy
                </button>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="text-[11px] uppercase tracking-wide text-slate-400">Private key (nsec)</label>
                <div class="mt-1">
                  <div
                    v-if="!showNsec"
                    class="flex items-center justify-between rounded-md bg-slate-900/80 ring-1 ring-slate-700/60 px-3 py-2"
                  >
                    <span class="text-xs text-slate-400">Tap to reveal</span>
                    <button
                      id="reveal-nsec"
                      class="text-[11px] rounded bg-rose-500/10 px-2 py-1 text-rose-300 hover:bg-rose-500/20"
                      @click="showNsec = true"
                    >
                      Reveal
                    </button>
                  </div>
                  <div v-else>
                    <div class="flex items-center gap-2 rounded-md bg-slate-900/80 ring-1 ring-slate-700/60 px-3 py-2">
                      <code id="nsec-display" class="text-xs text-slate-200 break-all">{{ nsec }}</code>
                      <button
                        id="copy-nsec"
                        class="ml-auto text-[11px] rounded bg-rose-500/10 px-2 py-1 text-rose-300 hover:bg-rose-500/20"
                        @click="copy(nsec)"
                      >
                        Copy
                      </button>
                    </div>
                    <p class="mt-1 text-[11px] text-rose-400">
                      Anyone with this key can post and decrypt as you. Store it offline.
                    </p>
                  </div>
                </div>
              </div>
              <div class="sm:col-span-1">
                <div class="h-full w-full rounded-md bg-slate-900/80 ring-1 ring-slate-700/60 flex items-center justify-center p-3">
                  <img :src="qrSrc" alt="npub QR" class="rounded" />
                </div>
                <p class="mt-1 text-[11px] text-slate-500 text-center">Share your npub QR.</p>
              </div>
            </div>
            <label class="mt-2 inline-flex items-start gap-2">
              <input
                id="ack-nostr-backup"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                v-model="ack"
              />
              <span class="text-xs text-slate-300">I stored my Nostr private key safely.</span>
            </label>
            <button
              id="btn-save-nostr-key"
              class="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-700 disabled:text-slate-400"
              :disabled="!ack"
              @click="saveGenerated"
            >
              Save identity
            </button>
          </div>
        </section>
        <section class="rounded-lg bg-slate-900/40 ring-1 ring-slate-700/60 p-4">
          <h4 class="text-sm font-semibold text-slate-200">Import existing key</h4>
          <input
            id="nostr-import-input"
            type="text"
            v-model="impInput"
            placeholder="Paste nsec1… or 64‑char hex"
            class="mt-2 w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700/60 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
          />
          <p
            id="nostr-import-error"
            class="mt-1 text-[11px] text-rose-400"
            v-if="impInput && !impValid"
          >
            Invalid key format.
          </p>
          <div class="mt-3">
            <label class="text-[11px] uppercase tracking-wide text-slate-400">Derived npub</label>
            <div class="mt-1 rounded-md bg-slate-900/80 ring-1 ring-slate-700/60 px-3 py-2">
              <code id="nostr-import-npub" class="text-xs text-slate-300 truncate">{{ impNpub }}</code>
            </div>
          </div>
          <button
            id="btn-import-nostr-key"
            class="mt-3 w-full rounded-lg bg-slate-700/80 px-4 py-2 text-sm font-semibold text-slate-100 disabled:bg-slate-700/40 disabled:text-slate-500"
            :disabled="!impValid"
            @click="importKey"
          >
            Import & save
          </button>
        </section>
        <section class="rounded-lg bg-slate-900/40 ring-1 ring-slate-700/60 p-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-200">Relays (optional)</h4>
            <button
              id="btn-add-relay"
              class="rounded-md bg-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
              @click="addRelay"
            >
              Add relay
            </button>
          </div>
          <div id="relays-list" class="mt-3 space-y-2">
            <div v-for="(relay, i) in relays" :key="i" class="flex items-center gap-2">
              <input
                type="text"
                v-model="relays[i]"
                placeholder="wss://relay.example.com"
                class="w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700/60 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                class="text-[11px] rounded bg-slate-700/70 px-2 py-1 text-slate-200 hover:bg-slate-700"
                @click="removeRelay(i)"
              >
                Remove
              </button>
            </div>
          </div>
          <p class="mt-2 text-[11px] text-slate-500">Tip: 3–6 relays is plenty for most users.</p>
        </section>
        <section class="rounded-lg bg-slate-900/40 ring-1 ring-slate-700/60 p-4">
          <h4 class="text-sm font-semibold text-slate-200">Lightning Address (optional)</h4>
          <div class="mt-2 flex items-center gap-2">
            <input
              id="lnaddr-input"
              type="text"
              v-model="lnaddr"
              placeholder="you@npub.cash"
              class="w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700/60 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              id="btn-link-lnaddr"
              class="rounded-md bg-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
              @click="linkLnaddr"
            >
              Link
            </button>
          </div>
          <p class="mt-1 text-[11px] text-slate-500">Helps others tip you easily.</p>
        </section>
        <div class="flex items-center justify-between">
          <button class="text-xs text-slate-400 hover:text-slate-200 underline" @click="close">Skip for now</button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            @click="close"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWelcomeStore } from 'src/stores/welcome'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const model = ref(props.modelValue)
watch(
  () => props.modelValue,
  v => {
    model.value = v
  },
)
watch(model, v => emit('update:modelValue', v))

const welcome = useWelcomeStore()

const generated = ref(false)
const npub = ref('')
const nsec = ref('')
const showNsec = ref(false)
const ack = ref(false)
const qrSrc = computed(() =>
  npub.value
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(npub.value)}`
    : 'https://placehold.co/140x140/1f2937/ffffff?text=npub+QR',
)

const impInput = ref('')
const impValid = computed(() =>
  /^nsec1[qpzry9x8gf2tvdw0s3jn54khce6mua]{10,}$/i.test(impInput.value.trim()) ||
  /^[0-9a-fA-F]{64}$/.test(impInput.value.trim()),
)
const impNpub = computed(() => (impValid.value ? mockNpub() : '—'))

const relays = ref<string[]>(['wss://relay.example.com'])
const lnaddr = ref('')

function rand(len = 20) {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567'
  return Array(len)
    .fill(0)
    .map(() => chars.charAt(Math.floor(Math.random() * 32)))
    .join('')
}
function mockNpub() {
  return `npub1${rand(58)}`
}
function mockNsec() {
  return `nsec1${rand(58)}`
}

function generate() {
  npub.value = mockNpub()
  nsec.value = mockNsec()
  generated.value = true
  showNsec.value = false
  ack.value = false
}
function copy(v: string) {
  navigator.clipboard.writeText(v)
}
function saveGenerated() {
  welcome.markNostrSetupComplete()
  close()
}
function importKey() {
  welcome.markNostrSetupComplete()
  close()
}
function addRelay() {
  relays.value.push('')
}
function removeRelay(i: number) {
  relays.value.splice(i, 1)
}
function linkLnaddr() {
  if (lnaddr.value && lnaddr.value.includes('@')) alert('Lightning Address linked.')
  else alert('Enter a valid Lightning Address (you@domain.tld)')
}
function close() {
  model.value = false
}
</script>
