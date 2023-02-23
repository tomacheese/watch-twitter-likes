import { DBTarget } from './entities/targets'
import { AnyThreadChannel, APIEmbed, TextChannel } from 'discord.js'
import { Logger } from './logger'
import { WTLBrowser } from './browser'
import { Twitter } from './twitter'
import { DBItem } from './entities/item'
import { DBMute } from './entities/mutes'
import { FullUser, Status, User } from 'twitter-d'
import { getDBImage, getDBTweet, getDBUser } from './database'
import { Discord } from './discord'

export class Crawler {
  private readonly browser: WTLBrowser
  private readonly target: DBTarget
  private channel?: TextChannel | AnyThreadChannel

  private readonly logger

  constructor(
    browser: WTLBrowser,
    discord: Discord | undefined,
    target: DBTarget
  ) {
    this.target = target
    this.browser = browser

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

    const client = discord.getClient()
    const channel = client.channels.resolve(target.threadId.toString())
    if (!channel) {
      throw new Error('Channel not found.')
    }
    if (!channel.isTextBased()) {
      throw new Error('Channel is not text based.')
    }
    this.channel = channel as TextChannel | AnyThreadChannel
  }

  public async crawl() {
    this.logger.info(
      `👀 Crawling ${this.target.name} (${this.target.userId})...`
    )

    const twitter = new Twitter(this.browser)

    const screenName = await twitter
      .getUserScreenName(this.target.userId)
      .catch((error) => {
        this.logger.error('Failed to get screen name.', error)
      })
    if (!screenName) {
      return
    }
    this.logger.info(`👤 Screen name: ${screenName}`)

    const tweets = await twitter.getUserLikes(screenName, 100)
    this.logger.info(`📝 Tweets: ${tweets.length}`)

    const isFirst = await this.isFirstCrawl()

    let countInserted = 0
    let countNotified = 0
    let countMuted = 0
    for (const tweet of tweets) {
      if (!tweet.entities.media) {
        continue // メディアがない
      }
      const extendedEntities = tweet.extended_entities
      if (!extendedEntities || !extendedEntities.media) {
        return // 拡張メディアがない
      }
      if (extendedEntities.media.every((media) => media.type !== 'photo')) {
        continue // すべてのメディアが写真でない
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

      // Discordにメッセージ送信
      if (!isFirst) await this.sendMessage(tweet)
    }

    this.logger.info('👀 Crawled: ' + this.target.name)
    this.logger.info('👀 | Tweets: ' + tweets.length)
    this.logger.info('👀 | Inserted: ' + countInserted)
    this.logger.info('👀 | Notified: ' + countNotified)
    this.logger.info('👀 | Muted: ' + countMuted)
  }

  /** DBにアイテム挿入 */
  private async addNewItem(target: DBTarget, tweet: Status) {
    const extendedEntities = tweet.extended_entities
    if (!extendedEntities || !extendedEntities.media) {
      return
    }
    const databaseUser = await getDBUser(tweet)
    const databaseTweet = await getDBTweet(tweet, databaseUser)

    const databaseImages = []
    for (const media of extendedEntities.media) {
      if (media.type !== 'photo') {
        continue
      }
      for (const size of ['thumb', 'large', 'medium', 'small'] as const) {
        databaseImages.push(await getDBImage(databaseTweet, media, size))
      }
    }

    const databaseItem = new DBItem()
    databaseItem.tweet = databaseTweet
    databaseItem.target = target
    databaseItem.images = databaseImages
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

    const embeds = []
    const extendedEntities = tweet.extended_entities
    if (!extendedEntities || !extendedEntities.media) {
      return
    }

    // 同一ツイートのうち、一番最初の画像だけに適用する
    const firstEmbed: APIEmbed = {
      description: tweet.full_text,
      fields: [
        {
          name: 'Retweet',
          value: tweet.retweet_count.toString(),
          inline: true
        },
        {
          name: 'Likes',
          value: tweet.favorite_count.toString(),
          inline: true
        },
        {
          name: 'TweetURL',
          value: tweetUrl,
          inline: false
        }
      ],
      author: {
        name: `${tweet.user.name} (@${tweet.user.screen_name})`,
        url: `https://twitter.com/${tweet.user.screen_name}`,
        icon_url: tweet.user.profile_image_url_https
      }
    }
    // 同一ツイートのうち、一番最後の画像だけに適用する
    // 単一画像の場合は、一番最初の画像に適用する
    const lastEmbed: APIEmbed = {
      footer: {
        text: `Twitter by ${this.target.name} likes`
      },
      timestamp: new Date(tweet.created_at).toISOString()
    }

    for (const mediaIndex in extendedEntities.media) {
      const media = extendedEntities.media[mediaIndex]
      if (media.type !== 'photo') {
        continue
      }
      const title =
        extendedEntities.media.length >= 2
          ? `${Number.parseInt(mediaIndex, 10) + 1} / ${
              extendedEntities.media.length
            }`
          : undefined
      embeds.push({
        title,
        image: {
          url: media.media_url_https
        },
        color: 0x1d_9b_f0,
        ...(Number.parseInt(mediaIndex, 10) === 0 ? firstEmbed : {}),
        ...(Number.parseInt(mediaIndex, 10) ===
        extendedEntities.media.length - 1
          ? lastEmbed
          : {})
      })
    }

    await this.channel.send({
      embeds,
      components
    })
  }

  private async isFirstCrawl() {
    return (
      (await DBItem.count({
        where: {
          target: {
            userId: this.target.userId
          }
        }
      })) === 0
    )
  }

  private async isNotified(tweet: Status) {
    return (
      (await DBItem.count({
        where: {
          target: {
            userId: this.target.userId
          },
          tweet: {
            tweetId: tweet.id_str
          }
        }
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

  public static async crawlAll(
    browser: WTLBrowser,
    discord: Discord | undefined
  ) {
    const logger = Logger.configure('Crawler.crawlAll')

    const targets = await DBTarget.find()
    const promises = []
    for (const target of targets) {
      const crawler = new Crawler(browser, discord, target)
      promises.push(crawler.crawl())
    }

    logger.info(`👀 Crawling all targets: ${targets.length} targets`)
    await Promise.all(promises)
    logger.info('👀 Crawled all targets successfully!')
  }
}
