const { transform } = require('../src/transform')
const path = require('path')

transform(
  path.resolve(__dirname, './source/components/Test.vue'),
  'app',
  'appStore',
  'useAppStore',
  path.resolve(__dirname, '../dist')
)
