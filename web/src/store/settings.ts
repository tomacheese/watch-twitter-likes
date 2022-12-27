import { Target } from '../types/types'

export const useSettingsStore = defineStore('settings', {
  state: (): {
    selected: string[] | null
    selectedTagsList: string[] | null
    isAndSearch: boolean
    isOnlyNewView: boolean
    isDarkTheme: boolean | null
    magicGrid: {
      maxCols: number
      maxColWidth: number
      gap: number
    }
  } => ({
    selected: null,
    selectedTagsList: null,
    isAndSearch: false,
    isOnlyNewView: false,
    isDarkTheme: null,
    magicGrid: {
      maxCols: 5,
      maxColWidth: 280,
      gap: 10
    }
  }),

  getters: {
    /** 選択されているユーザー ID 群 */
    selectedUserIds: (state) => state.selected,
    /** 選択されているタグ */
    selectedTags: (state) => state.selectedTagsList,
    /** AND 検索かどうか */
    isAnd: (state) => state.isAndSearch,
    /** 新着のみ表示かどうか */
    isOnlyNew: (state) => state.isOnlyNewView,
    /** ダークテーマかどうか */
    isDark: (state) => state.isDarkTheme
  },

  actions: {
    /** 選択されているユーザー ID 群を設定する */
    setSelected(targets: Target[]) {
      this.selected = targets.map((t) => t.userId)
    },
    /** 選択されているタグを設定する */
    setSelectedTags(tags: string[]) {
      this.selectedTagsList = tags
    },
    /** AND 検索かどうかを設定する */
    setAnd(isAnd: boolean) {
      this.isAndSearch = isAnd
    },
    /** 新着のみ表示かどうかを設定する */
    setOnlyNew(isOnlyNew: boolean) {
      this.isOnlyNewView = isOnlyNew
    },
    /** ダークテーマかどうかを設定する */
    setDark(isDark: boolean) {
      this.isDarkTheme = isDark
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
