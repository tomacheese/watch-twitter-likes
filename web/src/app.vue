<script setup lang="ts">
import { Item, Target } from './types/types'
import ItemWrapper from './components/ItemWrapper.vue'
import { useViewedStore } from './store/viewed'
import { useSettingsStore } from './store/settings'
import { useTwitterStore } from './store/twitter'
import { useSnackbarStore } from './store/snackbar'

type TargetsApiResponse = Target[]
type ImagesApiResponse = Item[]

const config = useRuntimeConfig()

// --- store
const viewedStore = useViewedStore()
const settings = useSettingsStore()
const twitterStore = useTwitterStore()
const snackbarStore = useSnackbarStore()

// --- created
const viewedIds = [...viewedStore.getRowIds]

// --- data
/** アイテム一覧 */
const items = ref<ImagesApiResponse>([])
/** すべてのターゲット */
const targets = ref<Target[]>([])
/** 現在のページ */
const page = ref(1)
/** ローディング中かどうか */
const loading = ref(true)
/** 連続して選択が更新された時用のタイマー */
const timer = ref<number>(0)

// --- settings computed
const isAnd = computed({
  get: () => settings.isAnd,
  set: (val) => settings.setAnd(val)
})
const isOnlyNew = computed({
  get: () => settings.isOnlyNew,
  set: (val) => settings.setOnlyNew(val)
})
const { selected: selectedUserIds } = toRefs(settings)
const selected = computed({
  get: () => {
    const userIds = selectedUserIds.value
    if (userIds === null) {
      return targets.value
    }
    return targets.value.filter((target) => userIds.includes(target.userId))
  },
  set: (val) => {
    settings.setSelected(val)
  }
})
const selectTags = computed({
  get: () => settings.selectedTags,
  set: (val) => {
    if (!val) { throw new Error('val is undefined or null') }
    settings.setSelectedTags(val)
  }
})
const { magicGrid: magicGridSettings } = toRefs(settings)

// --- refs
/** MagicGrid.update() アクセス用 ref */
const magicgrid = ref()

// --- methods
/** MagicGrid.update() を遅延実行する */
const updateMagicGrid = (): void => {
  setTimeout(() => {
    magicgrid.value?.update()
  }, 100)
}

/** トップにスクロールする */
const scrollToTop = (): void => {
  window.scroll({ top: 0, behavior: 'smooth' })
}

/** 対象一覧をAPIから取得する */
const fetchTargets = async (): Promise<void> => {
  loading.value = true
  const response = await useFetch<TargetsApiResponse>(
    `${config.public.apiBaseURL}/targets`
  )
  if (response.error.value) {
    snackbarStore.start(`表示対象一覧の取得に失敗しました: ${response.error.value}`, 'error', response.error.value)
    return
  }
  if (!response.data.value) {
    return
  }
  targets.value = response.data.value
  loading.value = false
}

/** アイテム一覧をAPIから取得する */
const fetchItems = async (): Promise<void> => {
  if (selected.value.length === 0) {
    items.value = []
    return
  }
  loading.value = true
  const response = await useFetch<ImagesApiResponse>(
    `${config.public.apiBaseURL}/images`,
    {
      params: {
        targetIds: selected.value.map((s) => s.userId).join(','),
        type: isAnd.value ? 'and' : 'or'
      }
    }
  )
  if (response.error.value) {
    alert(`Error: "Failed to fetch images: ${response.error.value}`)
    return
  }
  if (!response || !response.data.value) {
    return
  }
  const results = response.data.value.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  items.value = results
  loading.value = false
}

/** 既読状態をアップデートする */
const onViewed = (item: Item): void => {
  viewedStore.add(item.rowId)
}

// --- computed
/** すべてのアイテム一覧 */
const getItems = computed(() => {
  let filterItems = items.value
  if (isOnlyNew.value) {
    filterItems = filterItems.filter((item) => {
      return !viewedIds.includes(item.rowId)
    })
  }
  if (selectTags.value === null || selectTags.value.length === 0) {
    return filterItems
  }
  return filterItems.filter((item) => {
    if (!selectTags.value) { return false }
    return selectTags.value.some((tag) => {
      if (!item.tweet.tags) { return false }
      return item.tweet.tags.includes(tag)
    })
  })
})

/** このページに表示するアイテム一覧 */
const getPageItem = computed(() => {
  return getItems.value.slice((page.value - 1) * settings.itemPerPage, page.value * settings.itemPerPage)
})

// --- watch
/** ページが変更されたら、MagicGridを更新し、トップにスクロールする */
watch(page, () => {
  updateMagicGrid()
  scrollToTop()
})

/** 選択されたターゲットが変更されたら、アイテム一覧を取得する */
watch(selected, () => {
  window.clearTimeout(timer.value)
  timer.value = window.setTimeout(async () => {
    await fetchItems()
    updateMagicGrid()
  }, 500)
})

/** AND検索かどうかが変更されたら、アイテム一覧を取得する */
watch(isAnd, async () => {
  settings.setAnd(isAnd.value)
  await fetchItems()
})

/** アイテム一覧が更新されたら、MagicGridを更新する */
watch(getItems, () => {
  updateMagicGrid()
})

/** このページに表示するアイテム一覧が更新されたら、いいね状態を取得する */
watch(getPageItem, async () => {
  if (!twitterStore.isLogin || getPageItem.value.length === 0) {
    return
  }
  const tweetIds = getPageItem.value.map((item) => item.tweet.tweetId)
  await twitterStore.fetchLikedTweetIds(tweetIds)
})

/** 新しいアイテムのみ表示かどうかが変更されたら、設定に反映する */
watch(isOnlyNew, () => {
  settings.setOnlyNew(isOnlyNew.value)
})

// --- onMounted
onMounted(async () => {
  await fetchTargets()

  // localStorageにある設定を反映する
  isAnd.value = settings.isAnd
  isOnlyNew.value = settings.isOnlyNew
  if (settings.selected !== null) {
    selected.value = targets.value.filter((t) =>
      settings.selected &&
      settings.selected.includes(t.userId)
    )
  } else {
    selected.value = targets.value
  }

  await fetchItems()
})
</script>

<template>
  <v-app>
    <v-main>
      <TheHeader :items="items" :targets="targets" :loading="loading" />
      <v-pagination v-model="page" :length="Math.ceil(getItems.length / settings.itemPerPage)" class="my-3" :disabled="loading" />
      <v-container v-if="getItems.length === 0 && !loading">
        <v-card>
          <v-card-text class="text-h6 text-center my-3">
            該当するアイテムが見つかりませんでした
          </v-card-text>
        </v-card>
      </v-container>
      <div v-if="loading" class="d-flex justify-center my-5">
        <v-progress-circular v-if="loading" indeterminate />
      </div>
      <MagicGrid
        v-if="getItems.length !== 0"
        ref="magicgrid"
        :animate="true"
        :use-min="true"
        :gap="magicGridSettings.gap"
        :max-cols="magicGridSettings.maxCols"
        :max-col-width="magicGridSettings.maxColWidth"
      >
        <ItemWrapper v-for="item of getPageItem" :key="item.rowId" :item="item" @intersect="onViewed">
          <CardItem :item="item" :is-and="isAnd" />
        </ItemWrapper>
      </MagicGrid>
      <v-pagination v-model="page" :length="Math.ceil(getItems.length / settings.itemPerPage)" class="my-3" :disabled="loading" />
      <GlobalSnackbar />
    </v-main>
  </v-app>
</template>
