<!--
  アイテムのラッパコンポーネント

  「そのアイテムを閲覧したか」を判定するためのラッパ
-->

<script setup lang="ts">
import { Item } from '../types/types'

// props
const props = defineProps<{
  item: Item
}>()

// emit
type Emits = {
  (e: 'intersect', item: Item): void
}
const emit = defineEmits<Emits>()

// data
/** 監視用名 */
const observName = ref<string>('')
/** 要素が描画内にあるか */
const isIntersecting = ref<boolean>(false)

// created
observName.value = `item-${props.item.rowId}`

// methods
/** 監視登録処理 */
const register = (): void => {
  if (!window) {
    return
  }
  const element = document.getElementById(observName.value)
  if (!element) {
    return
  }
  const handler = (entries: { isIntersecting: boolean }[]): void => {
    isIntersecting.value = entries[0].isIntersecting
  }
  const observer = new window.IntersectionObserver(handler, {
    threshold: 1.0
  })
  observer.observe(element)
}

/** 描画範囲内かどうか */
const isViewing = (element: Element): boolean => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
  )
}

// watch
const { item } = toRefs(props)
watch(item, (item) => {
  const element = document.getElementById(observName.value)
  if (!element) { return }
  if (isViewing(element)) {
    emit('intersect', item)
  }
})

watch(isIntersecting, (isIntersecting) => {
  if (isIntersecting) {
    emit('intersect', props.item)
  }
})

// mounted
onMounted(() => {
  register()
})
</script>

<template>
  <div :id="observName">
    <slot />
  </div>
</template>
