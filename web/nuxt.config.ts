import eslintPlugin from 'vite-plugin-eslint'
import { defineNuxtConfig } from 'nuxt/config'

// https://zenn.dev/skmt3p/articles/5c119886956cc9
const baseName = process.env.BASE_NAME || 'watch-twitter-likes'
const baseDescription =
  process.env.BASE_DESCRIPTION || 'Watch Twitter users likes 👀'
const baseUrl = process.env.BASE_URL || 'https://likes.amatama.net'
const baseDir = process.env.BASE_DIR || '/'
const isSsr = false
const isDev = process.env.NODE_ENV === 'development'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'apple-mobile-web-app-title', content: baseName },
        { name: 'application-name', content: baseName },
        { name: 'msapplication-TileColor', content: '#ffb41d' },
        {
          name: 'msapplication-config',
          content: baseDir + '/favicons/browserconfig.xml'
        },
        { name: 'theme-color', content: '#ffb41d' },
        { hid: 'description', name: 'description', content: baseDescription },
        { hid: 'og:site_name', property: 'og:site_name', content: baseName },
        { hid: 'og:type', property: 'og:type', content: 'article' },
        { hid: 'og:url', property: 'og:url', content: baseUrl },
        { hid: 'og:title', property: 'og:title', content: baseName },
        {
          hid: 'og:description',
          property: 'og:description',
          content: baseDescription
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'summary'
        }
      ],
      noscript: [{ children: 'This website requires JavaScript.' }]
    }
  },
  build: {
    analyze: isDev,
    transpile: ['vuetify']
  },
  ignore: [
    '.output',
    '**/test/*.{js,ts,jsx,tsx}',
    '**/*.stories.{js,ts,jsx,tsx}',
    '**/*.{spec,test}.{js,ts,jsx,tsx}',
    '**/-*.*'
  ],
  srcDir: 'src/',
  ssr: isSsr,
  typescript: {
    typeCheck: isDev,
    strict: true
  },
  vite: {
    build: {
      emptyOutDir: true
    },
    plugins: [eslintPlugin()]
  },

  css: ['vuetify/lib/styles/main.sass']
})
