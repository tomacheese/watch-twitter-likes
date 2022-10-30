import { DBImage } from './entities/images'
import { DBTweet } from './entities/tweets'
import { DBUser } from './entities/users'
import { MediaEntityV1, MediaSizesV1, TweetV1 } from 'twitter-api-v2'

export async function getDBUser(tweet: TweetV1) {
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

export async function getDBTweet(tweet: TweetV1, dbUser: DBUser) {
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
  return await dbTweet.save()
}

export async function getDBImage(
  dbTweet: DBTweet,
  media: MediaEntityV1,
  size: keyof MediaSizesV1,
) {
  const sizedMedia = media.sizes[size as keyof MediaSizesV1]
  const dbImage = new DBImage()
  dbImage.tweet = dbTweet
  dbImage.imageId = media.id_str
  dbImage.width = sizedMedia.w
  dbImage.height = sizedMedia.h
  dbImage.size = size
  return await dbImage.save()
}
