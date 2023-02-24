import { Page } from 'puppeteer-core'
import { GraphQLResponse } from './graphql-response'
import { GraphQLLikesResponse } from './models/likes'
import { Status } from 'twitter-d'
import { CustomGraphQLUserTweet } from './models/custom-graphql-user-tweet'
import { WTLBrowser } from './browser'
import { Logger } from './logger'

export class Twitter {
  private readonly browser: WTLBrowser

  constructor(browser: WTLBrowser) {
    this.browser = browser
  }

  public async getUserScreenName(userId: string): Promise<string> {
    const url = `https://twitter.com/i/user/${userId}`
    const page = await this.browser.newPage()

    await page.goto(url)

    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        const href = await page.evaluate(() => {
          return document.location.href
        })
        if (href !== url) {
          clearInterval(interval)
          resolve()
        }
      }, 1000)
      setTimeout(() => {
        clearInterval(interval)
        resolve()
      }, 10_000)
    })

    const screenName = await page.evaluate(() => {
      return document.location.href.split('/').pop()
    })
    await page.close()

    if (!screenName || screenName === userId) {
      throw new Error('Failed to get screen name.')
    }
    if (screenName === '404') {
      throw new Error('User not found.')
    }

    return screenName
  }

  public async getUserLikes(screenName: string, limit: number) {
    const page = await this.browser.newPage()

    const graphqlResponse = new GraphQLResponse(page, 'Likes')
    await page.goto(`https://twitter.com/${screenName}/likes`, {
      waitUntil: 'networkidle2',
    })

    const scrollInterval = setInterval(async () => {
      await this.pageScroll(page)
    }, 1000)

    const tweets = []
    while (tweets.length < limit) {
      try {
        tweets.push(...(await this.waitLikeTweet(graphqlResponse)))
      } catch {
        break
      }
    }

    clearInterval(scrollInterval)
    await page.close()

    return tweets
  }

  public async likeTweet(tweetId: string) {
    const logger = Logger.configure(`Twitter.likeTweet`)
    const page = await this.browser.newPage()

    const url = `https://twitter.com/i/status/${tweetId}`
    await page.goto(url, { waitUntil: 'networkidle2' })

    const result = await Promise.race([
      page
        .waitForSelector('div[role="button"][data-testid="like"]', {
          timeout: 5000,
        })
        .then((element) => element?.click())
        .then(() => 'LIKED')
        .catch(() => null),
      page
        .waitForSelector('div[role="button"][data-testid="unlike"]', {
          timeout: 7000,
        })
        .then((element) => element?.click())
        .then(() => 'ALREADY_LIKED')
        .catch(() => null),
      page
        .waitForSelector('div#layers div[role="alert"][data-testid="toast"]', {
          timeout: 7000,
        })
        // innerText
        .then((element) =>
          page.evaluate((element) => element?.textContent, element)
        )
        .catch(() => 'UNKNOWN ERROR'),
    ])
    await page.close()

    logger.info(`Result: ${result}`)

    if (result !== 'LIKED') {
      throw new Error(result ?? 'UNKNOWN')
    }
  }

  private waitLikeTweet(
    graphqlResponse: GraphQLResponse<'Likes'>
  ): Promise<Status[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'))
      }, 10_000)
      const interval = setInterval(async () => {
        const response = graphqlResponse.shiftResponse()
        if (!response) {
          return
        }

        const tweets = this.getLikeTweet(response)
        if (tweets.length > 0) {
          clearInterval(interval)
          resolve(tweets)
        }
      }, 1000)
    })
  }

  private getLikeTweet(response: GraphQLLikesResponse): Status[] {
    const result = response.data.user.result.timeline_v2.timeline.instructions
    return (
      this.filterUndefined(
        this.filterUndefined(
          result
            .filter((instruction) => instruction.type === 'TimelineAddEntries')
            .flatMap((instruction) => instruction.entries)
        )
          .filter((entry) => entry.entryId.startsWith('tweet-'))
          .flatMap((entry) => entry.content.itemContent?.tweet_results.result)
      ) as CustomGraphQLUserTweet[]
    ).map((tweet) => {
      return this.createStatusObject(tweet)
    })
  }

  private createStatusObject(tweet: CustomGraphQLUserTweet): Status {
    const legacy = tweet.legacy ?? tweet.tweet?.legacy ?? undefined
    if (!legacy) {
      throw new Error('Failed to get legacy')
    }
    return {
      id: Number(legacy.id_str),
      source: tweet.source ?? 'NULL',
      truncated: false,
      user: {
        id: Number(tweet.core?.user_results.result.rest_id),
        id_str: tweet.core?.user_results.result.rest_id ?? 'NULL',
        ...tweet.core?.user_results.result.legacy,
      },
      ...legacy,
      display_text_range: legacy.display_text_range
        ? [legacy.display_text_range[0], legacy.display_text_range[1]]
        : undefined,
      // @ts-ignore
      entities: legacy.entities,
    }
  }

  private async pageScroll(page: Page) {
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })
  }

  private filterUndefined<T>(array: (T | undefined)[]): T[] {
    return array.filter((value) => value !== undefined) as T[]
  }
}
