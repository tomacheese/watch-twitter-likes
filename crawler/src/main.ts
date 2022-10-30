import axios from 'axios'
import { Client } from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import Crawler from './crawler'
import { DBTarget } from './entities/targets'
import { AppDataSource } from './mysql'
import { Config, getConfig } from './config'

const config = getConfig()
const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
})
const twitterClient = new TwitterApi({
  appKey: config.twitter.consumerKey,
  appSecret: config.twitter.consumerSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
})

export function getClient() {
  return client
}

async function crawl(config: Config, client: Client) {
  const targets = await DBTarget.find()
  for (const target of targets) {
    const crawler = new Crawler(
      new TwitterApi({
        appKey: config.twitter.consumerKey,
        appSecret: config.twitter.consumerSecret,
      }),
      client,
      target
    )
    await crawler.crawl()
  }
}

client.on('ready', async () => {
  console.log(`ready: ${client.user?.tag}`)

  setInterval(async () => {
    await crawl(config, client)
  }, 1000 * 60 * 10)
  await crawl(config, client)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return
  console.log('interactionCreate@Button: ' + interaction.id)
  if (interaction.customId.startsWith('favorite-')) {
    if (interaction.user.id !== config.discord.ownerId) {
      await interaction.reply({
        content:
          'このボタンはbook000でふぁぼする用のボタンです。リンクボタンを利用してください。',
        ephemeral: true,
      })
      return
    }
    const tweetId = interaction.customId.split('-')[1]
    await twitterClient.v1
      .post(`favorites/create.json`, {
        id: tweetId,
      })
      .then(() => {
        interaction.reply({
          content: ':heart: -> :white_check_mark:',
          ephemeral: true,
        })
      })
      .catch((e) => {
        interaction.reply({
          content: `:heart: -> :x: ${e.message}`,
          ephemeral: true,
        })
      })
  }
  if (interaction.customId.startsWith('priv-fav-')) {
    if (interaction.user.id !== config.discord.ownerId) {
      await interaction.reply({
        content: 'リンクボタンを利用してください。',
        ephemeral: true,
      })
      return
    }
    const tweetId = interaction.customId.split('-')[2]
    await axios
      .post(`http://host.docker.internal:7003/favorite/${tweetId}`)
      .then(() => {
        interaction.reply({
          content: ':comet: -> :white_check_mark:',
          ephemeral: true,
        })
      })
      .catch((e) => {
        interaction.reply({
          content: `:comet: -> :x: ${e.message} ${
            e.response !== undefined ? e.response.data.detail : ''
          }`,
          ephemeral: true,
        })
      })
  }
})

async function main() {
  console.log('Initializing database...')
  await AppDataSource.initialize()
  console.log('Database initialized')

  await client.login(config.discord.token)
  console.log('Login Successful.')
}

;(async () => {
  await main()
})()
