import { FullUser, MediaEntity, Sizes, Status, User } from 'twitter-d'
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { getConfig } from './config'
import { DBImage } from './entities/images'
import { DBItem } from './entities/item'
import { DBMute } from './entities/mutes'
import { DBTarget } from './entities/targets'
import { DBTweet } from './entities/tweets'
import { DBUser } from './entities/users'

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
    // eslint-disable-next-line no-console
    console.error(tweet)
    throw new Error(`User is not full user: ${tweet.user.id_str}`)
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
  const databaseUser = new DBUser()
  databaseUser.userId = tweet.user.id_str
  databaseUser.screenName = tweet.user.screen_name
  return await databaseUser.save()
}

export async function getDBTweet(tweet: Status, databaseUser: DBUser) {
  const row = await DBTweet.findOne({
    where: {
      tweetId: tweet.id_str,
    },
  })
  if (row) {
    return row
  }
  const databaseTweet = new DBTweet()
  databaseTweet.tweetId = tweet.id_str
  databaseTweet.user = databaseUser
  databaseTweet.text = tweet.full_text
  databaseTweet.tags = tweet.entities.hashtags
    ? tweet.entities.hashtags.map((tag) => tag.text)
    : []
  return await databaseTweet.save()
}

export async function getDBImage(
  databaseTweet: DBTweet,
  media: MediaEntity,
  size: keyof Sizes
) {
  const sizedMedia = media.sizes[size as keyof Sizes]
  const databaseImage = new DBImage()
  databaseImage.tweet = databaseTweet
  databaseImage.imageId = getImageId(media.media_url_https)
  databaseImage.width = sizedMedia.w
  databaseImage.height = sizedMedia.h
  databaseImage.size = size
  return await databaseImage.save()
}

function getImageId(url: string) {
  const regex = /^https:\/\/pbs\.twimg\.com\/media\/(.+?)\.([a-z]+?)$/
  const match = url.match(regex)
  if (match) {
    return match[1]
  }
  return ''
}

function isFullUser(user: User): user is FullUser {
  return 'screen_name' in user
}
