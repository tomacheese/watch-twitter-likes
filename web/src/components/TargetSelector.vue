<script setup lang="ts">
import { Target } from '../types/types'

// --- emits
interface Emits {
  (e: 'update:modelValue', val: Target[]): void
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
  },
  modelValue: {
    type: Array as () => Target[],
    required: true
  }
})

// --- watch
// propsの特定のキーをwatchする場合はtoRefでリアクティブ取出する: https://zenn.dev/tentel/articles/e52815dd33f328
const { targets } = toRefs(props)

/**
 * 選択されたターゲットが更新された時に親コンポーネントに通知する。
 */
const selected = computed({
  get: () => props.modelValue,
  set: (val: Target[]) => {
    emit('update:modelValue', val)
  }
})
</script>

<template>
  <v-select
    v-model="selected"
    :items="targets"
    :loading="loading"
    item-title="name"
    item-value="name"
    label="表示対象"
    return-object
    multiple
    chips
    hide-details
  />
</template>
