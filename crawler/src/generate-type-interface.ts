import fs from 'node:fs'
import { createCompoundSchema } from 'genson-js'
import { compile, Options } from 'json-schema-to-typescript'
import { Logger } from '@book000/node-utils'
import { dirname } from 'node:path'
import { GraphQLLikesResponse } from './models/likes'

const compileOptions: Partial<Options> = {
  bannerComment: '',
  additionalProperties: false,
  enableConstEnums: true,
  strictIndexSignatures: true,
  style: {
    semi: false,
    singleQuote: true,
  },
  unknownAny: true,
}

async function getJSONFiles(directory: string) {
  if (!fs.existsSync(directory)) {
    return []
  }
  const files = fs.readdirSync(directory)
  const results: string[] = []
  for (const file of files) {
    const path = directory + '/' + file
    const stat = fs.statSync(path)
    if (stat.isDirectory()) {
      results.push(...(await getJSONFiles(path)))
    }
    if (stat.isFile() && path.endsWith('.json')) {
      results.push(path)
    }
  }
  return results
}

async function generate(
  data: object[],
  name: string,
  schemaPath: string,
  interfacePath: string
) {
  if (data.length === 0) {
    throw new Error(`❌ Not found json files`)
  }

  fs.mkdirSync(dirname(schemaPath), { recursive: true })
  fs.mkdirSync(dirname(interfacePath), { recursive: true })

  const schema = createCompoundSchema(data)

  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
  const ts = await compile(schema, name, compileOptions)
  fs.writeFileSync(interfacePath, ts)
}
function filterUndefined<T>(array: (T | undefined)[]): T[] {
  return array.filter((item) => item !== undefined) as T[]
}

function convertCustomGraphQLUserTweetResponse(
  responses: GraphQLLikesResponse[]
) {
  const results = []
  for (const response of responses) {
    results.push(
      filterUndefined(
        filterUndefined(
          response.data.user.result.timeline_v2.timeline.instructions
            .filter((instruction) => instruction.type === 'TimelineAddEntries')
            .flatMap((instruction) => instruction.entries)
        )
          .filter((entry) => entry.entryId.startsWith('tweet-'))
          .flatMap((entry) => entry.content.itemContent?.tweet_results.result)
      )
    )
  }
  return results
}

function getHyphenType(type: string) {
  return type
    .replace(/(GraphQL|Rest)/g, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

export async function generateTypeInterfaces() {
  const logger = Logger.configure('generateTypeInterfaces')
  const responsesDirectoryPath =
    process.env.RESPONSES_DIR_PATH ?? '/data/debug/graphql/'
  const schemasDirectoryPath =
    process.env.SCHEMAS_DIR_PATH ?? '/data/debug/schema/graphql/'
  const interfacesDirectoryPath = process.env.INTERFACES_DIR_PATH ?? '/models/'

  logger.info(`📂 Responses directory path: ${responsesDirectoryPath}`)
  logger.info(`📂 Schemas directory path: ${schemasDirectoryPath}`)
  logger.info(`📂 Interfaces directory path: ${interfacesDirectoryPath}`)

  const targets = ['UserByScreenName', 'Likes']
  for (const target of targets) {
    const hyphenType = getHyphenType(target)
    const responsesDirectory = responsesDirectoryPath + hyphenType
    const schemaPath = schemasDirectoryPath + target + '.json'
    const interfacePath = interfacesDirectoryPath + hyphenType + '.ts'

    const jsonFiles = await getJSONFiles(responsesDirectory)
    logger.info(`👀 Reading ${target} files... (${jsonFiles.length} files)`)
    const data = jsonFiles
      .map((path) => fs.readFileSync(path, 'utf8'))
      .map((element) => JSON.parse(element))

    logger.info(`📝 Generating ${target}...`)
    await generate(data, `GraphQL${target}Response`, schemaPath, interfacePath)

    if (target === 'Likes') {
      logger.info(`📝 Generating CustomGraphQLUserTweet...`)
      await generate(
        convertCustomGraphQLUserTweetResponse(data),
        `CustomGraphQLUserTweet`,
        schemasDirectoryPath + 'custom-graphql-user-tweet.json',
        interfacesDirectoryPath + 'custom-graphql-user-tweet.ts'
      )
    }
  }

  logger.info('✅ Done')
}
