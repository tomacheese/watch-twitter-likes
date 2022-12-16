<script setup lang="ts">
import { defineProps, ref, watch, toRefs } from 'vue'
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
const selected = ref<Target[]>([])
const timer = ref<number>(0)

// watch
// propsの特定のキーをwatchする場合はtoRefでリアクティブ取出する: https://zenn.dev/tentel/articles/e52815dd33f328
const { targets } = toRefs(props)
watch(targets, (val) => {
  selected.value = val
})

// 連続して変更された場合のために、2秒後にemitする
watch(selected, (val) => {
  window.clearTimeout(timer.value)
  timer.value = window.setTimeout(() => {
    emit('updated', val)
  }, 2000)
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
