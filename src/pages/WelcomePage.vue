<template>
  <q-page class="q-pa-md welcome">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <TaskChecklist
          :tasks="tasks"
          :progress="progressLabel"
          :can-finish="canFinish"
          @run="runTask"
          @finish="finish"
        />
      </div>
      <div class="col-12 col-md-8">
        <WelcomeSlides />
      </div>
    </div>

    <CreateKeyDialog v-model="showCreateKey" @done="onKeyCreated" />
    <BackupDialog v-model="showBackup" @done="onBackupDone" />
    <ChooseMintDrawer v-model="showChooseMint" @done="onMintChosen" />
    <DepositDialog v-model="showDeposit" @done="onDepositPaid" />
    <TestSendDialog v-model="showTestSend" @done="onTestSendOk" />
    <RoleDialog v-model="showRole" @selected="onRoleSelected" />
    <CreatorSetupDialog v-if="welcome.role === 'creator'" v-model="showCreator" @done="onCreatorDone" />
    <BucketQuickstartDialog v-model="showBucketIntro" @done="onBucketDone" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWelcomeStore } from 'src/stores/welcome'
import type { WelcomeTask } from 'src/types/welcome'

import TaskChecklist from 'src/components/welcome/TaskChecklist.vue'
import WelcomeSlides from 'src/components/welcome/WelcomeSlides.vue'
import PlaceholderDialog from 'src/components/welcome/PlaceholderDialog.vue'

const CreateKeyDialog = PlaceholderDialog
const BackupDialog = PlaceholderDialog
const ChooseMintDrawer = PlaceholderDialog
const DepositDialog = PlaceholderDialog
const TestSendDialog = PlaceholderDialog
const RoleDialog = PlaceholderDialog
const CreatorSetupDialog = PlaceholderDialog
const BucketQuickstartDialog = PlaceholderDialog

const router = useRouter()
const { t } = useI18n()
const welcome = useWelcomeStore()

const testSendDone = ref(false)
const bucketDone = ref(false)

function buildTasks(store: ReturnType<typeof useWelcomeStore>): WelcomeTask[] {
  return [
    {
      id: 'create-key',
      icon: 'vpn_key',
      title: t('welcome.tasks.createKey.title'),
      desc: t('welcome.tasks.createKey.desc'),
      done: () => store.hasKey,
      ctas: [],
    },
    {
      id: 'backup',
      icon: 'save',
      title: t('welcome.tasks.backup.title'),
      desc: t('welcome.tasks.backup.desc'),
      requires: ['create-key'],
      done: () => store.hasBackup,
      ctas: [],
    },
    {
      id: 'pick-mint',
      icon: 'account_balance',
      title: t('welcome.tasks.chooseMint.title'),
      desc: t('welcome.tasks.chooseMint.desc'),
      done: () => store.hasMint,
      ctas: [],
    },
    {
      id: 'deposit',
      icon: 'add_circle',
      title: t('welcome.tasks.deposit.title'),
      desc: t('welcome.tasks.deposit.desc'),
      optional: true,
      requires: ['pick-mint'],
      done: () => store.hasBalance,
      ctas: [],
    },
    {
      id: 'test-send',
      icon: 'send',
      title: t('welcome.tasks.testSend.title'),
      desc: t('welcome.tasks.testSend.desc'),
      done: () => testSendDone.value,
      ctas: [],
    },
    {
      id: 'choose-role',
      icon: 'person_search',
      title: t('welcome.tasks.role.title'),
      desc: t('welcome.tasks.role.desc'),
      done: () => store.role !== null,
      ctas: [],
    },
    {
      id: 'creator-setup',
      icon: 'badge',
      title: t('welcome.tasks.creatorSetup.title'),
      desc: t('welcome.tasks.creatorSetup.desc'),
      requires: ['choose-role'],
      done: () => store.hasProfile,
      ctas: [],
      optional: false,
    },
    {
      id: 'bucket-quickstart',
      icon: 'inventory_2',
      title: t('welcome.tasks.buckets.title'),
      desc: t('welcome.tasks.buckets.desc'),
      optional: true,
      done: () => bucketDone.value,
      ctas: [],
    },
  ].filter((t) => (store.role === 'creator' ? true : t.id !== 'creator-setup'))
}

const tasks = computed<WelcomeTask[]>(() => buildTasks(welcome))

const progressLabel = computed(() => {
  const required = tasks.value.filter((t) => !t.optional)
  const done = required.filter((t) => t.done()).length
  return t('welcome.taskList.progress', { done, total: required.length })
})

const canFinish = computed(() => {
  const required = tasks.value.filter((t) => !t.optional)
  return required.every((t) => t.done())
})

function runTask(task: WelcomeTask) {
  switch (task.id) {
    case 'create-key':
      showCreateKey.value = true
      break
    case 'backup':
      showBackup.value = true
      break
    case 'pick-mint':
      showChooseMint.value = true
      break
    case 'deposit':
      showDeposit.value = true
      break
    case 'test-send':
      showTestSend.value = true
      break
    case 'choose-role':
      showRole.value = true
      break
    case 'creator-setup':
      showCreator.value = true
      break
    case 'bucket-quickstart':
      showBucketIntro.value = true
      break
  }
}

function finish() {
  welcome.markWelcomeCompleted()
  router.push('/wallet')
}

const showCreateKey = ref(false)
const showBackup = ref(false)
const showChooseMint = ref(false)
const showDeposit = ref(false)
const showTestSend = ref(false)
const showRole = ref(false)
const showCreator = ref(false)
const showBucketIntro = ref(false)

function onKeyCreated() {
  showCreateKey.value = false
  showBackup.value = true
}
function onBackupDone() {
  showBackup.value = false
}
function onMintChosen() {
  showChooseMint.value = false
}
function onDepositPaid() {
  showDeposit.value = false
}
function onTestSendOk() {
  testSendDone.value = true
  showTestSend.value = false
}
function onRoleSelected(role?: any) {
  if (role) welcome.setRole(role)
  showRole.value = false
}
function onCreatorDone() {
  showCreator.value = false
}
function onBucketDone() {
  bucketDone.value = true
  showBucketIntro.value = false
}
</script>
