import eslintPlugin from 'vite-plugin-eslint'
import { defineNuxtConfig } from 'nuxt/config'

// https://zenn.dev/skmt3p/articles/5c119886956cc9
const baseName = process.env.BASE_NAME || 'watch-twitter-likes'
const baseDescription =
  process.env.BASE_DESCRIPTION || 'Watch Twitter users likes 👀'
const baseUrl = process.env.BASE_URL || 'https://likes.amatama.net'
const isSsr = true
const isDev = process.env.NODE_ENV === 'development'
const apiBaseURL = process.env.API_BASE_URL || isDev ? 'http://localhost:8000' : baseUrl

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'ja'
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'apple-mobile-web-app-title', content: baseName },
        { name: 'application-name', content: baseName },
        { name: 'msapplication-TileColor', content: '#ffb41d' },
        {
          name: 'msapplication-config',
          content: baseUrl + '/favicons/browserconfig.xml'
        },
        { name: 'theme-color', content: '#ffb41d' },
        { key: 'description', name: 'description', content: baseDescription },
        { key: 'og:site_name', property: 'og:site_name', content: baseName },
        { key: 'og:type', property: 'og:type', content: 'article' },
        { key: 'og:url', property: 'og:url', content: baseUrl },
        { key: 'og:title', property: 'og:title', content: baseName },
        {
          key: 'og:description',
          property: 'og:description',
          content: baseDescription
        },
        {
          key: 'twitter:card',
          name: 'twitter:card',
          content: 'summary'
        },
        {
          key: 'msapplication-TileColor',
          name: 'msapplication-TileColor',
          content: '#00aba9'
        },
        {
          key: 'msapplication-config',
          name: 'msapplication-config',
          content: baseUrl + '/favicons/browserconfig.xml'
        },
        {
          key: 'theme-color',
          name: 'theme-color',
          content: '#1da1f2'
        },
        {
          key: 'robots',
          name: 'robots',
          content: 'noindex, nofollow'
        }
      ],
      link: [
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: baseUrl + '/favicons/apple-touch-icon.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: baseUrl + '/favicons/favicon-32x32.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: baseUrl + '/favicons/favicon-16x16.png'
        },
        {
          rel: 'manifest',
          href: baseUrl + '/favicons/site.webmanifest'
        },
        {
          rel: 'mask-icon',
          href: baseUrl + '/favicons/safari-pinned-tab.svg',
          color: '#5bbad5'
        },
        {
          rel: 'shortcut icon',
          href: baseUrl + '/favicons/favicon.ico'
        }
      ],
      noscript: [{ children: 'This website requires JavaScript.' }]
    }
  },
  build: {
    analyze: isDev,
    transpile: ['vuetify']
  },
  runtimeConfig: {
    public: {
      apiBaseURL
    }
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

  // https://codybontecou.com/how-to-use-vuetify-with-nuxt-3.html
  css: ['vuetify/lib/styles/main.sass', '@mdi/font/css/materialdesignicons.min.css']
})
