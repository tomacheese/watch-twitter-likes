import { FastifyInstance } from 'fastify'
import { Config } from './config'

/**
 * REST API ルーターの基底クラス
 */
export abstract class BaseRouter {
  protected fastify: FastifyInstance
  protected config: Config

  constructor(fastify: FastifyInstance, config: Config) {
    this.fastify = fastify
    this.config = config
  }

  /**
   * ルーターを初期化する
   *
   * this.fastify.register() でルーターを登録する
   */
  abstract init(): void
}
