import { ButtonInteraction, CacheType } from 'discord.js'
import { getConfig, TwitterAccount } from './config'
import { Logger } from './logger'
import { TwApi } from './twapi'

export async function actionFavorite(
  interaction: ButtonInteraction<CacheType>,
  account: TwitterAccount,
  tweetId: string
) {
  const logger = Logger.configure('actionFavorite')
  logger.info(`🔳 actionFavorite: ${account.name} ${tweetId}`)

  const config = getConfig()
  const twApi = new TwApi(config)
  try {
    const data = await twApi
      .likeTweet(tweetId)
      .then(() => {
        return {
          content: `${account.emoji} -> :white_check_mark:`,
          ephemeral: true,
        }
      })
      .catch((e) => {
        return {
          content: `${account.emoji} -> :x: ${e.message}`,
          ephemeral: true,
        }
      })
    await interaction.reply(data)
  } catch (e) {
    await interaction.reply({
      content: `${account.emoji} -> :x: ${(e as Error).message}`,
      ephemeral: true,
    })
  }
}
