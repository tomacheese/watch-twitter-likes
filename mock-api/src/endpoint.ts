import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import axios from 'axios'

export class EndPoints {
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
  }

  init(): void {
    this.fastify.register(
      (fastify, _, done) => {
        fastify.get('/targets', this.routeGetTargets.bind(this))
        fastify.post('/images', this.routePostImages.bind(this))
        done()
      },
      { prefix: '/api' }
    )
  }

  async routeGetTargets(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const response = await axios.get('https://likes.amatama.net/api/targets')
    if (response.status !== 200) {
      reply.code(500)
      reply.send({ error: 'Internal Server Error' })
      return
    }
    reply.send(response.data)
  }

  async routePostImages(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const response = await axios.post(
      'https://likes.amatama.net/api/images',
      request.body
    )
    if (response.status !== 200) {
      reply.code(500)
      reply.send({ error: 'Internal Server Error' })
      return
    }
    reply.send(response.data)
  }
}
