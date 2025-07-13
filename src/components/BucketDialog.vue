<template>
  <q-dialog v-model="showLocal" persistent>
    <q-card class="q-pa-lg" style="max-width: 90vw">
      <q-form ref="formRef" @submit.prevent="save">
        <q-input
          v-model="form.name"
          :label="t('bucket.name')"
          :rules="nameRules"
          outlined
          class="q-mb-sm"
        />
        <q-input
          v-model="form.color"
          :label="t('bucket.color')"
          type="color"
          outlined
          class="q-mb-sm"
        />
        <q-input
          v-model.number="form.goal"
          :label="t('bucket.goal')"
          type="number"
          :rules="goalRules"
          outlined
          class="q-mb-sm"
        />
        <q-input
          v-model="form.desc"
          :label="t('bucket.description')"
          type="textarea"
          autogrow
          outlined
          class="q-mb-sm"
        />
        <div class="row q-mt-md">
          <q-btn
            color="primary"
            :disable="!canSave"
            @click="save"
          >
            {{ t('global.actions.save.label') }}
          </q-btn>
          <q-btn flat color="grey" class="q-ml-auto" v-close-popup>
            {{ t('global.actions.cancel.label') }}
          </q-btn>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBucketsStore } from 'stores/buckets'
import { DEFAULT_COLOR } from 'src/js/constants'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const showLocal = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  name: '',
  color: DEFAULT_COLOR,
  goal: null as number | null,
  desc: ''
})

const { t } = useI18n()
const buckets = useBucketsStore()
const formRef = ref(null)

const nameRules = [(v: string) => !!v || t('BucketManager.validation.name')]
const goalRules = [
  (v: number | null) => v === null || v >= 0 || t('BucketManager.validation.goal')
]

const canSave = ref(false)

watch(
  () => [form.name, form.goal],
  () => {
    canSave.value = formRef.value ? formRef.value.validate() : false
  },
  { immediate: true }
)

function reset () {
  form.name = ''
  form.color = DEFAULT_COLOR
  form.goal = null
  form.desc = ''
  formRef.value?.resetValidation()
}

async function save () {
  if (!(await formRef.value?.validate())) return
  buckets.addBucket({
    name: form.name,
    color: form.color,
    goal: form.goal ?? undefined,
    description: form.desc
  })
  emit('update:modelValue', false)
  reset()
}
</script>
