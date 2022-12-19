import { Target } from '../types/types'

export const useSettingsStore = defineStore('settings', {
  state: (): {
    selected: string[] | null
    isAndSearch: boolean
    isOnlyNewView: boolean
    isDarkTheme: boolean | null
  } => ({
    selected: null,
    isAndSearch: false,
    isOnlyNewView: false,
    isDarkTheme: null
  }),

  getters: {
    selectedUserIds: (state) => state.selected,
    isAnd: (state) => state.isAndSearch,
    isOnlyNew: (state) => state.isOnlyNewView,
    isDark: (state) => state.isDarkTheme
  },

  actions: {
    setSelected(targets: Target[]) {
      this.selected = targets.map((t) => t.userId)
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
