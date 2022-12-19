<script setup lang="ts">
import { useSettingsStore } from '../store/settings'
import { useSnackbarStore } from '../store/snackbar'
import { useViewedStore } from '../store/viewed'
import { Item, Target } from '../types/types'
import TagSelector from './TagSelector.vue'

/// --- store
const viewedStore = useViewedStore()
const snackbarStore = useSnackbarStore()
const settings = useSettingsStore()

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
      return props.targets
    }
    return props.targets.filter((target) => userIds.includes(target.userId))
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

// --- props
const props = defineProps<{
  items: Item[]
  targets: Target[]
  loading: boolean
}>()

// --- methods

/** 選択中タグをアップデートする */
const updatedSelectTags = (val: string): void => {
  selectTags.value = val.split('\t').filter((v) => v !== '')
}

const allViewed = (): void => {
  if (!confirm('すべてのアイテムを既読にしますか？')) {
    return
  }
  viewedStore.addAll(props.items.map((item) => item.rowId))

  snackbarStore.start('すべてのアイテムを既読にしました。3秒後に再読み込みします。', 'green')
  setTimeout(() => {
    location.reload()
  }, 3000)
}

// --- computed

/** AND検索かどうかのラベル */
const getSearchType = computed(() => {
  return isAnd.value ? 'AND' : 'OR'
})

const getOnlyNewDisplay = computed(() => {
  return isOnlyNew.value ? '新しいアイテムのみ表示' : 'すべてのアイテムを表示'
})

</script>

<template>
  <v-container fluid>
    <div class="header-box">
      <v-row class="title-container">
        <v-col>
          <h1 class="text-body">
            Watch Twitter Likes
          </h1>
        </v-col>
        <v-col>
          <div class="d-flex justify-end">
            <DarkModeSwitch />
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <TargetSelector v-model="selected" :targets="targets" :loading="loading" />
        </v-col>
        <v-col cols="2">
          <v-switch v-model="isAnd" :label="getSearchType" inset class="d-flex justify-center" />
        </v-col>
      </v-row>
      <TagSelector :items="items" @updated="updatedSelectTags" />
    </div>
    <div class="view-items-container">
      <v-row justify="space-between">
        <v-col>
          <v-switch v-model="isOnlyNew" :label="getOnlyNewDisplay" inset />
        </v-col>
        <v-col class="d-flex justify-end">
          <v-btn class="my-2" :disabled="loading" @click="allViewed">
            すべて既読
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped>
.header-box {
  padding: 20px;
  border: 1px solid #aaa;
  border-radius: 5px;
  margin: 0 10px;
  background-color: rgb(var(--v-theme-surface))
}

.title-container {
  border-bottom: 1px solid #aaa;
  margin: 0 5px 10px;
}

.view-items-container {
  margin: 10px 20px 0;
}
</style>
