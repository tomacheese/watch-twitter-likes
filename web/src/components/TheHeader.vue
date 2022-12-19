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
    <v-row class="d-flex" justify="center">
      <div>
        <v-switch v-model="isAnd" :label="getSearchType" inset />
      </div>
      <div class="mx-10">
        <TargetSelector v-model="selected" :targets="targets" :loading="loading" />
      </div>
      <div>
        <DarkModeSwitch />
      </div>
    </v-row>
    <v-row class="d-flex" justify="center" align-content="center">
      <div>
        <v-switch v-model="isOnlyNew" :label="getOnlyNewDisplay" inset />
      </div>
      <div class="py-2">
        <v-btn class="mx-10" :disabled="loading" @click="allViewed">
          すべて既読
        </v-btn>
      </div>
    </v-row>
    <TagSelector :items="items" @updated="updatedSelectTags" />
  </v-container>
</template>
