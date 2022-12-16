<script setup lang="ts">
import { defineProps, ref, watch, toRefs } from 'vue'
import { Target } from '../types/types'

// --- emits
interface Emits {
  (e: 'updated', newValue: Target[]): void
}
const emit = defineEmits<Emits>()

// --- props
/**
 * Props: コンポーネントを呼び出されたときに渡されるプロパティ
 *
 * @param targets ターゲットの配列
 * @param loading ローディング中かどうか
 */
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

// --- data
/** 選択されたターゲット */
const selected = ref<Target[]>([])
const timer = ref<number>(0)

// --- watch
// propsの特定のキーをwatchする場合はtoRefでリアクティブ取出する: https://zenn.dev/tentel/articles/e52815dd33f328
const { targets } = toRefs(props)
/**
 * 対象一覧が更新された時にすべてのターゲットを選択状態にする
 */
watch(targets, (val) => {
  selected.value = val
})

/**
 * 選択されたターゲットが更新された時に親コンポーネントに通知する。
 * 連続して変更された場合のために、2秒後にemitする
 */
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
