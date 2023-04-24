import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  Client,
  Interaction,
  Message,
} from 'discord.js'
import { WTLBrowser } from './browser'
import { WTLConfiguration } from './config'
import { Logger } from '@book000/node-utils'
import { Twitter } from './twitter'

export class Discord {
  private readonly logger = Logger.configure('Discord')
  private readonly browser: WTLBrowser | undefined
  private readonly client: Client
  private readonly config: WTLConfiguration

  constructor(config: WTLConfiguration, browser: WTLBrowser | undefined) {
    this.client = new Client({
      intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
    })
    this.client.on('ready', this.onReady.bind(this))
    this.client.on('interactionCreate', this.onInteractionCreate.bind(this))

    // 1時間ごとに interactionCreate を再登録する
    setInterval(() => {
      this.logger.info('🔄 Re-registering interactionCreate handler')
      this.client.off('interactionCreate', this.onInteractionCreate.bind(this))
      this.client.on('interactionCreate', this.onInteractionCreate.bind(this))
    }, 1000 * 60 * 60)

    this.client.login(config.discord.token)

    this.config = config
    this.browser = browser
  }

  public getClient() {
    return this.client
  }

  public close() {
    this.client.destroy()
  }

  async onReady() {
    this.logger.info(`👌 ready: ${this.client.user?.tag}`)
  }

  async onInteractionCreate(interaction: Interaction) {
    if (!interaction.isButton()) return

    this.logger.info(`🔳 interactionCreate@Button: ${interaction.customId}`)

    const customIds = interaction.customId.split('-')
    if (customIds.length !== 2) return

    const [action, tweetId] = customIds

    if (interaction.user.id !== this.config.twitter.discordUserId) {
      await interaction.reply({
        content:
          'あなたはこのボタンを利用することができません。他のボタンをお試しください。',
        ephemeral: true,
      })
      return
    }

    switch (action) {
      case 'favorite': {
        await this.actionFavorite(interaction, tweetId)
      }
    }
  }

  waitReady() {
    return new Promise<void>((resolve) => {
      if (this.client.isReady()) {
        resolve()
      }
      this.client.once('ready', () => {
        resolve()
      })
    })
  }

  async actionFavorite(
    interaction: ButtonInteraction<CacheType>,
    tweetId: string
  ) {
    if (!this.browser) {
      await interaction.reply({
        content: ':warning: Disabled browser! This feature is not available.',
        ephemeral: true,
      })
      return
    }
    const twitter = new Twitter(this.browser)
    await interaction.deferReply({
      ephemeral: true,
    })

    // first try
    const result = await this.likeTweet(twitter, tweetId)
    if (result.status) {
      await interaction.editReply({
        content: ':green_heart: -> :white_check_mark:',
      })

      await this.disableFavoriteButton(interaction.message, tweetId)
    } else {
      // failed retry
      await interaction.editReply({
        content: `:arrows_counterclockwise: :x: (${result.error.message}). Retrying...`,
      })

      const resultRetry = await this.likeTweet(twitter, tweetId)
      const content = resultRetry.status
        ? ':green_heart: -> :white_check_mark:'
        : `:green_heart: -> :x: (${result.error.message})`
      await interaction.editReply({
        content,
      })

      await (resultRetry.status
        ? this.disableFavoriteButton(interaction.message, tweetId)
        : interaction.user.createDM().then(async (dm) => {
            await dm.send({
              content: `:warning: Failed to like tweet: ${tweetId}\n\`\`\`\n${result.error.message}\n\`\`\`\n${interaction.message.url}`,
            })
          }))
    }
  }

  async likeTweet(twitter: Twitter, tweetId: string) {
    return await twitter
      .likeTweet(tweetId)
      .then(async () => {
        return {
          status: true,
          error: new Error('No error'),
        }
      })
      .catch(async (error) => {
        return {
          status: false,
          error,
        }
      })
  }

  async disableFavoriteButton(message: Message, tweetId: string) {
    const component = Discord.getButtonComponents(tweetId, true)

    await message.edit({
      components: component,
    })
  }

  public static getButtonComponents(tweetId: string, isFavorite: boolean) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`favorite-${tweetId}`)
          .setEmoji('💚')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(isFavorite),
        new ButtonBuilder()
          .setEmoji('🔁')
          .setURL(`https://twitter.com/intent/retweet?tweet_id=${tweetId}`)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setEmoji('❤️')
          .setURL(`https://twitter.com/intent/like?tweet_id=${tweetId}`)
          .setStyle(ButtonStyle.Link)
      ),
    ]
  }
}
