import { buildApp } from './api'
import { getConfig, WTLConfiguration } from './config'
import { Crawler } from './crawler'
import { AppDataSource } from './database'
import { Discord } from './discord'
import { Logger } from '@book000/node-utils'
import { Twitter } from '@book000/twitterts'

function isTrue(s: string | undefined) {
  if (!s) return false // undefined or null -> false
  return ['true', '1', 'yes', 'y'].includes(s.toLocaleLowerCase())
}

async function startApi(config: WTLConfiguration) {
  const logger = Logger.configure('startApi')
  const host = process.env.API_HOST ?? '0.0.0.0'
  const port = process.env.API_PORT
    ? Number.parseInt(process.env.API_PORT, 10)
    : 8000

  const app = await buildApp(config)
  app.listen({ host, port }, (error, address) => {
    if (error) {
      logger.error('❌ Fastify.listen error', error)
    }
    logger.info(`✅ API Server listening at ${address}`)
  })
}

;(async () => {
  const logger = Logger.configure('main')
  logger.info('🚀 Starting...')

  let twitter: Twitter | undefined
  let discord: Discord | undefined

  try {
    logger.info('⏩ Initializing database...')
    await AppDataSource.initialize()
    logger.info('✅ Database initialized')

    if (!isTrue(process.env.DISABLE_MIGRATION)) {
      logger.info('⏩ Running database migration...')
      await AppDataSource.runMigrations()
      logger.info('✅ Database migration finished')
    }

    if (!isTrue(process.env.DISABLE_SYNCHRONIZE)) {
      logger.info('⏩ Synchronizing database...')
      await AppDataSource.synchronize()
      logger.info('✅ Database synchronized')
    }

    const config = getConfig()

    const enableApi = !isTrue(process.env.DISABLE_API)
    if (enableApi) {
      await startApi(config)
    } else {
      logger.warn('⚠️ API Server disabled')
    }

    const enableTwitter = !isTrue(process.env.DISABLE_TWITTER)
    if (enableTwitter) {
      twitter = await Twitter.login({
        username: config.twitter.username,
        password: config.twitter.password,
        otpSecret: config.twitter.authCodeSecret,
        puppeteerOptions: {
          userDataDirectory: '/data/userdata',
          executablePath: process.env.CHROMIUM_PATH,
        },
        debugOptions: {
          outputResponse: {
            enable: true,
          },
        },
      })
      logger.info('✅ Twitter initialized')
    } else {
      logger.warn('⚠️ Twitter disabled')
    }

    const enableDiscord = !isTrue(process.env.DISABLE_DISCORD)
    if (enableDiscord) {
      discord = new Discord(config, twitter)
      await discord.waitReady()
      logger.info('✅ Discord initialized')
    } else {
      logger.warn('⚠️ Discord linking feature disabled')
    }

    if (!twitter) {
      logger.warn('⚠️ Twitter is not initialized. The crawler will not work.')
      return
    }

    setInterval(
      () => {
        if (!twitter) {
          logger.error('❌ Twitter is not initialized!')
          return
        }
        Crawler.crawlAll(twitter, discord).catch((error: unknown) => {
          logger.error('❌ Failed to crawl', error as Error)
        })
      },
      1000 * 60 * 10
    ) // 10分ごとに実行

    await Crawler.crawlAll(twitter, discord)
  } catch (error) {
    logger.error('❌ Uncaught error', error as Error)

    if (twitter) {
      logger.info('👋 Closing twitter...')
      await twitter.close()
      logger.info('✅ Twitter closed')
    }
    if (discord) {
      logger.info('👋 Closing Discord client...')
      await discord.close()
      logger.info('✅ Discord client closed')
    }
    if (AppDataSource.isInitialized) {
      logger.info('👋 Closing database connection...')
      await AppDataSource.destroy()
      logger.info('✅ Database connection closed')
    }
  }
})()
