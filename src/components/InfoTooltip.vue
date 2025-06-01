<template>
  <q-icon name="info" size="1rem" color="grey" class="q-ml-xs">
    <q-tooltip>{{ text }}</q-tooltip>
  </q-icon>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InfoTooltip',
  props: {
    text: {
      type: String,
      required: true
    }
  }
})
</script>
