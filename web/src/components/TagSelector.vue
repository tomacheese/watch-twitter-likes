<!-- ハッシュタグ選択コンポーネント -->

<script setup lang="ts">
import { Item } from '../types/types'

// --- emits
interface Emits {
  (e: 'updated', newValue: string): void
}
const emit = defineEmits<Emits>()

// --- data
/** 選択中のハッシュタグ */
const selected = ref<string[]>([])
/** ハッシュタグ一覧 */
const tags = ref<string[]>([])

// --- props
const props = defineProps({
  /** アイテム一覧 */
  items: {
    type: Array as () => Item[],
    required: true
  }
})

// --- watch
const { items: itemsRef } = toRefs(props)
watch(itemsRef, () => {
  tags.value = props.items.map((tweet) => tweet.tweet.tags).flat().filter((tag, index, self) => self.indexOf(tag) === index)
})

watch(selected, () => {
  emit('updated', selected.value.join('\t'))
})

// --- mounted
onMounted(() => {
  tags.value = props.items.map((tweet) => tweet.tweet.tags).flat().filter((tag, index, self) => self.indexOf(tag) === index)
  emit('updated', selected.value.join('\t'))
})
</script>

<template>
  <v-autocomplete
    v-model="selected"
    :items="tags"
    :menu-props="{ maxHeight: '400' }"
    label="ハッシュタグ (OR 検索)"
    multiple
    chips
    clearable
    hide-no-data
    hide-details
  />
</template>
