import { FastifyRequest, FastifyReply } from "fastify"
import { BaseRouter } from "@/base-router"
import { DBItem } from "@/entities/item"

export class ApiRouter extends BaseRouter {
  init(): void {
    this.fastify.register((fastify, _, done) => {
      fastify.get('/images', this.routeGetImages.bind(this))
      done()
    })
  }

  async routeGetImages(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const items = await DBItem.find({
      relations: ['tweet', 'tweet.user', 'images', 'target'],
    })
    reply.send(items)
  }
}