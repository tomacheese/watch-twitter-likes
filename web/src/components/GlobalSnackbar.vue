<!-- グローバルスナックバーコンポーネント -->

<script setup lang="ts">
import { useSnackbarStore } from '../store/snackbar'

const snackbarStore = useSnackbarStore()

// --- data
const isCopySuccess = ref<boolean | null>(false)

// --- computed
const snackbar = computed({
  get: () => snackbarStore.isShow,
  set: (val) => snackbarStore.setShow(val)
})
const copyIcon = computed(() => {
  if (isCopySuccess.value === null) { return 'mdi-content-copy' }
  if (isCopySuccess.value) { return 'mdi-check' }
  return 'mdi-close'
})

const { message, color, copyText } = toRefs(snackbarStore)

// --- watch
/** スナックバーが閉じられたらコピー成功可否をリセット */
watch(snackbar, (val) => {
  if (!val) { return }
  isCopySuccess.value = null
})

// --- methods
const runCopyText = (): void => {
  const text = copyText.value
  if (!text) { return }
  if (!navigator.clipboard) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    isCopySuccess.value = true
    return
  }
  navigator.clipboard
    .writeText(text)
    .then(() => {
      isCopySuccess.value = true
    })
    .catch(() => {
      isCopySuccess.value = false
    })
}
</script>

<template>
  <v-snackbar v-model="snackbar" :timeout="3000" :color="color">
    {{ message }}
    <template #actions>
      <v-btn
        @click="runCopyText()"
      >
        <v-icon>{{ copyIcon }}</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>
