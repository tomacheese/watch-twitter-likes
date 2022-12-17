<script setup lang="ts">
import { useTheme } from 'vuetify'

/**
 * Vuetify で持っているテーマアクセス用の関数
 */
const vuetifyTheme = useTheme()

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
})

// --- onMounted
/** ページ読み込み時に、OS のテーマに応じてテーマフラグを切り替える */
onMounted(() => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = true
  }
})
</script>

<template>
  <v-switch v-model="theme" :prepend-icon="themeIcon" inset />
</template>
