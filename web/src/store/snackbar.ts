export const useSnackbarStore = defineStore('snackbar', {
  state: (): {
    show: boolean
    message: string
    color: string
  } => ({
    show: false,
    message: '',
    color: ''
  }),

  getters: {
    isShow: (state) => state.show,
    getMessage: (state) => state.message,
    getColor: (state) => state.color
  },

  actions: {
    setShow(show: boolean) {
      this.show = show
    },
    start(message: string, color: string) {
      this.show = true
      this.message = message
      this.color = color
    }
  }
})
