import { ButtonInteraction, CacheType } from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import { getConfig, TwitterAccount } from './config'

export async function actionFavorite(
  interaction: ButtonInteraction<CacheType>,
  account: TwitterAccount,
  tweetId: string
) {
  console.log('actionFavorite: ' + tweetId)

  const config = getConfig()
  const twitterClient = new TwitterApi({
    appKey: config.twitter.consumerKey,
    appSecret: config.twitter.consumerSecret,
    accessToken: account.accessToken,
    accessSecret: account.accessSecret,
  })
  try {
    const data = await twitterClient.v1
      .post(`favorites/create.json`, {
        id: tweetId,
      })
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
