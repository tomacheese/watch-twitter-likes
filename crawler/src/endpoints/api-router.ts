import { FastifyRequest, FastifyReply } from 'fastify'
import { BaseRouter } from '@/base-router'
import { DBItem } from '@/entities/item'
import { Equal } from 'typeorm'
import { DBTarget } from '@/entities/targets'

interface ImagesQuery {
  targetIds?: string
  type?: 'or' | 'and'
  offset?: number
  limit?: number
}

export class ApiRouter extends BaseRouter {
  init(): void {
    this.fastify.register(
      (fastify, _, done) => {
        fastify.get('/targets', this.routeGetTargets.bind(this))
        fastify.get('/images', this.routeGetImages.bind(this))
        done()
      },
      { prefix: '/api' }
    )
  }

  async routeGetTargets(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const targets = await DBTarget.find()
    reply.send(targets)
  }

  async routeGetImages(
    request: FastifyRequest<{
      Querystring: ImagesQuery
    }>,
    reply: FastifyReply
  ): Promise<void> {
    // targets query
    const targetIds = request.query.targetIds
      ? request.query.targetIds.split(',')
      : undefined
    const filterType = request.query.type
    const offset = request.query.offset
    const limit = request.query.limit

    // まずはOR検索する
    const results = await DBItem.find({
      relations: ['tweet', 'tweet.user', 'images', 'target'],
      where: targetIds
        ? targetIds.map((targetId) => {
            return {
              target: {
                userId: Equal(targetId),
              },
            }
          })
        : undefined,
    })
    const items = results.map((item) => {
      return {
        ...item,
        images: item.images.map((image) => {
          return {
            ...image,
            url: `https://pbs.twimg.com/media/${image.imageId}?format=jpg&name=small`,
          }
        }),
      }
    })

    if (filterType === 'or' || filterType === undefined || !targetIds) {
      reply.send(this.pagination(items, offset, limit))
      return
    }
    // 同一ツイートIDが出てくる回数をカウントする。targets指定数と同じなら残す
    const tweetIds = items.map((item) => item.tweet.tweetId)
    const tweetIdCount = tweetIds.reduce((acc, cur) => {
      acc[cur] = (acc[cur] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const filteredItems = items
      // targets指定数と同じなら残す
      .filter((item) => {
        return tweetIdCount[item.tweet.tweetId] === targetIds.length
      })
      // item.target を omit する
      .map((item) => {
        return {
          ...item,
          target: undefined,
        }
      })
      // 同一ツイートIDの中で最初のものだけ残す
      .filter((item, index, self) => {
        return (
          self.findIndex((i) => i.tweet.tweetId === item.tweet.tweetId) ===
          index
        )
      })
    reply.send(this.pagination(filteredItems, offset, limit))
  }

  pagination<T>(
    items: T[],
    offset: number | undefined,
    limit: number | undefined
  ): T[] {
    if (!offset) offset = 0
    if (!limit) limit = items.length
    return items.slice(offset, offset + limit)
  }
}
