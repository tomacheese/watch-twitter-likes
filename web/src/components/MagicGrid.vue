<!-- https://github.com/e-oj/vue-magic-grid -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Column {
  height: number
  top: number
  index: number
}

// props: https://ja.vuejs.org/api/sfc-script-setup.html#defineprops-defineemits
const props = defineProps({
  wrapper: {
    type: String, // Required. Class or id of the container.
    default: 'wrapper'
  },
  gap: {
    type: Number, // Optional. Space between items. Default: 32px
    default: 32
  },
  maxCols: {
    type: Number, // Maximum number of colums. Default: Infinite
    default: 5
  },
  maxColWidth: {
    type: Number,
    default: 280
  },
  animate: {
    type: Boolean, // Animate item positioning. Default: false.
    default: true
  },
  useMin: {
    type: Boolean, // Place items in lower column
    default: false
  }
})

// data
const started = ref(false)
const items = ref<HTMLCollection | null>(null)

// refs: https://www.memory-lovers.blog/entry/2022/06/07/143000
const gridelement = ref<HTMLElement>()

// methods
const isReady = () => {
  console.log(
    '[DEBUG] isReady()',
    gridelement.value &&
    !!items.value,
    items.value ? items.value?.length : undefined,
    items.value && items.value.length > 0
      ? items.value[0].getBoundingClientRect().width
      : undefined
  )
  return (
    gridelement.value &&
    !!items.value &&
    items.value.length > 0 &&
    items.value[0].getBoundingClientRect().width > 0
  )
}

const init = () => {
  console.log('[DEBUG] init()', isReady(), started.value)
  if (!isReady() || started.value) {
    return
  } (gridelement.value as HTMLElement).style.position = 'relative'

  Array.prototype.forEach.call(items.value, (item) => {
    item.style.position = 'absolute'
    item.style.maxWidth = props.maxColWidth + 'px'
    if (props.animate) { item.style.transition = 'top, left 0.2s ease' }
  })

  waitUntilReady()
}

const getReady = () => {
  console.log('[DEBUG] getReady()')
  const interval = setInterval(() => {
    const children = gridelement.value?.children
    items.value = children || null

    if (isReady()) {
      console.log('[DEBUG] ready')
      clearInterval(interval)
      init()
    }
  }, 100)
}
const colWidth = () => {
  if (!items.value) {
    return 0 // ほんとに？
  }
  return items.value[0].getBoundingClientRect().width + props.gap
}

const setup = () => {
  console.log(
    '[DEBUG] setup::$el.getBoundingClientRect().width: ',
    gridelement.value?.getBoundingClientRect().width
  )
  const width = gridelement.value?.getBoundingClientRect().width
  if (!width) {
    throw new Error('MagicGrid: Wrapper element not found.')
  }
  let numCols = Math.floor(width / colWidth()) || 1
  const cols = []

  if (props.maxCols && numCols > props.maxCols) {
    numCols = props.maxCols
  }

  for (let i = 0; i < numCols; i++) {
    cols[i] = {
      height: 0,
      top: 0,
      index: i
    }
  }

  const wSpace = width - numCols * colWidth() + props.gap

  return {
    cols,
    wSpace
  }
}

const getMin = (cols: any[]) => {
  let min = cols[0]

  for (const col of cols) {
    if (col.height < min.height) { min = col }
  }

  return min
}

const getMax = (cols: any[]) => {
  let max = cols[0]

  for (const col of cols) {
    if (col.height > max.height) { max = col }
  }

  return max
}

const nextCol = (cols: Column[], i: number) => {
  if (props.useMin) { return getMin(cols) }

  return cols[i % cols.length]
}

const positionItems = () => {
  const { cols, wSpace: _wSpace } = setup()

  const wSpace = Math.floor(_wSpace / 2)

  if (!items.value) {
    throw new Error('MagicGrid: Items not found.')
  }

  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i] as HTMLElement
    const min = nextCol(cols, i)
    const left = min.index * colWidth() + wSpace

    item.style.left = left + 'px'
    item.style.top = min.height + min.top + 'px'

    min.height += min.top + item.getBoundingClientRect().height
    min.top = props.gap
  }

  (gridelement.value as HTMLElement).style.height = getMax(cols).height + 'px'
}

const waitUntilReady = () => {
  console.log('[DEBUG] waitUntilReady()', isReady())

  if (isReady()) {
    started.value = true
    positionItems()

    window.addEventListener('resize', () => {
      setTimeout(() => positionItems(), 200)
    })
  } else { getReady() }
}

// onMounted
onMounted(() => {
  waitUntilReady()
})

// expose
const update = () => {
  console.log('[DEBUG] update()')
  started.value = false
  items.value = null
  waitUntilReady()
}

defineExpose({ update })

</script>

<template>
  <div ref="gridelement" :class="[wrapper]">
    <slot />
  </div>
</template>
