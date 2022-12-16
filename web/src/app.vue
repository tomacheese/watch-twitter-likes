<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useFetch, useRuntimeConfig } from '#app'
import { Item, Target } from './types/types'

type TargetsApiResponse = Target[]
type ImagesApiResponse = Item[]

const config = useRuntimeConfig()

// --- data
/** アイテム一覧 */
const items = ref<ImagesApiResponse>([])
/** 選択されたターゲット */
const selected = ref<Target[]>([])
/** すべてのターゲット */
const targets = ref<Target[]>([])
/** AND検索かどうか */
const isAnd = ref(false)
/** 現在のページ */
const page = ref(1)
/** ローディング中かどうか */
const loading = ref(false)

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

/** 選択されたターゲットを更新する */
const updatedSelector = (val: Target[]): void => {
  selected.value = val
}

/** 対象一覧をAPIから取得する */
const fetchTargets = async (): Promise<void> => {
  loading.value = true
  const response = await useFetch<TargetsApiResponse>(
    `${config.public.apiBaseURL}/targets`
  ).catch((e) => {
    console.error(e)
    alert('Error: "Failed to fetch images.')
    return null
  })
  if (!response || !response.data.value) {
    return
  }
  targets.value = response.data.value
  selected.value = targets.value
  loading.value = false
}

/** アイテム一覧をAPIから取得する */
const fetchItems = async (): Promise<void> => {
  loading.value = true
  const response = await useFetch<ImagesApiResponse>(
    `${config.public.apiBaseURL}/images`,
    {
      params: {
        targetIds: selected.value.map((s) => s.userId).join(','),
        type: isAnd.value ? 'and' : 'or'
      }
    }
  ).catch((e) => {
    console.error(e)
    alert('Error: "Failed to fetch images.')
    return null
  })
  if (!response || !response.data.value) {
    return
  }
  const results = response.data.value.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  items.value = results
  loading.value = false
}

/** アイテムを twitter.com で開く */
const open = (item: Item): void => {
  window.open(
    `https://twitter.com/${item.tweet.user.screenName}/status/${item.tweet.tweetId}`
  )
}

// --- watch
/** ページが変更されたら、MagicGridを更新し、トップにスクロールする */
watch(page, () => {
  updateMagicGrid()
  scrollToTop()
})

/** 選択されたターゲットが変更されたら、アイテム一覧を取得し、MagicGridを更新する */
watch(selected, async () => {
  await fetchItems()
  updateMagicGrid()
})

/** AND検索かどうかが変更されたら、アイテム一覧を取得し、MagicGridを更新する */
watch(isAnd, async () => {
  await fetchItems()
  updateMagicGrid()
})

// --- computed
/** このページに表示するアイテム一覧 */
const getPageItem = computed(() => {
  return items.value.slice((page.value - 1) * 30, page.value * 30)
})

/** AND検索かどうかのラベル */
const getSearchType = computed(() => {
  return isAnd.value ? 'AND' : 'OR'
})

// --- onMounted
onMounted(async () => {
  await fetchTargets()
  await fetchItems()
})
</script>

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-spacer />
          <v-col cols="1">
            <v-switch v-model="isAnd" :label="getSearchType" inset />
          </v-col>
          <v-col>
            <TargetSelector :targets="targets" :loading="loading" @updated="updatedSelector" />
          </v-col>
          <v-col cols="1">
            <DarkModeSwitch />
          </v-col>
          <v-spacer />
        </v-row>
        <v-pagination v-model="page" :length="Math.ceil(items.length / 30)" :total-visible="11" class="my-3" :disabled="loading" />
        <MagicGrid ref="magicgrid" :animate="true" :use-min="true" :gap="10">
          <CardItem v-for="item of getPageItem" :key="item.rowId" :item="item" :is-and="isAnd" @click="open(item)" />
        </MagicGrid>
        <v-pagination v-model="page" :length="Math.ceil(items.length / 30)" :total-visible="11" class="my-3" :disabled="loading" />
      </v-container>
    </v-main>
  </v-app>
</template>
