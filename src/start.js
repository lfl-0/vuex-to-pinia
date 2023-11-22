const path = require('path')
const inquirer = require('inquirer')
const { scanFilesWithKeyword } = require('./scan')
const { transform } = require('./transform')

async function start(src, output) {
  const { vuexModuleName, piniaHookName, piniaName } = await inquirer.prompt([
    { type: 'input', name: 'vuexModuleName', message: 'Please enter the vuex module name:' },
    { type: 'input', name: 'piniaHookName', message: 'Please enter the pinia hook name:' },
    { type: 'input', name: 'piniaName', message: 'Please enter the pinia variable name:' }
  ])

  const filePaths = await scanFilesWithKeyword(path.resolve(process.cwd(), src))
  const res = await Promise.all(filePaths.map((i) => transform(i, vuexModuleName, piniaHookName, piniaName, output)))
  const count = res.filter((i) => i).length
  console.log(`${count} files were modified!!!`)
}

module.exports = {
  start,
}
