<!--
  要素サイズに応じて調整されるグリッドビューコンポーネント

  https://github.com/e-oj/vue-magic-grid
-->

<script setup lang="ts">
interface Column {
  height: number
  top: number
  index: number
}

// props: https://ja.vuejs.org/api/sfc-script-setup.html#defineprops-defineemits
/**
 * Props: コンポーネントを呼び出されたときに渡されるプロパティ
 *
 * @param wrapper このコンテナーのクラス名。デフォルト: wrapper
 * @param gap アイテム間のスペース (px)。デフォルト: 32px
 * @param maxCols 最大列数。デフォルト: 5
 * @param maxColWidth 最大列幅 (px)。デフォルト: 280px
 * @param animate アニメーションを有効にするか。デフォルト: false
 * @param useMin 下側の列を整頓するか。デフォルト: false
 */
const props = defineProps({
  wrapper: {
    type: String,
    default: 'wrapper'
  },
  gap: {
    type: Number,
    default: 32
  },
  maxCols: {
    type: Number,
    default: 5
  },
  maxColWidth: {
    type: Number,
    default: 280
  },
  animate: {
    type: Boolean,
    default: true
  },
  useMin: {
    type: Boolean,
    default: false
  }
})

// --- data
/** 要素の待ちフェーズが終わり、初期化フェーズに入ったかどうか */
const started = ref(false)
/** アイテムの配列 */
const items = ref<HTMLCollection | null>(null)

// refs: https://www.memory-lovers.blog/entry/2022/06/07/143000
/** 要素アクセス用 ref */
const gridelement = ref<HTMLElement>()

// --- methods
/**
 * 要素が準備できているかどうか
 *
 * @returns 要素が準備できているかどうか
 */
const isReady = (): boolean => {
  return (
    !!gridelement.value &&
    !!items.value &&
    items.value.length > 0 &&
    items.value[0].getBoundingClientRect().width > 0
  )
}

/**
 * 初期化処理
 */
const init = (): void => {
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

/**
 * 要素が準備できるまで待つ
 */
const getReady = (): void => {
  const interval = setInterval(() => {
    const children = gridelement.value?.children
    items.value = children || null

    if (isReady()) {
      clearInterval(interval)
      init()
    }
  }, 100)
}

/**
 * アイテムの幅を取得
 */
const colWidth = (): number => {
  if (!items.value) {
    return 0 // ほんとに？
  }
  return items.value[0].getBoundingClientRect().width + props.gap
}

/**
 * セットアップ処理
 */
const setup = (): {
  cols: Column[]
  wSpace: number
} => {
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

/** 最小の列を取得 */
const getMinColumn = (cols: Column[]): Column => {
  let min = cols[0]

  for (const col of cols) {
    if (col.height < min.height) { min = col }
  }

  return min
}

/** 最大の列を取得 */
const getMaxColumn = (cols: Column[]): Column => {
  let max = cols[0]

  for (const col of cols) {
    if (col.height > max.height) { max = col }
  }

  return max
}

/** 次の列を取得 */
const nextCol = (cols: Column[], i: number): Column => {
  if (props.useMin) { return getMinColumn(cols) }

  return cols[i % cols.length]
}

/**
 * アイテムの位置を設定
 */
const positionItems = (): void => {
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

  (gridelement.value as HTMLElement).style.height = getMaxColumn(cols).height + 'px'
}

/**
 * 要素が準備できるまで待つ
 */
const waitUntilReady = (): void => {
  if (isReady()) {
    started.value = true
    positionItems()

    window.addEventListener('resize', () => {
      setTimeout(() => positionItems(), 200)
    })
  } else { getReady() }
}

// --- onMounted
onMounted(() => {
  waitUntilReady()
})

// --- expose
/**
 * アイテムの位置を更新
 */
const update = (): void => {
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
