<script setup lang="ts">
import { type Item, type Target } from './types/types'
import ItemWrapper from './components/ItemWrapper.vue'
import { useViewedStore } from './store/viewed'
import { useSettingsStore } from './store/settings'
import { useTwitterStore } from './store/twitter'
import { useSnackbarStore } from './store/snackbar'

type TargetsApiResponse = Target[]
type ImagesApiResponse = {
  items: Item[]
  total: number
}

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
const items = ref<Item[]>([])
/** すべてのターゲット */
const targets = ref<Target[]>([])
/** 現在のページ */
const page = ref(1)
/** 総件数 */
const total = ref(0)
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
  const response = await useFetch(
    `${config.public.apiBaseURL}/targets`
  )
  if (response.error.value) {
    snackbarStore.start(`表示対象一覧の取得に失敗しました: ${response.error.value}`, 'error', response.error.value)
    return
  }
  if (!response.data.value) {
    return
  }
  const data = response.data.value as TargetsApiResponse
  targets.value = data
  loading.value = false
}

/** アイテム一覧をAPIから取得する */
const fetchItems = async (forceAll = false): Promise<void> => {
  if (selected.value.length === 0) {
    items.value = []
    return
  }
  loading.value = true
  const response = await useFetch(
    `${config.public.apiBaseURL}/images`,
    {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      body: {
        targetIds: selected.value.map((s) => s.userId),
        type: isAnd.value ? 'and' : 'or',
        offset: !forceAll ? (page.value - 1) * settings.itemPerPage : undefined,
        limit: !forceAll ? settings.itemPerPage : undefined,
        tags: selectTags.value && selectTags.value.length > 0 ? selectTags.value : undefined,
        vieweds: isOnlyNew.value ? viewedIds : undefined
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
  // asで型をつけたくはないが…
  const data = response.data.value as ImagesApiResponse
  items.value = data.items
  total.value = data.total
  loading.value = false
}

/** 既読状態をアップデートする */
const onViewed = (item: Item): void => {
  viewedStore.add(item.rowId)
}

/** すべてのアイテムを既読にする */
const onAllViewed = (): void => {
  fetchItems(true).then(() => {
    viewedStore.addAll(items.value.map((item) => item.rowId))

    snackbarStore.start('すべてのアイテムを既読にしました。3秒後に再読み込みします。', 'green')
    setTimeout(() => {
      location.reload()
    }, 3000)
  })
}

// --- watch
/** ページが変更されたら、アイテム一覧を取得したうえでMagicGridを更新し、トップにスクロールする */
watch(page, () => {
  fetchItems().then(() => {
    updateMagicGrid()
    scrollToTop()
  })
})

/** 選択されたターゲットが変更されたら、アイテム一覧を取得する */
watch(selected, () => {
  window.clearTimeout(timer.value)
  timer.value = window.setTimeout(() => {
    fetchItems().then(() => {
      updateMagicGrid()
    })
  }, 500)
})

/** 選択されたタグが変更されたら、アイテム一覧を取得する */
watch(selectTags, () => {
  window.clearTimeout(timer.value)
  timer.value = window.setTimeout(() => {
    fetchItems().then(() => {
      updateMagicGrid()
    })
  }, 500)
})

/** AND検索かどうかが変更されたら、設定に反映したうえでアイテム一覧を取得する */
watch(isAnd, () => {
  settings.setAnd(isAnd.value)
  fetchItems().then(() => {
    updateMagicGrid()
  })
})

/** このページに表示するアイテム一覧が更新されたら、いいね状態を取得する */
watch(items, async () => {
  if (!twitterStore.isLogin || items.value.length === 0) {
    return
  }
  const tweetIds = items.value.map((item) => item.tweet.tweetId)
  await twitterStore.fetchLikedTweetIds(tweetIds)
})

/** 新しいアイテムのみ表示かどうかが変更されたら、設定に反映したうえでアイテム一覧を取得する */
watch(isOnlyNew, () => {
  settings.setOnlyNew(isOnlyNew.value)
  fetchItems().then(() => {
    updateMagicGrid()
  })
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
      <TheHeader :items="items" :targets="targets" :loading="loading" @all-viewed="onAllViewed" />
      <v-pagination v-model="page" :length="Math.ceil(total / settings.itemPerPage)" class="my-3" :disabled="loading" />
      <v-container v-if="items.length === 0 && !loading">
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
        v-if="!loading && items.length !== 0"
        ref="magicgrid"
        :animate="true"
        :use-min="true"
        :gap="magicGridSettings.gap"
        :max-cols="magicGridSettings.maxCols"
        :max-col-width="magicGridSettings.maxColWidth"
      >
        <ItemWrapper v-for="item of items" :key="item.rowId" :item="item" @intersect="onViewed">
          <CardItem :item="item" :is-and="isAnd" />
        </ItemWrapper>
      </MagicGrid>
      <v-pagination v-model="page" :length="Math.ceil(total / settings.itemPerPage)" class="my-3" :disabled="loading" />
      <GlobalSnackbar />
    </v-main>
  </v-app>
</template>
