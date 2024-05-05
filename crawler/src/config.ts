/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import fs from 'node:fs'
import { Logger } from '@book000/node-utils'

export const PATH = {
  config: process.env.CONFIG_PATH ?? 'data/config.json',
}

export interface TwitterAccount {
  username: string
  password: string
  authCodeSecret?: string
  discordUserId: string
}

export interface WTLConfiguration {
  discord: {
    token: string
  }
  twitter: TwitterAccount
  twAuth?: { appKey: string; appSecret: string; callbackUrl: string }
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

const isConfig = (config: any): config is WTLConfiguration => {
  const logger = Logger.configure('isConfig')
  const checks: Record<string, boolean> = {
    'config is defined': !!config,
    'discord is defined': !!config.discord,
    'discord.token is defined': !!config.discord.token,
    'discord.token is string': typeof config.discord.token === 'string',
    'twitter is defined': !!config.twitter,
    'twitter.username is defined': !!config.twitter.username,
    'twitter.username is string': typeof config.twitter.username === 'string',
    'twitter.password is defined': !!config.twitter.password,
    'twitter.password is string': typeof config.twitter.password === 'string',
    'twitter.discordUserId is defined': !!config.twitter.discordUserId,
    'twitter.discordUserId is string':
      typeof config.twitter.discordUserId === 'string',
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

export function getConfig(): WTLConfiguration {
  if (!fs.existsSync(PATH.config)) {
    throw new Error(`Config file not found: ${PATH.config}`)
  }
  const config = JSON.parse(fs.readFileSync(PATH.config, 'utf8'))
  if (!isConfig(config)) {
    throw new Error('Invalid config')
  }
  return config
}
