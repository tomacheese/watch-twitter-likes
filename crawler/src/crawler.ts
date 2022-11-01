import {
  ActionRowBuilder,
  AnyThreadChannel,
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  Client,
  TextChannel,
  ThreadChannel,
} from 'discord.js'
import { MediaSizesV1, TweetV1, TwitterApi } from 'twitter-api-v2'
import { getConfig } from './config'
import { DBItem } from './entities/item'
import { DBTarget } from './entities/targets'
import { getDBImage, getDBTweet, getDBUser } from './mysql'

export default class Crawler {
  private client: TwitterApi
  private channel: TextChannel | AnyThreadChannel
  private target: DBTarget

  constructor(twitterApi: TwitterApi, discordClient: Client, target: DBTarget) {
    this.client = twitterApi
    this.target = target

    const channel = discordClient.channels.resolve(target.threadId.toString())
    if (!channel) {
      throw new Error('Channel not found.')
    }
    if (!channel.isTextBased()) {
      throw new Error('Channel is not text based.')
    }
    this.channel = channel as TextChannel | AnyThreadChannel
  }

  /** 収集処理 */
  public async crawl(): Promise<void> {
    if (
      this.channel instanceof ThreadChannel &&
      !(this.channel as ThreadChannel).joined
    ) {
      await (this.channel as ThreadChannel).join()
    }

    const favorites = await this.client.v1.favoriteTimeline(
      this.target.userId.toString(),
      {
        count: 200,
        include_entities: true,
      }
    )
    const tweets = favorites.tweets

    const isFirst =
      (await DBItem.count({
        where: {
          target: {
            userId: this.target.userId,
          },
        },
      })) === 0
    const isNotified = async (tweet: TweetV1) => {
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
      if (await isNotified(tweet)) {
        continue // 既に通知済み
      }

      // DBにアイテム挿入
      await this.addNewItem(this.target, tweet)

      // Discordにメッセージ送信
      if (!isFirst) await this.sendMessage(tweet)
    }
  }

  /** DBにアイテム挿入 */
  private async addNewItem(target: DBTarget, tweet: TweetV1) {
    const extendedEntities = tweet.extended_entities
    if (!extendedEntities || !extendedEntities.media) {
      return
    }
    const dbUser = await getDBUser(tweet)
    const dbTweet = await getDBTweet(tweet, dbUser)

    const dbImages = []
    for (const media of extendedEntities.media) {
      if (media.type !== 'photo') {
        continue
      }
      for (const size of ['thumb', 'large', 'medium', 'small']) {
        dbImages.push(
          await getDBImage(dbTweet, media, size as keyof MediaSizesV1)
        )
      }
    }

    const dbItem = new DBItem()
    dbItem.tweet = dbTweet
    dbItem.target = target
    dbItem.images = dbImages
    await dbItem.save()
  }

  /** Discordにメッセージ送信 */
  private async sendMessage(tweet: TweetV1) {
    const tweetUrl =
      'https://twitter.com/' +
      tweet.user.screen_name +
      '/status/' +
      tweet.id_str

    console.log(tweetUrl)

    const config = getConfig()
    const components = config.twitter.accounts.map((account) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`favorite-${account.name}-${tweet.id_str}`)
          .setEmoji(account.emoji)
          .setStyle(ButtonStyle.Secondary)
      )
    })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...components,
      new ButtonBuilder()
        .setEmoji('🔁')
        .setURL(`https://twitter.com/intent/retweet?tweet_id=${tweet.id_str}`)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setEmoji('❤️')
        .setURL(`https://twitter.com/intent/like?tweet_id=${tweet.id_str}`)
        .setStyle(ButtonStyle.Link)
    )

    const embeds = []
    const extendedEntities = tweet.extended_entities
    if (!extendedEntities || !extendedEntities.media) {
      return
    }

    // 同一ツイートのうち、一番最初の画像だけに適用する
    const firstEmbed: APIEmbed = {
      description: tweet.full_text ?? tweet.text,
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
      author: {
        name: `${tweet.user.name} (@${tweet.user.screen_name})`,
        url: `https://twitter.com/${tweet.user.screen_name}`,
        icon_url: tweet.user.profile_image_url_https,
      },
    }
    // 同一ツイートのうち、一番最後の画像だけに適用する
    // 単一画像の場合は、一番最初の画像に適用する
    const lastEmbed: APIEmbed = {
      footer: {
        text: `Twitter by ${this.target.name} likes`,
      },
      timestamp: new Date(tweet.created_at).toISOString(),
    }

    for (const mediaIndex in extendedEntities.media) {
      const media = extendedEntities.media[mediaIndex]
      if (media.type !== 'photo') {
        continue
      }
      const title =
        extendedEntities.media.length >= 2
          ? `${parseInt(mediaIndex, 10) + 1} / ${extendedEntities.media.length}`
          : undefined
      embeds.push({
        title,
        image: {
          url: media.media_url_https,
        },
        color: 0x1d9bf0,
        ...(parseInt(mediaIndex, 10) === 0 ? firstEmbed : {}),
        ...(parseInt(mediaIndex, 10) === extendedEntities.media.length - 1
          ? lastEmbed
          : {}),
      })
    }

    await this.channel.send({
      embeds,
      components: [row],
    })
  }
}
