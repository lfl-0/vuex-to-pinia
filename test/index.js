const { transform } = require('../src/transform')
const path = require('path')

const output = path.resolve(process.cwd(), 'dist')
const filepath = path.resolve(__dirname, './source/components/Test.vue')
const distDir = path.relative(process.cwd(), output)
const outputDir = path.relative(process.cwd(), filepath)
const dir = outputDir.split(path.sep)[0]
path.resolve(process.cwd(),  outputDir.replace(dir, distDir))

// transform(
//   path.resolve(__dirname, './source/components/Test.vue'),
//   'app',
//   'appStore',
//   'useAppStore',
//   path.resolve(__dirname, '../dist')
// )
