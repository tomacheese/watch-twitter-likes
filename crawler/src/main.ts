import { Client, Interaction } from 'discord.js'
import Crawler from './crawler'
import { DBTarget } from './entities/targets'
import { AppDataSource } from './mysql'
import { Configuration, getConfig } from './config'
import { actionFavorite } from './messageAction'
import { buildApp } from './server'
import { TwApi } from './twapi'
import { Logger } from './logger'
const logger = Logger.configure('main')

const config = getConfig()
const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
})

export function getClient() {
  return client
}

async function crawl(config: Configuration, client: Client) {
  const targets = await DBTarget.find()
  for (const target of targets) {
    const crawler = new Crawler(new TwApi(config), client, target)
    await crawler.crawl()
  }
}

client.on('ready', async () => {
  logger.info(`👌 ready: ${client.user?.tag}`)

  setInterval(async () => {
    await crawl(config, client)
  }, 1000 * 60 * 10)
  await crawl(config, client)
})

const interactionCreateHandler: (interaction: Interaction) => void = async (
  interaction
) => {
  if (!interaction.isButton()) return
  logger.info('🔳 interactionCreate@Button: ' + interaction.id)
  const customIds = interaction.customId.split('-') // ACTION-ACCOUNTNAME-TWEETID
  if (customIds.length !== 3) return
  const action = customIds[0]
  const accountName = customIds[1]
  const tweetId = customIds[2]

  const account = config.twitter.accounts.find((a) => a.name === accountName)
  if (!account) {
    logger.warn(`🚫 Account not found: ${accountName}`)
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
}

client.on('interactionCreate', interactionCreateHandler)
// 1時間ごとに再登録
setInterval(() => {
  logger.info('🟢 Re-register interactionCreate handler')
  client.off('interactionCreate', interactionCreateHandler)
  client.on('interactionCreate', interactionCreateHandler)
}, 1000 * 60 * 60)

client.on('error', (error) => {
  logger.error('❌ discord.js@error:', error)
})

client.on('warn', (warn) => {
  logger.warn(`❗ discord.js@warn: ${warn}`)
})

client.on('shardError', (error) => {
  logger.error('❌ discord.js@shardError:', error)
})

async function main() {
  logger.info('⏩ Initializing database...')
  await AppDataSource.initialize()
  logger.info('🆗 Database initialized')

  if (!config.discord.token) {
    logger.error('❌ Discord token is not set.')
    process.exit(1)
  }

  await client.login(config.discord.token)
  logger.info('✅ Login Successful.')

  const app = buildApp()
  const host = process.env.API_HOST || '0.0.0.0'
  const port = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 8000
  app.listen({ host, port }, (err, address) => {
    if (err) {
      logger.error('❌ Fastify.listen error', err)
      process.exit(1)
    }
    logger.info(`✅ Server listening at ${address}`)
  })
}

;(async () => {
  await main()
})()
