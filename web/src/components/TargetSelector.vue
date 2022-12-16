<script setup lang="ts">
import { defineProps, Ref, ref, watch, toRefs } from 'vue'
import { Target } from '../types/types'

// emits
interface Emits {
  (e: 'updated', newValue: Target[]): void
}
const emit = defineEmits<Emits>()

// props
const props = defineProps({
  targets: {
    type: Array as () => Target[],
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  }
})

// data
const selected: Ref<Target[]> = ref([])

// watch
// propsの特定のキーをwatchする場合はtoRefでリアクティブ取出する: https://zenn.dev/tentel/articles/e52815dd33f328
const { targets } = toRefs(props)
watch(targets, (val) => {
  selected.value = val
})

watch(selected, (val) => {
  emit('updated', val)
})
</script>

<template>
  <v-select
    v-model="selected"
    :items="targets"
    :loading="loading"
    item-title="name"
    item-value="name"
    label="Select targets"
    return-object
    multiple
  />
</template>
