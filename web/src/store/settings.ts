import { Target } from '../types/types'

export const useSettingsStore = defineStore('settings', {
  state: (): {
    selected: string[] | null
    selectedTagsList: string[] | null
    isAndSearch: boolean
    isOnlyNewView: boolean
    isDarkTheme: boolean | null
  } => ({
    selected: null,
    selectedTagsList: null,
    isAndSearch: false,
    isOnlyNewView: false,
    isDarkTheme: null
  }),

  getters: {
    selectedUserIds: (state) => state.selected,
    selectedTags: (state) => state.selectedTagsList,
    isAnd: (state) => state.isAndSearch,
    isOnlyNew: (state) => state.isOnlyNewView,
    isDark: (state) => state.isDarkTheme
  },

  actions: {
    setSelected(targets: Target[]) {
      this.selected = targets.map((t) => t.userId)
    },
    setSelectedTags(tags: string[]) {
      this.selectedTagsList = tags
    },
    setAnd(isAnd: boolean) {
      this.isAndSearch = isAnd
    },
    setOnlyNew(isOnlyNew: boolean) {
      this.isOnlyNewView = isOnlyNew
    },
    setDark(isDark: boolean) {
      this.isDarkTheme = isDark
    }
  },

  persist: {
    storage: persistedState.localStorage
  }
})
