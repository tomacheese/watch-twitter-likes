<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useFetch, useRuntimeConfig } from '#app'
import { Item, Target } from './types/types'

type TargetsApiResponse = Target[]
type ImagesApiResponse = Item[]

const config = useRuntimeConfig()

// data
const items = ref<ImagesApiResponse>([])
const selected = ref<Target[]>([])
const targets = ref<Target[]>([])
const isAnd = ref(false)
const page = ref(1)

// refs
const magicgrid = ref()

// methods
const updateMagicGrid = () => {
  setTimeout(() => {
    magicgrid.value?.update()
  }, 100)
}

const scrollToTop = () => {
  window.scroll({ top: 0, behavior: 'smooth' })
}

const updatedSelector = (val: Target[]) => {
  selected.value = val
}

const fetchTargets = async () => {
  const response = await useFetch<TargetsApiResponse>(
    `${config.public.apiBaseURL}/targets`
  )
  if (!response.data.value) {
    return
  }
  targets.value = response.data.value
  selected.value = targets.value
}

const fetchItems = async () => {
  const response = await useFetch<ImagesApiResponse>(
    `${config.public.apiBaseURL}/images`,
    {
      params: {
        targetIds: selected.value.map((s) => s.userId).join(','),
        type: isAnd.value ? 'and' : 'or'
      }
    }
  )
  if (!response.data.value) {
    return
  }
  const results = response.data.value.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  items.value = results
}

const open = (item: Item) => {
  window.open(
    `https://twitter.com/${item.tweet.user.screenName}/status/${item.tweet.tweetId}`
  )
}

// watch
watch(page, () => {
  updateMagicGrid()
  scrollToTop()
})

watch(selected, async () => {
  await fetchItems()
  updateMagicGrid()
})

watch(isAnd, async () => {
  await fetchItems()
  updateMagicGrid()
})

// computed
const getPageItem = computed(() => {
  return items.value.slice((page.value - 1) * 30, page.value * 30)
})

const getSearchType = computed(() => {
  return isAnd.value ? 'AND' : 'OR'
})

// onMounted
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
            <TargetSelector :targets="targets" @updated="updatedSelector" />
          </v-col>
          <v-col cols="1">
            <DarkModeSwitch />
          </v-col>
          <v-spacer />
        </v-row>
        <v-pagination v-model="page" :length="Math.ceil(items.length / 30)" :total-visible="11" class="my-3" />
        <MagicGrid ref="magicgrid" :animate="true" :use-min="true" :gap="10">
          <CardItem v-for="item of getPageItem" :key="item.rowId" :item="item" :is-and="isAnd" @click="open(item)" />
        </MagicGrid>
        <v-pagination v-model="page" :length="Math.ceil(items.length / 30)" :total-visible="11" class="my-3" />
      </v-container>
    </v-main>
  </v-app>
</template>
