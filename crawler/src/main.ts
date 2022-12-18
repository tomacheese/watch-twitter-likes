import { Client } from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import Crawler from './crawler'
import { DBTarget } from './entities/targets'
import { AppDataSource } from './mysql'
import { Config, getConfig } from './config'
import { actionFavorite } from './messageAction'
import { buildApp } from './server'
import { migrateTweetHashTags } from './migration'

const config = getConfig()
const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
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
  const customIds = interaction.customId.split('-') // ACTION-ACCOUNTNAME-TWEETID
  if (customIds.length !== 3) return
  const action = customIds[0]
  const accountName = customIds[1]
  const tweetId = customIds[2]

  const account = config.twitter.accounts.find((a) => a.name === accountName)
  if (!account) {
    console.log(`Account not found: ${accountName}`)
    return
  }

  if (interaction.user.id !== account.discordUserId) {
    await interaction.reply({
      content:
        'あなたはこのボタンを利用することができません。他のボタンをお試しください。',
      ephemeral: true,
    })
    return
  }

  switch (action) {
    case 'favorite':
      await actionFavorite(interaction, account, tweetId)
  }
})

async function main() {
  console.log('Initializing database...')
  await AppDataSource.initialize()
  console.log('Database initialized')

  if (!config.discord.token) {
    console.error('Discord token is not set.')
    process.exit(1)
  }

  await client.login(config.discord.token)
  console.log('Login Successful.')

  // migration
  await migrateTweetHashTags(
    new TwitterApi({
      appKey: config.twitter.consumerKey,
      appSecret: config.twitter.consumerSecret,
    })
  )

  const app = buildApp()
  const host = process.env.API_HOST || '0.0.0.0'
  const port = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 8000
  app.listen({ host, port }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

;(async () => {
  await main()
})()
