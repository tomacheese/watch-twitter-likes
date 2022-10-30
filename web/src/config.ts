import fs from 'fs'
import yaml from 'js-yaml'

export interface Config {
  discord: {
    token: string
    ownerId: string
  }
  twitter: {
    consumerKey: string
    consumerSecret: string
    accessToken: string
    accessSecret: string
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
  console.log(yaml)
  const path = process.env.CONFIG_PATH || 'config.yml'
  return yaml.load(fs.readFileSync(path, 'utf8')) as Config
}
