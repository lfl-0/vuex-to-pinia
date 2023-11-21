const fs = require('fs')
const path = require('path')
const util = require('util')

const readdir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const stat = util.promisify(fs.stat)

async function scanFilesWithKeyword(directory) {
  let result = []
  const files = await readdir(directory)

  for (let file of files) {
    const absolutePath = path.join(directory, file)
    const fileStat = await stat(absolutePath)

    if (fileStat.isDirectory()) {
      const nestedFiles = await scanFilesWithKeyword(absolutePath)
      result = result.concat(nestedFiles)
    } else {
      if (['.ts', '.js', '.vue'].includes(path.extname(absolutePath))) {
        const fileContent = await readFile(absolutePath, 'utf-8')

        if (fileContent.includes('useStore()') || fileContent.includes('.$store')) {
          result.push(absolutePath)
        }
      }
    }
  }

  return result
}

module.exports = {
  scanFilesWithKeyword
}
