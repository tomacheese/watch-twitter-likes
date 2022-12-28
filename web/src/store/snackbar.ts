import { FetchError } from 'ofetch'

export const useSnackbarStore = defineStore('snackbar', {
  state: (): {
    isShow: boolean
    message: string
    color: string
    copyText: string | undefined
  } => ({
    isShow: false,
    message: '',
    color: '',
    copyText: undefined
  }),

  actions: {
    /**
     * スナックバーを表示するかどうかを設定する
     *
     * @param show 表示するかどうか
     */
    setShow(show: boolean) {
      this.isShow = show
    },
    /**
     * スナックバーを表示する
     *
     * @param message 表示するメッセージ
     * @param color 表示する色
     */
    start(message: string, color: string, copyText?: string | FetchError | null) {
      this.isShow = true
      this.message = message
      this.color = color

      if (copyText === null) {
        this.copyText = undefined
        return
      }
      if (copyText instanceof FetchError) {
        this.copyText = JSON.stringify({
          message: copyText.message,
          cause: copyText.cause,
          stack: copyText.stack ? copyText.stack.split('\n') : null,
          status: copyText.status,
          request: copyText.request,
          response: copyText.response
        }, null, 2)
        return
      }
      this.copyText = copyText
    }
  }
})
