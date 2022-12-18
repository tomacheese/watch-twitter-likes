import { TwitterApi } from 'twitter-api-v2'
import { IsNull } from 'typeorm'
import { DBTweet } from './entities/tweets'

export async function migrateTweetHashTags(twitterApi: TwitterApi) {
  let tweetList = await DBTweet.find({
    where: {
      tags: IsNull(),
    },
  })
  console.log('migration tweets: ' + tweetList.length)

  let count = 0
  while (tweetList.length > 0) {
    tweetList = await DBTweet.find({
      where: {
        tags: IsNull(),
      },
      take: 100,
    })
    const tweetIds = tweetList.map((tweet) => tweet.tweetId)
    const tweets = await twitterApi.v1.tweets(tweetIds, {
      include_entities: true,
    })
    for (const tweet of tweets) {
      const dbTweet = await DBTweet.findOne({
        where: {
          tweetId: tweet.id_str,
        },
      })
      if (!dbTweet) {
        continue
      }
      dbTweet.text = tweet.text || tweet.full_text || null
      const tags =
        tweet.entities?.hashtags !== undefined
          ? tweet.entities.hashtags.map((tag) => tag.text)
          : []
      dbTweet.tags = tags
      await dbTweet.save()
      count++
    }
  }

  console.log('migration done: ', count)
}
