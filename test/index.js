const { start } = require('../src/start')
const { transform } = require('../src/transform')
const path = require('path')

start(
  path.resolve(__dirname, './source'),
  path.resolve(__dirname, '../dist')
)
