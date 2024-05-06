import { FullUser, MediaEntity, Sizes, Status, User } from 'twitter-d'
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { getConfig } from './config'
import { DBMedia } from './entities/media'
import { DBItem } from './entities/item'
import { DBMute } from './entities/mutes'
import { DBTarget } from './entities/targets'
import { DBTweet } from './entities/tweets'
import { DBUser } from './entities/users'
import { MigrationImages2Media1677269790107 } from './migrations/1677269790107-images2media'

const config = getConfig()
export const AppDataSource = new DataSource({
  type: config.db.type,
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  logging: process.env.NODE_ENV === 'development',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [DBMedia, DBItem, DBTarget, DBTweet, DBUser, DBMute],
  subscribers: [],
  migrations: [MigrationImages2Media1677269790107],
  timezone: '+09:00',
  supportBigNumbers: true,
  bigNumberStrings: true,
})

export async function getDBUser(tweet: Status) {
  if (!isFullUser(tweet.user)) {
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

export async function getDBMedia(
  databaseTweet: DBTweet,
  media: MediaEntity,
  size: keyof Sizes
) {
  // https://pbs.twimg.com/media/FpuUfNIaYAQXO8X.jpg
  // https://pbs.twimg.com/ext_tw_video_thumb/1625974487828111361/pu/img/p7ku8Y7B4uLCkQi3.jpg
  // https://pbs.twimg.com/tweet_video_thumb/FnCpI_4aEAg03vM.jpg
  const regex =
    /^https:\/\/pbs\.twimg\.com\/(?<type>.+?)\/(?<name>.+?)\.(?<ext>[a-z]+?)$/
  const match = media.media_url_https.match(regex)
  if (!match?.groups) {
    throw new Error(`Invalid media url: ${media.media_url_https}`)
  }
  const type = match.groups.type
  const name = match.groups.name
  const extension = match.groups.ext

  const sizedMedia = media.sizes[size]
  const databaseImage = new DBMedia()
  databaseImage.type = media.type
  databaseImage.mediaId = name
  databaseImage.urlType = type
  databaseImage.extension = extension
  databaseImage.tweet = databaseTweet
  databaseImage.size = size
  databaseImage.width = sizedMedia.w
  databaseImage.height = sizedMedia.h
  return await databaseImage.save()
}

function isFullUser(user: User): user is FullUser {
  return 'screen_name' in user
}
