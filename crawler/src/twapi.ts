import { Configuration } from './config'
import axios, { AxiosInstance } from 'axios'
import { Status } from 'twitter-d'

export class TwApi {
  private twApiAxios: AxiosInstance

  constructor(config: Configuration) {
    this.twApiAxios = axios.create({
      baseURL: config.twapi.baseUrl,
      auth: {
        username: config.twapi.basicUsername,
        password: config.twapi.basicPassword,
      },
    })
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

  public async likeTweet(tweetId: string): Promise<void> {
    await this.twApiAxios.post(`/tweets/${tweetId}/like`)
  }
}
