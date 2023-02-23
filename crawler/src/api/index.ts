import fastify, { FastifyInstance } from 'fastify'
import { BaseRouter } from './base-router'
import cors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { WTLConfiguration } from '@/config'
import { Logger } from '@/logger'
import { ApiRouter } from './endpoint/api-router'
import { TwitterRouter } from './endpoint/twitter-router'

/**
 * Fastify アプリケーションを構築する
 *
 * @returns Fastify アプリケーション
 */
export function buildApp(config: WTLConfiguration): FastifyInstance {
  const logger = Logger.configure('buildApp')

  const app = fastify()
  app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
  app.register(fastifyCookie)
  if (config.session) {
    app.register(fastifySession, {
      cookieName: 'wtl_session',
      secret: config.session.secret,
      cookie: {
        secure: config.session.isSecure || false,
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
    router.init()
  }

  return app
}
