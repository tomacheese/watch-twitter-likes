import fs from 'fs'
import yaml from 'js-yaml'

export interface TwitterAccount {
  name: string
  emoji: string
  discordUserId: string
  accessToken: string
  accessSecret: string
}

export interface TwitterAuth {
  appKey: string
  appSecret: string
  callbackUrl: string
}

export interface Config {
  discord: {
    token: string
  }
  twitter: {
    consumerKey: string
    consumerSecret: string
    accounts: TwitterAccount[]
    auth: TwitterAuth
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

export function getConfig(): Config {
  const path =
    (
      process.env as {
        [key: string]: string | undefined
      }
    ).CONFIG_PATH || 'config.yml'
  return yaml.load(fs.readFileSync(path, 'utf8')) as Config
}
