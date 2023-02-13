import { isAxiosError } from 'axios'
import {
  ButtonInteraction,
  CacheType,
  InteractionEditReplyOptions,
} from 'discord.js'
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

  await interaction.deferReply({
    ephemeral: true,
  })

  try {
    const data: InteractionEditReplyOptions = await twApi
      .likeTweet(account, tweetId)
      .then(() => {
        return {
          content: `${account.emoji} -> :white_check_mark:`,
        }
      })
      .catch(async (e) => {
        // eslint-disable-next-line no-console
        console.log(e)
        if (isAxiosError(e)) {
          return {
            content: `${account.emoji} -> :x: ${(e as Error).message}\n${
              e.response?.data?.message
            }`,
          }
        }
        return {
          content: `${account.emoji} -> :x: ${e.message}`,
        }
      })
    await interaction.editReply(data)
  } catch (e) {
    if (isAxiosError(e)) {
      await interaction.editReply({
        content: `${account.emoji} -> :x: ${(e as Error).message}\n${
          e.response?.data?.message
        }`,
      })
      return
    }
    await interaction.editReply({
      content: `${account.emoji} -> :x: ${(e as Error).message}`,
    })
  }
}
