<!--suppress TypeScriptCheckImport -->
<script setup lang="ts">
import { Buffer } from 'buffer'
import { PropType, onMounted, ref, Ref } from 'vue'
import { useFetch } from '#app'
import { getColor, Palette } from 'color-thief-node'
import { Item } from '@/types/types'

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

const gradient: Ref<string|undefined> = ref(undefined)
const textColor: Ref<string|undefined> = ref(undefined)

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

const getGradient = async (item: Item) => {
  const image = new Image()
  const imageURL = getImageUrl(item)
  const response = await useFetch(imageURL, { responseType: 'arrayBuffer' })
  if (!response.data) {
    throw new Error('response.data is undefined')
  }
  const a = response.data.value
  if (!a) {
    throw new Error('a is undefined')
  }
  // get data url
  const dataURL = `data:image/jpeg;base64,${Buffer.from(
      a as any,
      'binary'
  ).toString('base64')}`
  image.onload = async () => {
    const dominantColor = await getColor(image)
    console.log('dominantColor', dominantColor)
    if (rgb2hsl(dominantColor) <= 0.6) {
      textColor.value = 'text-white text-right text-subtitle-2'
    } else {
      textColor.value = 'text-black text-right text-subtitle-2'
    }
    gradient.value = `to bottom, rgba(${dominantColor}, .1), rgba(${dominantColor}, .5)`
  }
  console.log('dataURL', dataURL)
  image.src = dataURL
}

// mounted
onMounted(() => {
  getGradient(props.item)
})

function rgb2hsl(rgb: Palette): number {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  return (max + min) / 2
}
</script>

<template>
  <v-card width="240px">
    <v-img
      :height="calcHeight(item)"
      :src="getImageUrl(item)"
      class="align-end"
      :gradient="gradient"
    >
      <v-card-title :class="textColor">
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
