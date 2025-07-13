<template>
  <q-dialog v-model="showLocal" persistent>
    <q-card class="q-pa-lg" style="max-width: 600px; width: 100%">
      <q-card-section>
        <h6 class="q-mt-none q-mb-md">
          {{ t('bucketManager.addDialog.title') }}
        </h6>
        <div class="text-body2 q-mb-md">
          {{ t('BucketManager.helper.intro') }}
        </div>
      </q-card-section>
      <q-form ref="formRef" @submit.prevent="save" class="q-gutter-sm">
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-input v-model="form.name" outlined :rules="nameRules" class="q-mb-sm">
              <template #label>
                <div class="row items-center no-wrap">
                  <span>{{ t('bucket.name') }}</span>
                  <InfoTooltip class="q-ml-xs" :text="t('BucketManager.tooltips.name')" />
                </div>
              </template>
            </q-input>
          </div>
          <div class="col-6">
            <q-color v-model="form.color" format="hex" class="q-mb-sm">
              <template #label>
                <div class="row items-center no-wrap">
                  <span>{{ t('bucket.color') }}</span>
                  <InfoTooltip class="q-ml-xs" :text="t('BucketManager.tooltips.color')" />
                </div>
              </template>
            </q-color>
          </div>
        </div>
        <q-input
          v-model.number="form.goal"
          type="number"
          :rules="goalRules"
          outlined
          class="q-mb-sm"
        >
          <template #label>
            <div class="row items-center no-wrap">
              <span>{{ t('bucket.goal') }}</span>
              <InfoTooltip class="q-ml-xs" :text="t('BucketManager.tooltips.goal')" />
            </div>
          </template>
        </q-input>
        <q-input
          v-model="form.desc"
          type="textarea"
          autogrow
          outlined
          class="q-mb-sm"
        >
          <template #label>
            <div class="row items-center no-wrap">
              <span>{{ t('bucket.description') }}</span>
              <InfoTooltip class="q-ml-xs" :text="t('BucketManager.tooltips.description')" />
            </div>
          </template>
        </q-input>
        <q-card-actions align="right" class="q-mt-md">
          <q-btn color="primary" :disable="!canSave" @click="save">
            {{ t('global.actions.save.label') }}
          </q-btn>
          <q-btn flat color="grey" v-close-popup>
            {{ t('global.actions.cancel.label') }}
          </q-btn>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { QColor } from 'quasar'
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

watch(showLocal, val => {
  if (!val) reset()
})

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
