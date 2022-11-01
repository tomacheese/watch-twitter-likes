import fs from 'fs'
import yaml from 'js-yaml'

export interface TwitterAccount {
  name: string
  emoji: string
  discordUserId: string
  accessToken: string
  accessSecret: string
}

export interface Config {
  discord: {
    token: string
  }
  twitter: {
    consumerKey: string
    consumerSecret: string
    accounts: TwitterAccount[]
  }
  db: {
    type: 'mysql'
    host: string
    port: number
    username: string
    password: string
    database: string
  }
  auth?: string
}

export function getConfig(): Config {
  const path = process.env.CONFIG_PATH || 'config.yml'
  return yaml.load(fs.readFileSync(path, 'utf8')) as Config
}
