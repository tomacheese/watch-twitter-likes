<script setup lang="ts">
import { PropType, computed } from 'vue'
import { useTheme } from 'vuetify'
import { Item } from '@/types/types'

const vuetifyTheme = useTheme()

// props
const props = defineProps({
  item: {
    type: Object as PropType<Item>,
    required: true
  },
  isAnd: {
    type: Boolean,
    required: true
  }
})

// methods
const calcHeight = (item: Item) => {
  const image = item.images.find((image) => image.size === 'small')
  if (!image || !image.height) { return '338px' }
  return `${(image.height / image.width) * 240}px`
}

const getImageUrl = (item: Item) => {
  const image = item.images.find(
    (image) => image.size === 'small'
  )
  if (!image) { return '' }
  const imageId = image.imageId
  return `https://pbs.twimg.com/media/${imageId}?format=jpg&name=small`
}

const getTargetDisplay = (item: Item) => {
  if (props.isAnd || !item.target) {
    return ''
  }
  return `by ${item.target.name} likes`
}

// computed
const gradient = computed(() => {
  return vuetifyTheme.global.name.value === 'dark' ? 'to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)' : 'to bottom, rgba(0,0,0,.1), rgba(0,0,0,.3)'
})

</script>

<template>
  <v-card width="240px">
    <v-img
      :height="calcHeight(item)"
      :src="getImageUrl(item)"
      class="align-end"
      :gradient="gradient"
    >
      <v-card-title class="text-white text-right text-subtitle-2">
        {{ getTargetDisplay(item) }}
      </v-card-title>
      <template #placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-progress-circular indeterminate color="grey lighten-5" />
        </v-row>
      </template>
    </v-img>
  </v-card>
</template>
