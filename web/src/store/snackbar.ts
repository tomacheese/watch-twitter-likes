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
    /** スナックバーを表示するかどうか */
    isShow: (state) => state.show,
    /** スナックバーに表示するメッセージ */
    getMessage: (state) => state.message,
    /** スナックバーに表示する色 */
    getColor: (state) => state.color
  },

  actions: {
    /**
     * スナックバーを表示するかどうかを設定する
     *
     * @param show 表示するかどうか
     */
    setShow(show: boolean) {
      this.show = show
    },
    /**
     * スナックバーを表示する
     *
     * @param message 表示するメッセージ
     * @param color 表示する色
     */
    start(message: string, color: string) {
      this.show = true
      this.message = message
      this.color = color
    }
  }
})
