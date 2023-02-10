import { Configuration, TwitterAccount } from './config'
import axios, { AxiosInstance } from 'axios'
import { Status } from 'twitter-d'

export class TwApi {
  private twApiAxios: AxiosInstance
  private baseUrl: string

  constructor(config: Configuration) {
    this.twApiAxios = axios.create({
      baseURL: config.twapi.baseUrl,
      auth: {
        username: config.twapi.basicUsername,
        password: config.twapi.basicPassword,
      },
    })
    this.baseUrl = config.twapi.baseUrl
  }

  public async getUserLikes(userId: string, limit: number): Promise<Status[]> {
    const response = await this.twApiAxios.get(`/users/likes`, {
      params: {
        user_id: userId,
        limit,
      },
    })
    return response.data
  }

  public async likeTweet(
    account: TwitterAccount,
    tweetId: string
  ): Promise<void> {
    await axios.post(
      `/tweets/${tweetId}/like`,
      {},
      {
        baseURL: this.baseUrl,
        auth: {
          username: account.basicUsername,
          password: account.basicPassword,
        },
      }
    )
  }
}
