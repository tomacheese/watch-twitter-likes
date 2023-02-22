import { WTLBrowser } from './browser'
import { getConfig } from './config'
import { Crawler } from './crawler'
import { AppDataSource } from './database'
import { Discord } from './discord'
import { Logger } from './logger'
;(async () => {
  const logger = Logger.configure('main')
  logger.info('🚀 Starting...')

  logger.info('⏩ Initializing database...')
  await AppDataSource.initialize()
  logger.info('✅ Database initialized')

  const config = getConfig()

  const browser = await WTLBrowser.init(config.twitter)
  logger.info('✅ Browser initialized')

  const discord = new Discord(config, browser)
  await discord.waitReady()
  logger.info('✅ Discord initialized')

  setInterval(async () => {
    await Crawler.crawlAll(browser, discord.getClient())
  }, 1000 * 60 * 10) // 10分ごとに実行

  await Crawler.crawlAll(browser, discord.getClient())
})()
