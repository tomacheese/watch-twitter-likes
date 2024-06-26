<!-- ヘッダーコンポーネント -->

<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { useSettingsStore } from '../store/settings'
import { useSnackbarStore } from '../store/snackbar'
import { useTwitterStore } from '../store/twitter'
import { type Item, type Target } from '../types/types'
import TagSelector from './TagSelector.vue'

/// --- store
const config = useRuntimeConfig()
const snackbarStore = useSnackbarStore()
const settings = useSettingsStore()
const twitterStore = useTwitterStore()

// --- emit
interface Emits {
  /** すべてのアイテムを既読にする */
  (e: 'allViewed'): void
}
const emit = defineEmits<Emits>()

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
  /** アイテムの配列 */
  items: Item[]
  /** ターゲットの配列 */
  targets: Target[]
  /** ロード中かどうか */
  loading: boolean
}>()

// --- methods

/** 選択中タグをアップデートする */
const updatedSelectTags = (val: string[]): void => {
  selectTags.value = val.filter((v) => v !== '')
}

/** すべてのアイテムを既読にする */
const allViewed = (): void => {
  if (!confirm('すべてのアイテムを既読にしますか？')) {
    return
  }
  emit('allViewed')
}

/** ログイン/ログアウト */
const clickTwitter = (): void => {
  if (!twitterStore.isLogin) {
    location.href = `${config.public.apiBaseURL}/twitter/auth?backUrl=${location.href}`
    return
  }

  // ログアウト
  if (!confirm('ログアウトしますか？')) {
    return
  }
  useFetch(`${config.public.apiBaseURL}/twitter/logout`).then((response) => {
    if (response.error.value) {
      snackbarStore.start(`ログアウトに失敗しました: ${response.error.value}`, 'red', response.error.value)
      return
    }
    location.reload()
  })
}

// --- computed
/** Twitter にログインしているかどうか */
const isTwitterLogin = computed<boolean>(() => twitterStore.isLogin)
/** Twitter のプロフィール画像の URL */
const twitterProfileUrl = computed<string>(() => {
  if (twitterStore.me === null) {
    return ''
  }
  return twitterStore.me.profile_image_url_https
})

// --- display helpers
const { mdAndUp } = useDisplay()

// --- onMounted
onMounted(async () => {
  await twitterStore.fetchMe()
})
</script>

<template>
  <v-container fluid>
    <div class="header-box">
      <v-row class="title-container">
        <div class="text-body text-h5 text-sm-h4 font-weight-bold">
          Watch Twitter Likes
        </div>
        <div class="d-flex justify-end">
          <SettingsModal />
          <v-btn variant="tonal" icon class="mx-3" @click="clickTwitter()">
            <v-avatar v-if="isTwitterLogin">
              <v-img
                :src="twitterProfileUrl"
              />
            </v-avatar>
            <v-icon v-else>
              mdi-twitter
            </v-icon>
          </v-btn>
          <DarkModeSwitch />
        </div>
      </v-row>
      <v-row>
        <div class="display-settings d-flex flex-column flex-md-row align-end align-md-center justify-md-center">
          <TargetSelector v-model="selected" :targets="targets" :loading="loading" :class="mdAndUp ? 'w-auto' : 'w-100'" />
          <v-btn-toggle v-model="isAnd" variant="outlined" mandatory>
            <v-btn :value="true" selected-class="font-weight-bold">
              AND
            </v-btn>
            <v-btn :value="false" selected-class="font-weight-bold">
              OR
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-row>
      <v-row>
        <TagSelector :items="items" @updated="updatedSelectTags" />
      </v-row>
    </div>
    <div class="view-items-container d-flex flex-column flex-md-row justify-md-space-between">
      <v-btn-toggle v-model="isOnlyNew" variant="outlined" mandatory>
        <v-btn :value="true" selected-class="font-weight-bold">
          <v-icon size="x-large" class="mr-1">
            mdi-alert-decagram
          </v-icon>
          新しいアイテムのみ
        </v-btn>
        <v-btn :value="false" selected-class="font-weight-bold">
          <v-icon size="x-large" class="mr-1">
            mdi-all-inclusive
          </v-icon>
          すべて表示
        </v-btn>
      </v-btn-toggle>
      <v-btn :disabled="loading" :block="!mdAndUp" size="large" @click="allViewed">
        <v-icon size="x-large" class="mr-1">
          mdi-check-all
        </v-icon>
        すべて既読
      </v-btn>
    </div>
  </v-container>
</template>

<style scoped>
.header-box {
  padding: 2rem;
  border: 1px solid #464646;
  border-radius: 5px;
  margin: 0 10px;
  background-color: rgb(var(--v-theme-surface))
}

.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #464646;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.display-settings {
  width: 100%;
  justify-content: space-between;
  align-items: center;
  column-gap: 1rem;
  margin-bottom: 1rem;
}

.view-items-container {
  padding: 1rem;
  gap: 1rem;
}
</style>
