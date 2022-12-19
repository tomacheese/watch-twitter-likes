<script setup lang="ts">
import { useSnackbarStore } from '../store/snackbar'

const snackbarStore = useSnackbarStore()

const snackbar = computed({
  get: () => snackbarStore.isShow,
  set: (val) => snackbarStore.setShow(val)
})
const { getMessage: message, getColor: color } = toRefs(snackbarStore)

</script>

<template>
  <v-snackbar v-model="snackbar" :timeout="3000" :color="color">
    {{ message }}
  </v-snackbar>
</template>
