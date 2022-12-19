import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { EndPoints } from './endpoint'

/**
 * Fastify アプリケーションを構築する
 *
 * @returns Fastify アプリケーション
 */
export function buildApp(): FastifyInstance {
  const app = fastify()
  app.register(cors)

  const endpoints = new EndPoints(app)
  endpoints.init()

  return app
}
