<script setup lang="ts">import { useSettingsStore } from '../store/settings'

const settings = useSettingsStore()

// --- data
const isOpen = ref(false)

// --- settings computed
const itemPerPage = computed({
  get: () => settings.itemPerPage,
  set: (val) => {
    // stringがくる可能性がある
    if (typeof val === 'string') {
      val = parseInt(val)
    }
    settings.setItemPerPage(val)
  }
})
const maxCols = computed({
  get: () => settings.magicGrid.maxCols,
  set: (val) => settings.setMagicGridMaxCols(val)
})
const maxColWidth = computed({
  get: () => settings.magicGrid.maxColWidth,
  set: (val) => settings.setMagicGridMaxColWidth(val)
})
const gap = computed({
  get: () => settings.magicGrid.gap,
  set: (val) => settings.setMagicGridGap(val)
})

// --- methods
const reset = (): void => {
  itemPerPage.value = 30
  maxCols.value = 5
  maxColWidth.value = 280
  gap.value = 10
}
</script>

<template>
  <v-btn
    variant="tonal"
    icon="mdi-cog"
    @click="isOpen = true"
  />
  <v-dialog v-model="isOpen">
    <v-card class="pa-5">
      <v-card-title>表示設定</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>1ページのアイテム数</v-list-subheader>
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="itemPerPage"
              type="number"
              suffix="アイテム"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>最大列数</v-list-subheader>
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="maxCols"
              type="number"
              suffix="列"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>最大列幅</v-list-subheader>
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="maxColWidth"
              type="number"
              suffix="px"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>列間隔</v-list-subheader>
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="gap"
              type="number"
              suffix="px"
            />
          </v-col>
        </v-row>
        <p>
          設定はページ変更後などの再描画時に反映されます。
        </p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="red"
          @click="reset()"
        >
          Reset
        </v-btn>
        <v-btn
          variant="text"
          color="green"
          @click="isOpen = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
