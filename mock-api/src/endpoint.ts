import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import axios from 'axios'

interface ImageItem {
  rowId: number
  createdAt: string
  tweet: {
    tweetId: string
    text: string
    tags: string[]
    user: {
      userId: string
      screenName: string
      createdAt: string
    }
  }
  images: {
    rowId: number
    imageId: string
    size: string
    width: number
    height: number
    createdAt: string
    url: string
  }[]
  target: {
    userId: string
    name: string
    threadId: string | null
    createdAt: string
  }
}

interface PicsumImage {
  id: string
  author: string
  width: number
  height: number
  url: string
  download_url: string
}

const targets = [
  {
    userId: '1',
    name: 'John Smith',
    threadId: null,
    createdAt: '2021-01-01T00:00:00.000Z',
  },
  {
    userId: '2',
    name: 'Jane Smith',
    threadId: null,
    createdAt: '2021-01-02T00:00:00.000Z',
  },
  {
    userId: '3',
    name: 'John Doe',
    threadId: null,
    createdAt: '2021-01-03T00:00:00.000Z',
  },
]

export class EndPoints {
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
  }

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
    reply.send(targets)
  }

  async routeGetImages(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const dummyImages = await axios.get<PicsumImage[]>(
      'https://picsum.photos/v2/list?limit=100'
    )

    const randomImages = dummyImages.data.sort(() => Math.random() - 0.5)

    const response: ImageItem[] = []
    let num = 1
    for (const image of randomImages) {
      const dummyTweet: ImageItem['tweet'] = {
        tweetId: Math.floor(Math.random() * 10000000000000).toString(),
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        tags: ['dummy', 'tweet'],
        user: {
          userId: Math.floor(Math.random() * 10000000000000).toString(),
          screenName: 'Lorem Ipsum',
          createdAt: '2021-01-01T00:00:00.000Z',
        },
      }

      const dummyTarget: ImageItem['target'] =
        targets[Math.floor(Math.random() * targets.length)]

      response.push({
        rowId: num,
        createdAt: '2021-01-01T00:00:00.000Z',
        tweet: dummyTweet,
        images: [
          {
            rowId: Math.floor(Math.random() * 10000000000000),
            imageId: image.id,
            size: 'small',
            width: image.width,
            height: image.height,
            createdAt: '2021-01-01T00:00:00.000Z',
            url: image.download_url,
          },
        ],
        target: dummyTarget,
      })
      num++
    }

    reply.send(response)
  }
}
