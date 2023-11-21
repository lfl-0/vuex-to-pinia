const path = require('path')
const { scanFilesWithKeyword } = require('./scan')
const { transform } = require('./transform')

const start = async () => {
  const filePaths = await scanFilesWithKeyword(path.resolve(process.cwd(), 'test'))
  await Promise.all(filePaths.map((i) => transform(i, 'app', 'appStore', 'useAppStore')))
}

start()
