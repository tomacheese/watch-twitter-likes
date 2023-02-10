import fastify, { FastifyInstance } from 'fastify'
import { BaseRouter } from './base-router'
import { getConfig } from './config'
import { ApiRouter } from './endpoints/api-router'
import cors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { TwitterRouter } from './endpoints/twitter-router'
import { Logger } from './logger'

/**
 * Fastify アプリケーションを構築する
 *
 * @returns Fastify アプリケーション
 */
export function buildApp(): FastifyInstance {
  const logger = Logger.configure('buildApp')
  const config = getConfig()

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

  routers.forEach((router) => {
    logger.info(`⏩Initializing route: ${router.constructor.name}`)
    router.init()
  })

  return app
}
