import { WTLConfiguration } from '@/config'
import { FastifyInstance } from 'fastify'

/**
 * REST API ルーターの基底クラス
 */
export abstract class BaseRouter {
  protected fastify: FastifyInstance
  protected config: WTLConfiguration

  constructor(fastify: FastifyInstance, config: WTLConfiguration) {
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
