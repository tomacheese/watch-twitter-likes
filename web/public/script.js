/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

Vue.component('magic-grid', {
  name: 'MagicGrid',
  props: {
    wrapper: {
      type: String, // Required. Class or id of the container.
      default: 'wrapper',
    },
    gap: {
      type: Number, // Optional. Space between items. Default: 32px
      default: 32,
    },
    maxCols: {
      type: Number, // Maximum number of colums. Default: Infinite
      default: 5,
    },
    maxColWidth: {
      type: Number,
      default: 280,
    },
    animate: {
      type: Boolean, // Animate item positioning. Default: false.
      default: true,
    },
    useMin: {
      type: Boolean, // Place items in lower column
      default: false,
    },
  },
  data() {
    return {
      started: false,
      items: null,
    }
  },
  mounted() {
    this.waitUntilReady()
  },
  methods: {
    update() {
      this.started = false
      this.items = null
      this.waitUntilReady()
    },
    waitUntilReady() {
      if (this.isReady()) {
        this.positionItems()
        window.addEventListener('resize', () => {
          setTimeout(() => this.positionItems(), 200)
        })
      } else this.getReady()
    },
    isReady() {
      return this.$el && this.items && this.items.length > 0
    },
    getReady() {
      const interval = setInterval(() => {
        this.items = this.$el.children
        if (this.isReady()) {
          clearInterval(interval)
          this.init()
        }
      }, 100)
    },
    init() {
      if (!this.isReady() || this.started) return
      this.$el.style.position = 'relative'
      Array.prototype.forEach.call(this.items, (item) => {
        item.style.position = 'absolute'
        item.style.maxWidth = this.maxColWidth + 'px'
        if (this.animate) item.style.transition = 'top, left 0.2s ease'
      })
      this.started = true
      this.waitUntilReady()
    },
    colWidth() {
      if (!this.items) {
        return 0 // ほんとに？
      }
      return this.items[0].getBoundingClientRect().width + this.gap
    },
    setup() {
      const width = this.$el.getBoundingClientRect().width
      let numCols = Math.floor(width / this.colWidth()) || 1
      const cols = []
      if (this.maxCols && numCols > this.maxCols) {
        numCols = this.maxCols
      }
      for (let i = 0; i < numCols; i++) {
        cols[i] = {
          height: 0,
          top: 0,
          index: i,
        }
      }
      const wSpace = width - numCols * this.colWidth() + this.gap
      return {
        cols,
        wSpace,
      }
    },
    nextCol(cols, i) {
      if (this.useMin) return this.getMin(cols)
      return cols[i % cols.length]
    },
    positionItems() {
      const { cols, wSpace: _wSpace } = this.setup()
      const wSpace = Math.floor(_wSpace / 2)
      if (!this.items) {
        return
      }
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i]
        const min = this.nextCol(cols, i)
        const left = min.index * this.colWidth() + wSpace
        item.style.left = left + 'px'
        item.style.top = min.height + min.top + 'px'
        min.height += min.top + item.getBoundingClientRect().height
        min.top = this.gap
      }
      this.$el.style.height = this.getMax(cols).height + 'px'
    },
    getMax(cols) {
      let max = cols[0]
      for (const col of cols) {
        if (col.height > max.height) max = col
      }
      return max
    },
    getMin(cols) {
      let min = cols[0]
      for (const col of cols) {
        if (col.height < min.height) min = col
      }
      return min
    },
  },
  template: '<div :class="[wrapper]"><slot /></div>',
})

new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  data: {
    items: [],
    page: 1,
  },
  mounted() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.$vuetify.theme.dark = true
    }
    this.fetch()
  },
  watch: {
    page() {
      setTimeout(() => {
        this.$refs['magic-grid'].update()
        window.scroll({ top: 0, behavior: 'smooth' })
      }, 100)
    },
  },
  computed: {
    getItems() {
      return this.items.slice((this.page - 1) * 30, this.page * 30)
    },
  },
  methods: {
    fetch() {
      axios.get('/images').then((res) => {
        this.items = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )
      })
    },
    getTargetName(item) {
      return item.target.name
    },
    getImageUrl(item) {
      const imageId = item.images.find(
        (image) => image.size === 'small',
      ).imageId
      return `https://pbs.twimg.com/media/${imageId}?format=jpg&name=small`
    },
    calcHeight(item) {
      const image = item.images.find((image) => image.size === 'small')
      if (image.height === undefined) return '338px'
      return `${(image.height / image.width) * 240}px`
    },
    open(item) {
      this.openTwitterTweet(item.tweet.tweetId)
    },
    openTwitterTweet(tweetId) {
      return this.openUrlScheme(
        `twitter://status?id=${tweetId}`,
        `https://twitter.com/intent/like?tweet_id=${tweetId}`,
        1000,
      )
    },
    openUrlScheme(schemeUrl, webUrl, timeout) {
      if (!window) {
        return Promise.resolve()
      }
      return new Promise((resolve) => {
        let change = false
        setTimeout(() => {
          if (!change) {
            window.open(webUrl, '_blank')
          }
          resolve()
        }, timeout)
        window.location.href = schemeUrl
        window.onblur = function () {
          change = true
        }
        window.onfocus = function () {
          change = false
        }
      })
    },
  },
})
