<!-- ダークモードスイッチコンポーネント -->

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { useSettingsStore } from '../store/settings'

/**
 * Vuetify で持っているテーマアクセス用の関数
 */
const vuetifyTheme = useTheme()
const settings = useSettingsStore()

// --- data
/** テーマフラグ (dark = true) */
const theme = ref(false)

// --- computed
/** テーマに応じたアイコン */
const themeIcon = computed(() => {
  return theme.value ? 'mdi-weather-night' : 'mdi-weather-sunny'
})

// --- watch
/** テーマフラグに応じて、Vuetify のテーマを切り替える */
watch(theme, (val) => {
  vuetifyTheme.global.name.value = val ? 'dark' : 'light'
  settings.setDark(val)
})

// --- onMounted
/** ページ読み込み時に、OS のテーマに応じてテーマフラグを切り替える */
onMounted(() => {
  if (settings.isDarkTheme === null) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = true
    }
  } else {
    theme.value = settings.isDarkTheme
  }
})
</script>

<template>
  <v-btn icon variant="tonal" @click="theme = !theme">
    <v-icon>{{ themeIcon }}</v-icon>
  </v-btn>
</template>
