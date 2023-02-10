import { DBImage } from './entities/images'
import { DBItem } from './entities/item'
import { DBTarget } from './entities/targets'
import { DBTweet } from './entities/tweets'
import { DBUser } from './users'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { getConfig } from './config'
import { DataSource } from 'typeorm'
import { DBMute } from './entities/mutes'
import { isFullUser, MediaEntity, Sizes, Status } from 'twitter-d'

const config = getConfig()
export const AppDataSource = new DataSource({
  type: config.db.type,
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [DBImage, DBItem, DBTarget, DBTweet, DBUser, DBMute],
  subscribers: [],
  migrations: [],
  timezone: '+09:00',
  supportBigNumbers: true,
  bigNumberStrings: true,
})

export async function getDBUser(tweet: Status) {
  if (!isFullUser(tweet.user)) {
    throw new Error('User is not full user.')
  }
  const row = await DBUser.findOne({
    where: {
      userId: tweet.user.id_str,
    },
  })
  if (row) {
    row.screenName = tweet.user.screen_name
    await row.save()
    return row
  }
  const dbUser = new DBUser()
  dbUser.userId = tweet.user.id_str
  dbUser.screenName = tweet.user.screen_name
  return await dbUser.save()
}

export async function getDBTweet(tweet: Status, dbUser: DBUser) {
  const row = await DBTweet.findOne({
    where: {
      tweetId: tweet.id_str,
    },
  })
  if (row) {
    return row
  }
  const dbTweet = new DBTweet()
  dbTweet.tweetId = tweet.id_str
  dbTweet.user = dbUser
  dbTweet.text = tweet.full_text
  dbTweet.tags = tweet.entities.hashtags
    ? tweet.entities.hashtags.map((tag) => tag.text)
    : []
  return await dbTweet.save()
}

export async function getDBImage(
  dbTweet: DBTweet,
  media: MediaEntity,
  size: keyof Sizes
) {
  const sizedMedia = media.sizes[size as keyof Sizes]
  const dbImage = new DBImage()
  dbImage.tweet = dbTweet
  dbImage.imageId = getImageId(media.media_url_https)
  dbImage.width = sizedMedia.w
  dbImage.height = sizedMedia.h
  dbImage.size = size
  return await dbImage.save()
}

function getImageId(url: string) {
  const regex = /^https:\/\/pbs\.twimg\.com\/media\/(.+?)\.([a-z]+?)$/
  const match = url.match(regex)
  if (match) {
    return match[1]
  }
  return ''
}
