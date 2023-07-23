// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Session } from 'fastify'

declare module 'fastify' {
  interface Session {
    oauth_token: string
    oauth_token_secret: string
    backUrl: string
    accessToken: string
    accessSecret: string
    twitterUserId: string
  }
}
