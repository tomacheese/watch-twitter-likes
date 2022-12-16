<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()

// data
const theme = ref(false)

// computed
const themeIcon = computed(() => {
  return theme.value ? 'mdi-weather-night' : 'mdi-weather-sunny'
})

// watch
watch(theme, (val) => {
  vuetifyTheme.global.name.value = val ? 'dark' : 'light'
})

// mounted
onMounted(() => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = true
  }
})
</script>

<template>
  <v-switch v-model="theme" :prepend-icon="themeIcon" inset />
</template>
