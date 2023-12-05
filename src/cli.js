#!/usr/bin/env node
const version = require('../package.json').version
const { program } = require('commander')
const { start } = require('./start')
const { format } = require('./format')

program.name('vtp').description('Vuex to pinia').version(version)

program
  .command('start')
  .description('Start')
  .argument('<string>', 'Input folder')
  .option('-o, --output <char>', 'Output folder')
  .action((src, options) => {
    start(src, options?.output)
  })

program
  .command('fmt')
  .description('Format')
  .argument('<string>', 'Input folder')
  .action((src) => {
    format(src)
  })

program.parse(process.argv)
