export const useViewedStore = defineStore('viewed', {
  state: (): {
    rowIds: number[]
  } => ({
    rowIds: []
  }),

  getters: {
    getRowIds: (state) => state.rowIds,
    isViewed: (state) => (rowId: number): boolean => state.rowIds.includes(rowId)
  },

  actions: {
    add(rowId: number) {
      if (this.rowIds.includes(rowId)) { return }
      this.rowIds.push(rowId)
    },
    addAll(rowIds: number[]) {
      for (const rowId of rowIds) {
        this.add(rowId)
      }
    }
  },

  persist: {
    storage: persistedState.localStorage
  }
})
