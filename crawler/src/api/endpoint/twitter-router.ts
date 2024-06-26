import { Logger } from '@book000/node-utils'
import { FastifyReply, FastifyRequest } from 'fastify'
import { TwitterApi } from 'twitter-api-v2'
import { BaseRouter } from '../base-router'

interface AuthQuery {
  backUrl?: string
}

interface CallbackQuery {
  oauth_token?: string
  oauth_verifier?: string
}

export class TwitterRouter extends BaseRouter {
  async init(): Promise<void> {
    await this.fastify.register(
      (fastify, _, done) => {
        fastify.get('/auth', this.routeGetAuth.bind(this))
        fastify.get('/callback', this.routeGetCallback.bind(this))
        fastify.get('/logout', this.routeGetLogout.bind(this))
        fastify.get('/me', this.routeGetMe.bind(this))
        fastify.get('/lookup', this.routeGetLookup.bind(this))
        fastify.post('/like', this.routePostLike.bind(this))
        fastify.delete('/like', this.routeDeleteLike.bind(this))
        done()
      },
      { prefix: '/api/twitter' }
    )
  }

  async routeGetAuth(
    request: FastifyRequest<{
      Querystring: AuthQuery
    }>,
    reply: FastifyReply
  ): Promise<void> {
    if (!this.config.twAuth) {
      await reply.code(400).send('Bad Request: twAuth is not enabled')
      return
    }
    const {
      twAuth: { appKey, appSecret, callbackUrl },
    } = this.config
    const client = new TwitterApi({
      appKey,
      appSecret,
    })

    const {
      url,
      oauth_token: oauthToken,
      oauth_token_secret: oauthTokenSecret,
    } = await client.generateAuthLink(callbackUrl, {
      linkMode: 'authorize',
    })

    request.session.set('oauth_token', oauthToken)
    request.session.set('oauth_token_secret', oauthTokenSecret)

    const backUrl = request.query.backUrl
    if (backUrl) {
      request.session.set('backUrl', backUrl)
    }

    await reply.redirect(url)
  }

  async routeGetCallback(
    request: FastifyRequest<{
      Querystring: CallbackQuery
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const { oauth_token: oauthToken, oauth_verifier: oauthVerifier } =
      request.query
    if (!oauthToken) {
      await reply.code(400).send('Bad Request: query@oauth_token is required')
      return
    }
    if (!oauthVerifier) {
      await reply
        .code(400)
        .send('Bad Request: query@oauth_verifier is required')
      return
    }

    const oauthTokenSecret = request.session.get('oauth_token_secret')
    if (!oauthTokenSecret) {
      await reply
        .code(400)
        .send('Bad Request: session@codeVerifier is required')
      return
    }

    const sessionBackUrl = request.session.get('backUrl')

    // TwitterApiの初期化
    const client = this.getClient(oauthToken, oauthTokenSecret)

    // アクセストークンの取得
    const result = await client
      .login(oauthVerifier)
      .catch(async (error: unknown) => {
        await reply.code(500).send(error)
        return null
      })
    if (!result) {
      return
    }

    const { accessToken, accessSecret, client: loggedClient } = result

    const me = await loggedClient
      .currentUser()
      .catch(async (error: unknown) => {
        const errorWithTyped = error as {
          errors?: { message: string; code: number }[]
        }
        const message = errorWithTyped.errors?.[0]?.message
        const code = errorWithTyped.errors?.[0]?.code
        await reply.code(400).send(`Bad Request: ${message} (code: ${code})`)
        return null
      })
    if (!me) {
      return
    }

    // アクセストークンの保存
    request.session.set('accessToken', accessToken)
    request.session.set('accessSecret', accessSecret)
    request.session.set('twitterUserId', me.id.toString())

    // リダイレクト
    await (sessionBackUrl
      ? reply.redirect(sessionBackUrl)
      : reply.redirect('/'))
  }

  async routeGetLogout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await request.session.destroy()
    await reply.code(204).send()
  }

  async routeGetMe(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionAccessToken = request.session.get('accessToken')
    if (!sessionAccessToken) {
      await reply.code(400).send('Bad Request: session@accessToken is required')
      return
    }
    const sessionAccessSecret = request.session.get('accessSecret')
    if (!sessionAccessSecret) {
      await reply
        .code(400)
        .send('Bad Request: session@accessSecret is required')
      return
    }

    const client = this.getClient(sessionAccessToken, sessionAccessSecret)

    const result = await client.currentUser().catch(async (error: unknown) => {
      const errorWithTyped = error as {
        errors?: { message: string; code: number }[]
      }
      const message = errorWithTyped.errors?.[0]?.message
      const code = errorWithTyped.errors?.[0]?.code
      await reply.code(400).send(`Bad Request: ${message} (code: ${code})`)
      return null
    })
    if (!result) {
      return
    }
    await reply.send(result)
  }

  async routeGetLookup(
    request: FastifyRequest<{
      Querystring: { tweetIds: string }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const logger = Logger.configure('TwitterRouter.routeGetLookup')
    const sessionAccessToken = request.session.get('accessToken')
    if (!sessionAccessToken) {
      await reply.code(400).send('Bad Request: session@accessToken is required')
      return
    }
    const sessionAccessSecret = request.session.get('accessSecret')
    if (!sessionAccessSecret) {
      await reply
        .code(400)
        .send('Bad Request: session@accessSecret is required')
      return
    }

    const client = this.getClient(sessionAccessToken, sessionAccessSecret)

    const { tweetIds: tweetIdsRaw } = request.query
    if (!tweetIdsRaw) {
      await reply.code(400).send('Bad Request: query@tweetIds is required')
      return
    }
    const tweetIds = tweetIdsRaw.split(',')

    const result = await client.v1
      .tweets(tweetIds)
      .catch(async (error: unknown) => {
        const errorWithTyped = error as {
          errors?: { message: string; code: number }[]
        }
        const message = errorWithTyped.errors?.[0]?.message
        const code = errorWithTyped.errors?.[0]?.code
        logger.error('❌ Failed to get tweets', error as Error)
        await reply.code(400).send(`Bad Request: ${message} (code: ${code})`)
        return null
      })
    if (!result) {
      return
    }
    await reply.send(result)
  }

  async routePostLike(
    request: FastifyRequest<{
      Body: { tweetId: string }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const sessionAccessToken = request.session.get('accessToken')
    if (!sessionAccessToken) {
      await reply.code(400).send('Bad Request: session@accessToken is required')
      return
    }
    const sessionAccessSecret = request.session.get('accessSecret')
    if (!sessionAccessSecret) {
      await reply
        .code(400)
        .send('Bad Request: session@accessSecret is required')
      return
    }

    const client = this.getClient(sessionAccessToken, sessionAccessSecret)

    const { tweetId } = request.body
    if (!tweetId) {
      await reply.code(400).send('Bad Request: body@tweetId is required')
      return
    }

    const result = await client.v1
      .post('favorites/create.json', {
        id: tweetId,
      })
      .catch(async (error: unknown) => {
        const errorWithTyped = error as {
          errors?: { message: string; code: number }[]
        }
        const message = errorWithTyped.errors?.[0]?.message
        const code = errorWithTyped.errors?.[0]?.code
        await reply.code(400).send(`Bad Request: ${message} (code: ${code})`)
        return null
      })
    if (!result) {
      return
    }
    await reply.send(result)
  }

  async routeDeleteLike(
    request: FastifyRequest<{
      Body: { tweetId: string }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const sessionAccessToken = request.session.get('accessToken')
    if (!sessionAccessToken) {
      await reply.code(400).send('Bad Request: session@accessToken is required')
      return
    }
    const sessionAccessSecret = request.session.get('accessSecret')
    if (!sessionAccessSecret) {
      await reply
        .code(400)
        .send('Bad Request: session@accessSecret is required')
      return
    }

    const client = this.getClient(sessionAccessToken, sessionAccessSecret)

    const { tweetId } = request.body
    if (!tweetId) {
      await reply.code(400).send('Bad Request: body@tweetId is required')
      return
    }

    const result = await client.v1
      .post('favorites/destroy.json', {
        id: tweetId,
      })
      .catch(async (error: unknown) => {
        const errorWithTyped = error as {
          errors?: { message: string; code: number }[]
        }
        const message = errorWithTyped.errors?.[0]?.message
        const code = errorWithTyped.errors?.[0]?.code
        await reply.code(400).send(`Bad Request: ${message} (code: ${code})`)
        return null
      })
    if (!result) {
      return
    }
    await reply.send(result)
  }

  private getClient(accessToken: string, accessSecret: string) {
    if (!this.config.twAuth) {
      throw new Error('twAuth is not configured')
    }
    const {
      twAuth: { appKey, appSecret },
    } = this.config
    return new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    })
  }
}
