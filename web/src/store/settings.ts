import { Target } from '../types/types'

export const useSettingsStore = defineStore('settings', {
  state: (): {
    /** 選択されているユーザー ID 群 */
    selected: string[] | null
    /** 選択されているタグ */
    selectedTags: string[] | null
    /** AND 検索かどうか */
    isAnd: boolean
    /** 新着のみ表示かどうか */
    isOnlyNew: boolean
    /** ダークテーマかどうか */
    isDarkTheme: boolean | null
    itemPerPage: number
    magicGrid: {
      maxCols: number
      maxColWidth: number
      gap: number
    }
  } => ({
    selected: null,
    selectedTags: null,
    isAnd: false,
    isOnlyNew: false,
    isDarkTheme: null,
    itemPerPage: 30,
    magicGrid: {
      maxCols: 5,
      maxColWidth: 280,
      gap: 10
    }
  }),

  actions: {
    /** 選択されているユーザー ID 群を設定する */
    setSelected(targets: Target[]) {
      this.selected = targets.map((t) => t.userId)
    },
    /** 選択されているタグを設定する */
    setSelectedTags(tags: string[]) {
      this.selectedTags = tags
    },
    /** AND 検索かどうかを設定する */
    setAnd(isAnd: boolean) {
      this.isAnd = isAnd
    },
    /** 新着のみ表示かどうかを設定する */
    setOnlyNew(isOnlyNew: boolean) {
      this.isOnlyNew = isOnlyNew
    },
    /** ダークテーマかどうかを設定する */
    setDark(isDark: boolean) {
      this.isDarkTheme = isDark
    },
    /** 1 ページあたりの表示件数を設定する */
    setItemPerPage(itemPerPage: number) {
      this.itemPerPage = itemPerPage
    },
    /** MagicGrid の最大列数を設定する */
    setMagicGridMaxCols(maxCols: number) {
      console.log('setMagicGridMaxCols', maxCols)
      this.magicGrid.maxCols = maxCols
    },
    /** MagicGrid の最大列幅を設定する */
    setMagicGridMaxColWidth(maxColWidth: number) {
      this.magicGrid.maxColWidth = maxColWidth
    },
    /** MagicGrid の間隔を設定する */
    setMagicGridGap(gap: number) {
      this.magicGrid.gap = gap
    }
  },

  persist: {
    storage: persistedState.localStorage
  }
})
