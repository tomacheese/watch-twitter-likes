import { buildApp } from './api'
import { WTLBrowser } from './browser'
import { getConfig, WTLConfiguration } from './config'
import { Crawler } from './crawler'
import { AppDataSource } from './database'
import { Discord } from './discord'
import { Logger } from './logger'

function isTrue(s: string | undefined) {
  if (!s) return false // undefined or null -> false
  return ['true', '1', 'yes', 'y'].includes(s.toLocaleLowerCase())
}

async function startApi(config: WTLConfiguration) {
  const logger = Logger.configure('startApi')
  const host = process.env.API_HOST || '0.0.0.0'
  const port = process.env.API_PORT
    ? Number.parseInt(process.env.API_PORT, 10)
    : 8000

  const app = buildApp(config)
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

  logger.info('⏩ Initializing database...')
  await AppDataSource.initialize()
  logger.info('✅ Database initialized')

  const config = getConfig()

  const enableApi = !isTrue(process.env.DISABLE_API)
  if (enableApi) {
    startApi(config)
  } else {
    logger.warn('⚠️ API Server disabled')
  }

  let browser: WTLBrowser | undefined
  const enableBrowser = !isTrue(process.env.DISABLE_BROWSER)
  if (enableBrowser) {
    browser = await WTLBrowser.init(config.twitter)
    logger.info('✅ Browser initialized')
  } else {
    logger.warn('⚠️ Browser disabled')
  }

  let discord: Discord | undefined
  const enableDiscord = !isTrue(process.env.DISABLE_DISCORD)
  if (enableDiscord) {
    discord = new Discord(config, browser)
    await discord.waitReady()
    logger.info('✅ Discord initialized')
  } else {
    logger.warn('⚠️ Discord linking feature disabled')
  }

  if (!browser) {
    logger.warn('⚠️ Browser is not initialized. The crawler will not work.')
    return
  }

  setInterval(async () => {
    if (!browser) {
      logger.error('❌ Browser is not initialized!')
      return
    }
    await Crawler.crawlAll(browser, discord)
  }, 1000 * 60 * 10) // 10分ごとに実行

  await Crawler.crawlAll(browser, discord)
})()
