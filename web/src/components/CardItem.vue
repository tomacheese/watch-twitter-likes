<script setup lang="ts">
import { Buffer } from 'buffer'
import { PropType, onMounted, ref } from 'vue'
import { useFetch } from '#app'
import { getColor, Palette } from 'color-thief-node'
import { Item } from '@/types/types'

// data
const dataUrl = ref<string>()
const palette = ref<Palette>()
const gradient = ref<string>()
const cardTitleClass = ref<string>()

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

const rgb2Lightness = (rgb: Palette): number => {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  return (max + min) / 2
}

const getTargetDisplay = (item: Item) => {
  if (props.isAnd || !item.target) {
    return ''
  }
  return `by ${item.target.name} likes`
}

const isArrayBuffer = (value: any): value is ArrayBuffer => {
  return value instanceof ArrayBuffer
}

const getDataUrl = async (url: string) => {
  const response = await useFetch<ArrayBuffer>(url, { responseType: 'arrayBuffer' })
  if (!response.data) {
    throw new Error('response.data is undefined')
  }
  const data = response.data.value
  if (!data) {
    throw new Error('data is undefined')
  }
  if (!isArrayBuffer(data)) {
    throw new Error('data is not ArrayBuffer')
  }
  // get data url
  const base64 = Buffer.from(data).toString('base64')
  const dataURL = `data:image/jpeg;base64,${base64}`
  return dataURL
}

const getPalette = async (dataUrl: string) => {
  const image = new Image()
  return await new Promise<Palette>((resolve, reject) => {
    image.onload = () => {
      resolve(getColor(image))
    }
    image.onerror = (error) => {
      reject(error)
    }
    image.src = dataUrl
  })
}

const getCardTitleClass = (palette: Palette) => {
  const commonClasses = 'text-right text-subtitle-2'
  const lightness = rgb2Lightness(palette)
  // 0.6以上なら白、0.6未満なら黒
  return lightness >= 0.6 ? `${commonClasses} text-white` : `${commonClasses} text-black`
}

const getGradient = (palette: Palette) => {
  // Palette.toString() は、"r, g, b" の形式っぽい
  return `to bottom, rgba(${palette}, .1), rgba(${palette}, .5)`
}

onMounted(async () => {
  // ツイートの画像 URL
  const imageURL = getImageUrl(props.item)
  // 画像を Data URL に変換
  dataUrl.value = await getDataUrl(imageURL)
  // パレットを取得
  palette.value = await getPalette(dataUrl.value)
  // カードタイトルのクラスを作成
  cardTitleClass.value = getCardTitleClass(palette.value)
  // gradientを作成
  gradient.value = getGradient(palette.value)
})
</script>

<template>
  <v-card width="240px">
    <v-img
      :height="calcHeight(item)"
      :src="dataUrl"
      class="align-end"
      :gradient="gradient"
    >
      <v-card-title :class="cardTitleClass">
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
