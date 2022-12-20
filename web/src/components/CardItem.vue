<script setup lang="ts">
import { Buffer } from 'buffer'
import { getColor, Palette } from 'color-thief-node'
import { PropType } from 'vue'
import { useViewedStore } from '../store/viewed'
import { Item } from '@/types/types'

const viewedStore = useViewedStore()

// --- props
/**
 * Props: コンポーネントを呼び出されたときに渡されるプロパティ
 *
 * @param item ツイートの情報
 * @param isAnd ツイートが AND 検索で取得されているか
 */
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

/** 初めて表示するか */
const isNew = ref<boolean>(false)

// --- data
/** 画像ファイルの Data Url: https://developer.mozilla.org/ja/docs/Web/HTTP/Basics_of_HTTP/Data_URLs */
const dataUrl = ref<string>()
/** 画像に掛けるグラデーション */
const gradient = ref<string>()
/** カードタイトルのクラス（色指定など） */
const cardTitleClass = ref<string>()

// --- methods
/**
 * 画像の高さを計算する
 *
 * - Twitter が画像の高さを提供する場合、横幅に応じて高さを計算する
 * - 画像の高さが提供されない場合は、デフォルトの高さ(338px)を返す
 *
 * @param item ツイートの情報
 * @returns 画像の高さ
 */
const calcHeight = (item: Item): string => {
  const image = item.images.find((image) => image.size === 'small')
  if (!image || !image.height) { return '338px' }
  return `${(image.height / image.width) * 240}px`
}

/**
 * RGB を輝度に変換する
 *
 * @param rgb RGB パレット
 */
const rgb2Lightness = (rgb: Palette): number => {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  return (max + min) / 2
}

/**
 * ツイートのターゲットを表示するテキストを返す。
 * AND 検索の場合は空文字を返す。
 *
 * @param item ツイートの情報
 * @returns ツイートのターゲットテキスト
 */
const getTargetDisplay = (item: Item): string => {
  if (props.isAnd || !item.target) {
    return ''
  }
  return `by ${item.target.name} likes`
}

/**
 * 値が ArrayBuffer かどうかを判定する
 *
 * @param value 値
 * @returns ArrayBuffer なら true
 */
const isArrayBuffer = (value: unknown): value is ArrayBuffer => {
  return value instanceof ArrayBuffer
}

/**
 * 画像の URL をもとに Data URL を取得する
 *
 * @param url 画像の URL
 * @returns Data URL
 */
const getDataUrl = async (url: string): Promise<string> => {
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
  const base64 = Buffer.from(data).toString('base64')
  return `data:image/jpeg;base64,${base64}`
}

/**
 * 画像の Data URL をもとにカラーパレットを取得する
 *
 * @param dataUrl 画像の Data URL
 * @returns カラーパレット
 */
const getPalette = async (dataUrl: string): Promise<Palette> => {
  const image = new Image()
  return await new Promise<Palette>((resolve, reject) => {
    image.onload = (): void => {
      resolve(getColor(image))
    }
    image.onerror = (error): void => {
      reject(error)
    }
    image.src = dataUrl
  })
}

/**
 * カードタイトルのクラスを作成する
 *
 * - 輝度が 0.6 以上なら白文字色、0.6 未満なら黒文字色
 *
 * @param palette カラーパレット
 * @returns クラス
 */
const getCardTitleClass = (palette: Palette): string => {
  const commonClasses = 'text-right text-subtitle-2'
  const lightness = rgb2Lightness(palette)
  // 0.6以上なら白、0.6未満なら黒
  return lightness <= 0.6 ? `${commonClasses} text-white` : `${commonClasses} text-black`
}

/**
 * グラデーションを作成する
 *
 * @param palette カラーパレット
 * @returns グラデーション
 */
const getGradient = (palette: Palette): string => {
  // Palette.toString() は、"r, g, b" の形式っぽい
  return `to bottom, rgba(${palette}, .1), rgba(${palette}, .5)`
}

// --- onMounted
onMounted(async () => {
  isNew.value = !viewedStore.isViewed(props.item.rowId)

  // ツイートの画像 URL
  const imageURL = props.item.images[0].url
  if (!imageURL) {
    throw new Error('imageURL is undefined')
  }
  // 画像を Data URL に変換
  dataUrl.value = await getDataUrl(imageURL)
  // パレットを取得
  const palette = await getPalette(dataUrl.value)
  // カードタイトルのクラスを作成
  cardTitleClass.value = getCardTitleClass(palette)
  // gradientを作成
  gradient.value = getGradient(palette)
})
</script>

<template>
  <v-badge v-model="isNew" overlap content="NEW" offset-x="20" color="green">
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
  </v-badge>
</template>
