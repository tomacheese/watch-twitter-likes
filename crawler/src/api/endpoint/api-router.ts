import { FastifyRequest, FastifyReply } from 'fastify'
import { DBItem } from '@/entities/item'
import { Equal } from 'typeorm'
import { DBTarget } from '@/entities/targets'
import { DBTweet } from '@/entities/tweets'
import { BaseRouter } from '../base-router'

interface ImagesQuery {
  targetIds?: string[]
  type?: 'or' | 'and'
  offset?: number
  limit?: number
  tags?: string[]
  vieweds?: number[]
}

export class ApiRouter extends BaseRouter {
  init(): void {
    this.fastify.register(
      (fastify, _, done) => {
        fastify.get('/targets', this.routeGetTargets.bind(this))
        fastify.get('/tags', this.routeGetTags.bind(this))
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
    const targets = await DBTarget.find()
    reply.send(targets)
  }

  async routeGetTags(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const tweets = await DBTweet.find()
    const tags = this.filterNull(tweets.map((tweet) => tweet.tags)).filter(
      (tag, index, self) => self.indexOf(tag) === index
    )
    const tagsWithCount = this.filterNull(
      this.filterNull(tags)
        .flat()
        .map((tag) => {
          if (!tag) return null
          return {
            tag,
            count: tweets.filter(
              (tweet) => tweet.tags && tweet.tags?.includes(tag)
            ).length,
          }
        })
    ).sort((a, b) => b.count - a.count)
    reply.send(tagsWithCount)
  }

  async routePostImages(
    request: FastifyRequest<{
      Body: ImagesQuery
    }>,
    reply: FastifyReply
  ): Promise<void> {
    await this.getImages(request.body, reply)
  }

  async getImages(query: ImagesQuery, reply: FastifyReply) {
    // targets query
    const targetIds = query.targetIds
    const filterType = query.type
    const offset = query.offset
    const limit = query.limit

    // まずはOR検索する
    const results = await DBItem.find({
      relations: ['tweet', 'tweet.user', 'media', 'target'],
      where: targetIds
        ? targetIds.map((targetId) => {
            return {
              target: {
                userId: Equal(targetId),
              },
            }
          })
        : undefined,
      order: {
        createdAt: 'DESC',
      },
    })
    let items = results.map((item) => {
      return {
        ...item,
        media: item.media.map((m) => {
          return {
            ...m,
            url: `https://pbs.twimg.com/${m.urlType}/${m.mediaId}?format=jpg&name=small`,
          }
        }),
      }
    })

    // 閲覧済みフィルタ
    const vieweds = query.vieweds
    if (vieweds) {
      items = items.filter((item) => {
        return !vieweds.includes(item.rowId)
      })
    }

    // タグフィルタ
    const tags = query.tags
    if (tags) {
      items = items.filter((item) => {
        return tags.some((tag) => {
          return item.tweet.tags?.includes(tag)
        })
      })
    }

    // OR検索かつ、targets指定なしの場合はここで終了
    if (filterType === 'or' || filterType === undefined || !targetIds) {
      reply.send({
        items: this.pagination(items, offset, limit),
        total: items.length,
      })
      return
    }

    // 同一ツイートIDが出てくる回数をカウントする。targets指定数と同じなら残す
    const tweetIds = items.map((item) => item.tweet.tweetId)
    // eslint-disable-next-line unicorn/no-array-reduce
    const tweetIdCount = tweetIds.reduce((accumulator, current) => {
      accumulator[current] = (accumulator[current] || 0) + 1
      return accumulator
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
          self.findIndex(
            (index) => index.tweet.tweetId === item.tweet.tweetId
          ) === index
        )
      })
    reply.send({
      items: this.pagination(filteredItems, offset, limit),
      total: items.length,
    })
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

  filterNull<T>(items: (T | null)[]): T[] {
    return items.filter((item) => item !== null).flat() as T[]
  }
}
