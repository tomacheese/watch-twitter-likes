import { TwitterApi } from 'twitter-api-v2'
import { IsNull } from 'typeorm'
import { DBTweet } from './entities/tweets'

export async function migrateTweetHashTags(twitterApi: TwitterApi) {
  const tweets = await DBTweet.find({
    where: {
      tags: IsNull(),
    },
  })
  const checkTweetIds = tweets.map((t) => t.tweetId)
  console.log('migration tweets: ' + checkTweetIds.length)

  // 100件ずつに分割
  const chunks: string[][] = checkTweetIds.reduce((acc, cur, i) => {
    if (i % 100 === 0) {
      acc.push([])
    }
    acc[acc.length - 1].push(cur)
    return acc
  }, [] as string[][])
  for (const chunk of chunks) {
    const tweets = await twitterApi.v1.tweets(chunk, {
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
    }
  }

  console.log('migration done')
}
