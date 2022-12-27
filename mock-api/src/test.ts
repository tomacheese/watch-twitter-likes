import axios from 'axios'

async function getTargetApi() {
  const response = await axios.get('https://likes.amatama.net/api/targets')
  if (response.status !== 200) {
    throw new Error('Internal Server Error')
  }
  // OK
  console.log('getTargetApi: OK')
}

async function getImagesApi() {
  const response = await axios.get('https://likes.amatama.net/api/images')
  if (response.status !== 200) {
    throw new Error('Internal Server Error')
  }
  // OK
  console.log('getImagesApi: OK')
}

async function main() {
  await getTargetApi()
  await getImagesApi()
}

;(async () => {
  await main()
})()
