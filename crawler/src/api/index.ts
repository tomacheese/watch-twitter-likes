import fastify, { FastifyInstance } from 'fastify'
import { BaseRouter } from './base-router'
import cors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { WTLConfiguration } from '@/config'
import { Logger } from '@book000/node-utils'
import { ApiRouter } from './endpoint/api-router'
import { TwitterRouter } from './endpoint/twitter-router'

/**
 * Fastify アプリケーションを構築する
 *
 * @returns Fastify アプリケーション
 */
export async function buildApp(
  config: WTLConfiguration
): Promise<Promise<FastifyInstance>> {
  const logger = Logger.configure('buildApp')

  const app = fastify()
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
  await app.register(fastifyCookie)
  if (config.session) {
    await app.register(fastifySession, {
      cookieName: 'wtl_session',
      secret: config.session.secret,
      cookie: {
        secure: config.session.isSecure ?? false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  }

  // routers
  const routers: BaseRouter[] = [
    new ApiRouter(app, config),
    new TwitterRouter(app, config),
  ]

  for (const router of routers) {
    logger.info(`⏩ Initializing route: ${router.constructor.name}`)
    await router.init()
  }

  return app
}
