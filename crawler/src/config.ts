import fs from 'fs'
import { Logger } from './logger'

export const PATH = {
  config: process.env.CONFIG_PATH || 'data/config.json',
}

export interface TwitterAccount {
  name: string
  emoji: string
  discordUserId: string
  basicUsername: string
  basicPassword: string
}

export interface TwitterAuth {
  appKey: string
  appSecret: string
  callbackUrl: string
}

export interface Configuration {
  discord: {
    token: string
  }
  twitter: {
    accounts: TwitterAccount[]
    auth: TwitterAuth
  }
  twapi: {
    baseUrl: string
    basicUsername: string
    basicPassword: string
  }
  db: {
    type: 'mysql'
    host: string
    port: number
    username: string
    password: string
    database: string
  }
  session?: {
    secret: string
    isSecure?: boolean
  }
}

const isConfig = (config: any): config is Configuration => {
  const logger = Logger.configure('isConfig')
  const checks: {
    [key: string]: boolean
  } = {
    'config is defined': !!config,
    'discord is defined': !!config.discord,
    'discord.token is defined': !!config.discord.token,
    'discord.token is string': typeof config.discord.token === 'string',
    'twitter is defined': !!config.twitter,
    'twitter.accounts is defined': !!config.twitter.accounts,
    'twitter.accounts is array': Array.isArray(config.twitter.accounts),
    'twitter.accounts is not empty': config.twitter.accounts.length > 0,
    'twitter.accounts is valid': config.twitter.accounts.every(
      (account: {
        name: any
        emoji: any
        discordUserId: any
        basicUsername: any
        basicPassword: any
      }) =>
        !!account.name &&
        typeof account.name === 'string' &&
        !!account.emoji &&
        typeof account.emoji === 'string' &&
        !!account.discordUserId &&
        typeof account.discordUserId === 'string' &&
        !!account.basicUsername &&
        typeof account.basicUsername === 'string' &&
        !!account.basicPassword &&
        typeof account.basicPassword === 'string'
    ),
    'twitter.auth is defined': !!config.twitter.auth,
    'twitter.auth.appKey is defined': !!config.twitter.auth.appKey,
    'twitter.auth.appKey is string':
      typeof config.twitter.auth.appKey === 'string',
    'twitter.auth.appSecret is defined': !!config.twitter.auth.appSecret,
    'twitter.auth.appSecret is string':
      typeof config.twitter.auth.appSecret === 'string',
    'twitter.auth.callbackUrl is defined': !!config.twitter.auth.callbackUrl,
    'twitter.auth.callbackUrl is string':
      typeof config.twitter.auth.callbackUrl === 'string',
    'twapi is defined': !!config.twapi,
    'twapi.baseUrl is defined': !!config.twapi.baseUrl,
    'twapi.baseUrl is string': typeof config.twapi.baseUrl === 'string',
    'twapi.basicUsername is defined': !!config.twapi.basicUsername,
    'twapi.basicUsername is string':
      typeof config.twapi.basicUsername === 'string',
    'twapi.basicPassword is defined': !!config.twapi.basicPassword,
    'twapi.basicPassword is string':
      typeof config.twapi.basicPassword === 'string',
    'db is defined': !!config.db,
    'db.type is defined': !!config.db.type,
    'db.type is string': typeof config.db.type === 'string',
    'db.host is defined': !!config.db.host,
    'db.host is string': typeof config.db.host === 'string',
    'db.port is defined': !!config.db.port,
    'db.port is number': typeof config.db.port === 'number',
    'db.username is defined': !!config.db.username,
    'db.username is string': typeof config.db.username === 'string',
    'db.password is defined': !!config.db.password,
    'db.password is string': typeof config.db.password === 'string',
    'db.database is defined': !!config.db.database,
    'db.database is string': typeof config.db.database === 'string',
  }
  if (config.session) {
    checks['session.secret is defined'] = !!config.session.secret
    checks['session.secret is string'] =
      typeof config.session.secret === 'string'
    if (config.session.isSecure) {
      checks['session.isSecure is boolean'] =
        typeof config.session.isSecure === 'boolean'
    }
  }
  const result = Object.values(checks).every(Boolean)
  if (!result) {
    logger.error('❌ Invalid config. Missing check(s):')
    for (const [key, value] of Object.entries(checks)) {
      if (!value) {
        logger.error(`❌ - ${key}`)
      }
    }
  }
  return result
}

export function getConfig(): Configuration {
  if (!fs.existsSync(PATH.config)) {
    throw new Error(`Config file not found: ${PATH.config}`)
  }
  const config = JSON.parse(fs.readFileSync(PATH.config, 'utf8'))
  if (!isConfig(config)) {
    throw new Error('Invalid config')
  }
  return config
}
