import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  Interaction,
  Message,
} from 'discord.js'
import { WTLConfiguration } from './config'
import { Logger } from '@book000/node-utils'
import { AlreadyLikedError, Twitter } from '@book000/twitterts'

export class Discord {
  private readonly logger = Logger.configure('Discord')
  private readonly twitter: Twitter | undefined
  private readonly client: Client
  private readonly config: WTLConfiguration

  private onInteractionFunction: (interaction: Interaction) => void

  constructor(config: WTLConfiguration, twitter: Twitter | undefined) {
    const logger = Logger.configure('Discord.constructor')
    this.client = new Client({
      intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
    })
    this.client.on('ready', this.onReady.bind(this))
    this.onInteractionFunction = (interaction) => {
      this.onInteractionCreate(interaction).catch((error: unknown) => {
        logger.error('❌ Failed to run onInteractionCreate', error as Error)
      })
    }
    this.client.on('interactionCreate', this.onInteractionFunction)

    // 1時間ごとに interactionCreate を再登録する
    setInterval(
      () => {
        this.logger.info('🔄 Re-registering interactionCreate handler')
        this.client.off('interactionCreate', this.onInteractionFunction)
        this.client.on('interactionCreate', this.onInteractionFunction)
      },
      1000 * 60 * 60
    )
    this.config = config
    this.twitter = twitter

    this.client.login(config.discord.token).catch((error: unknown) => {
      logger.error('❌ Failed to login', error as Error)
    })
  }

  public getClient() {
    return this.client
  }

  public async close() {
    await this.client.destroy()
  }

  onReady() {
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

  async actionFavorite(interaction: ButtonInteraction, tweetId: string) {
    if (!this.twitter) {
      await interaction.reply({
        content: ':warning: Disabled twitter! This feature is not available.',
        ephemeral: true,
      })
      return
    }
    await interaction.deferReply({
      ephemeral: true,
    })

    // first try
    const result = await this.likeTweet(tweetId)
    if (result.status) {
      await interaction.editReply({
        content: ':green_heart: -> :white_check_mark:',
      })

      await this.disableFavoriteButton(interaction.message, tweetId)
    } else {
      // failed retry
      await interaction.editReply({
        content: `:arrows_counterclockwise: :x: (${result.message}). Retrying...`,
      })

      const resultRetry = await this.likeTweet(tweetId)
      const content = resultRetry.status
        ? ':green_heart: -> :white_check_mark:'
        : `:green_heart: -> :x: (${result.message})`
      await interaction.editReply({
        content,
      })

      await (resultRetry.status
        ? this.disableFavoriteButton(interaction.message, tweetId)
        : interaction.user.createDM().then(async (dm) => {
            await dm.send({
              content: `:warning: Failed to like tweet: ${tweetId}\n\`\`\`\n${result.message}\n\`\`\`\n${interaction.message.url}`,
              components: Discord.getButtonComponents(tweetId, false),
            })
          }))
    }
  }

  async likeTweet(
    tweetId: string
  ): Promise<{ status: boolean; message: string }> {
    if (!this.twitter) {
      throw new Error('Twitter is not initialized')
    }
    return await this.twitter
      .likeTweet({
        tweetId,
      })
      .then(() => {
        return {
          status: true,
          message: 'Success',
        }
      })
      .catch((error: unknown) => {
        if (error instanceof AlreadyLikedError) {
          return {
            status: true,
            message: 'Already liked',
          }
        }
        return {
          status: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      })
  }

  async disableFavoriteButton(message: Message, tweetId: string) {
    const component = Discord.getButtonComponents(tweetId, true)

    if (message.channel.partial) {
      await message.channel.fetch()
    }

    if (!message.editable) {
      await message.delete()
      return
    }

    await message.edit({
      components: component,
    })
  }

  public static getButtonComponents(tweetId: string, isFavorite: boolean) {
    const components: ButtonBuilder[] = []
    components.push(
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
    )

    return [new ActionRowBuilder<ButtonBuilder>().addComponents(...components)]
  }
}
