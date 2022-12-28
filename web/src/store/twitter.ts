export interface TwitterMe {
  id_str: string
  name: string
  screen_name: string
  profile_image_url_https: string
}

export const useTwitterStore = defineStore('twitter', {
  state: (): {
    me: TwitterMe | null
    likedTweetIds: string[]
  } => ({
    me: null,
    likedTweetIds: []
  }),

  getters: {
    /** Twitter でログインしているかどうか */
    isLogin: (state) => !!state.me,
    /** 認証者の情報 */
    getMe: (state) => state.me,
    /** いいね済みのツイート ID 群 */
    getLikedTweetIds: (state) => state.likedTweetIds,
    /** 指定したツイート ID がいいね済みかどうか */
    isLiked: (state) => (tweetId: string): boolean => state.likedTweetIds.includes(tweetId)
  },

  actions: {
    /**
     * 認証者の情報を取得する
     */
    async fetchMe() {
      const config = useRuntimeConfig()
      const response = await useFetch<TwitterMe>(`${config.public.apiBaseURL}/twitter/me`).catch(() => null)
      if (!response) {
        return
      }
      this.me = response.data.value
    },
    /**
     * ツイート群のうち、いいね済みのツイートIDを取得する
     *
     * @param tweetIds ツイート ID 群
     */
    async fetchLikedTweetIds(tweetIds: string[]) {
      if (tweetIds.length === 0 || tweetIds.length > 100) {
        throw new Error('tweetIds.length must be 1-100')
      }
      const config = useRuntimeConfig()
      const response = await useFetch<{
        id_str: string
        favorited: boolean
      }[]>(
        `${config.public.apiBaseURL}/twitter/lookup`,
        {
          params: {
            tweetIds: tweetIds.join(',')
          }
        }
      )
      if (response.error.value) {
        alert(`[Error] Failed to tweets lookup: ${response.error.value}`)
        return
      }
      if (!response || !response.data.value) {
        return
      }
      const tweets = response.data.value
      this.likedTweetIds = tweets.filter((tweet) => tweet.favorited).map((tweet) => tweet.id_str)
    },
    /**
     * ツイートをいいねする
     *
     * @param tweetId ツイート ID
     */
    like(tweetId: string): Promise<void> {
      const config = useRuntimeConfig()
      return new Promise<void>((resolve, reject) => {
        useFetch<void>(`${config.public.apiBaseURL}/twitter/like`, {
          method: 'POST',
          body: JSON.stringify({ tweetId })
        }).then((result) => {
          if (result && result.error.value && result.error.value.response && result.error.value.response._data) {
            reject(new Error(result.error.value.response._data))
            return
          }
          this.likedTweetIds.push(tweetId)
          resolve()
        })
      })
    }
  }
})
