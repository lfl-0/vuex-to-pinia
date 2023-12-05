const { format } = require('../src/format')
const path = require('path')

async function start() {
  format(path.resolve(process.cwd(), 'test/source'))
}

start()
