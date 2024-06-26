import { DBTarget } from './entities/targets'
import {
  AnyThreadChannel,
  APIEmbed,
  AttachmentBuilder,
  Client,
  TextChannel,
} from 'discord.js'
import { Logger } from '@book000/node-utils'
import { DBItem } from './entities/item'
import { DBMute } from './entities/mutes'
import { FullUser, Status, User } from 'twitter-d'
import { getDBMedia, getDBTweet, getDBUser } from './database'
import { Discord } from './discord'
import axios from 'axios'
import { WriteStream } from 'node:fs'
import { Twitter } from '@book000/twitterts'

export class Crawler {
  private readonly twitter: Twitter
  private readonly target: DBTarget
  private readonly client?: Client
  private channel?: TextChannel | AnyThreadChannel

  private readonly logger

  constructor(
    twitter: Twitter,
    discord: Discord | undefined,
    target: DBTarget
  ) {
    this.target = target
    this.twitter = twitter

    this.logger = Logger.configure(`Crawler@${target.name}`)

    if (!target.threadId) {
      return
    }
    if (!discord) {
      this.logger.warn(
        '⚠️ Discord linking feature disabled. The send message to Discord feature will not work.'
      )
      return
    }

    this.client = discord.getClient()
  }

  public async crawl() {
    this.logger.info(
      `👀 Crawling ${this.target.name} (${this.target.userId})...`
    )

    const screenName = await this.twitter
      .getScreenNameByUserId({
        userId: this.target.userId,
      })
      .catch((error: unknown) => {
        this.logger.error('Failed to get screen name.', error as Error)
      })
    if (!screenName) {
      return
    }
    this.logger.info(`👤 Screen name: ${screenName}`)

    const tweets = await this.twitter.getUserLikeTweets({
      screenName,
      limit: 100,
    })
    this.logger.info(`📝 Tweets: ${tweets.length}`)

    const isFirst = await this.isFirstCrawl()

    let countInserted = 0
    let countNotified = 0
    let countMuted = 0

    const notifyTweets = []
    for (const tweet of tweets) {
      if (!tweet.entities.media) {
        continue // メディアがない
      }
      const extendedEntities = tweet.extended_entities
      if (!extendedEntities?.media) {
        continue // 拡張メディアがない
      }
      if (Number.isNaN(tweet.user.id)) {
        continue // ユーザーが存在しない
      }

      if (await this.isNotified(tweet)) {
        countNotified++
        continue // 既に通知済み
      }
      if (await this.isMuted(tweet)) {
        countMuted++
        continue // ミュートされている
      }

      // DBにアイテム挿入
      await this.addNewItem(this.target, tweet)
      countInserted++

      // 通知対象に追加
      notifyTweets.push(tweet)
    }

    if (!this.target.threadId) {
      this.logger.warn(
        '⚠️ Thread ID is not defined. The send message to Discord feature will not work.'
      )
      return
    }
    if (!this.client) {
      this.logger.warn(
        '⚠️ Discord client is not initialized. The send message to Discord feature will not work.'
      )
      return
    }

    const channel = await this.client.channels.fetch(
      this.target.threadId.toString()
    )
    if (!channel) {
      throw new Error('Channel not found.')
    }
    if (!channel.isTextBased()) {
      throw new Error('Channel is not text based.')
    }
    this.channel = channel as TextChannel | AnyThreadChannel

    this.logger.info(`🔔 NotifyTweets: ${notifyTweets.length}`)

    // Discordにメッセージ送信
    if (!isFirst && notifyTweets.length > 0) {
      await this.channel.sendTyping()
      for (const tweet of notifyTweets) {
        await this.sendMessage(tweet)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    this.logger.info('👀 Crawled: ' + this.target.name)
    this.logger.info('👀 | Tweets: ' + tweets.length.toString())
    this.logger.info('👀 | Inserted: ' + countInserted.toString())
    this.logger.info('👀 | Notified: ' + countNotified.toString())
    this.logger.info('👀 | Muted: ' + countMuted.toString())
  }

  /** DBにアイテム挿入 */
  private async addNewItem(target: DBTarget, tweet: Status) {
    const extendedEntities = tweet.extended_entities
    if (!extendedEntities?.media) {
      return
    }
    const databaseUser = await getDBUser(tweet)
    const databaseTweet = await getDBTweet(tweet, databaseUser)

    const databaseMedia = []
    for (const media of extendedEntities.media) {
      for (const size of ['thumb', 'large', 'medium', 'small'] as const) {
        databaseMedia.push(await getDBMedia(databaseTweet, media, size))
      }
    }

    const databaseItem = new DBItem()
    databaseItem.tweet = databaseTweet
    databaseItem.target = target
    databaseItem.media = databaseMedia
    await databaseItem.save()
  }

  /** Discordにメッセージ送信 */
  private async sendMessage(tweet: Status) {
    const logger = Logger.configure('Crawler.sendMessage')
    if (!this.channel) {
      return
    }
    if (!this.isFullUser(tweet.user)) {
      throw new Error(`User is not full user: ${tweet.user.id_str}`)
    }
    const tweetUrl =
      'https://twitter.com/' +
      tweet.user.screen_name +
      '/status/' +
      tweet.id_str

    logger.info(`🔗 ${tweetUrl}`)

    const components = Discord.getButtonComponents(
      tweet.id_str,
      tweet.favorited
    )

    const extendedEntities = tweet.extended_entities
    if (!extendedEntities?.media) {
      return
    }

    const firstEmbed: APIEmbed = {
      description: tweet.full_text,
      fields: [
        {
          name: 'Retweet',
          value: tweet.retweet_count.toString(),
          inline: true,
        },
        {
          name: 'Likes',
          value: tweet.favorite_count.toString(),
          inline: true,
        },
        {
          name: 'TweetURL',
          value: tweetUrl,
          inline: false,
        },
      ],
      color: 0x1d_9b_f0,
      author: {
        name: `${tweet.user.name} (@${tweet.user.screen_name})`,
        url: `https://twitter.com/${tweet.user.screen_name}`,
        icon_url: tweet.user.profile_image_url_https,
      },
    }

    const lastEmbed: APIEmbed = {
      color: 0x1d_9b_f0,
      footer: {
        text: `Twitter by ${this.target.name} likes`,
      },
      timestamp: new Date(tweet.created_at).toISOString(),
    }

    const medias = extendedEntities.media
    const promises = []
    for (const media of medias) {
      promises.push(
        axios
          .get<WriteStream>(media.media_url_https, {
            responseType: 'stream',
          })
          .then((response) => {
            return response.data
          })
      )
    }
    const streams: WriteStream[] = await Promise.all(promises)
    const attachments: AttachmentBuilder[] = streams.map((stream, index) => {
      const media = medias[index]
      return new AttachmentBuilder(stream)
        .setName(media.media_url_https.split('/').pop() ?? '')
        .setSpoiler(tweet.possibly_sensitive ?? false)
    })

    await this.channel.send({
      embeds: [firstEmbed],
    })
    await this.channel.send({
      embeds: [lastEmbed],
      files: attachments,
      components,
    })

    for (const stream of streams) {
      stream.destroy()
    }
  }

  private async isFirstCrawl() {
    return (
      (await DBItem.count({
        where: {
          target: {
            userId: this.target.userId,
          },
        },
      })) === 0
    )
  }

  private async isNotified(tweet: Status) {
    return (
      (await DBItem.count({
        where: {
          target: {
            userId: this.target.userId,
          },
          tweet: {
            tweetId: tweet.id_str,
          },
        },
      })) !== 0
    )
  }

  private async isMuted(tweet: Status) {
    const rows = await DBMute.find()
    return rows.some((row) => tweet.full_text.includes(row.text))
  }

  private isFullUser(user: User): user is FullUser {
    return 'screen_name' in user
  }

  public static async crawlAll(twitter: Twitter, discord: Discord | undefined) {
    const logger = Logger.configure('Crawler.crawlAll')

    // 同時にページを開くと上手く動かなくなったりするので、1つずつ開く
    logger.info(`👀 Crawling all targets...`)
    const targets = await DBTarget.find()
    for (const target of targets) {
      try {
        const crawler = new Crawler(twitter, discord, target)
        await crawler.crawl()
      } catch (error) {
        logger.error(`❌ Failed to crawl: ${target.name}`, error as Error)
      }
    }

    logger.info('👀 Crawled all targets successfully!')
  }
}
