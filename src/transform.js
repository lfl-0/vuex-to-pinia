const $ = require('gogocode')
const fs = require('fs-extra')
const path = require('path')

async function transform(filepath, vuexModuleName, piniaName, piniaHookName) {
  const isVue = path.extname(filepath) === '.vue'
  const source = await fs.readFile(filepath, { encoding: 'utf-8' })
  const ast = $(source, isVue ? { parseOptions: { language: 'vue' } } : {})
  const script = isVue ? ast.find('<script></script>') : ast

  const storeName = script.find('const $_$ = useStore()')?.match?.[0]?.[0].value
  if (storeName) {
    script.replace(`${storeName}.state.${vuexModuleName}.$_$`, `${piniaName}.$_$`)
    transformGetters(script, storeName, vuexModuleName, piniaName)
    transformCommitDispatch(script, 'commit', storeName, vuexModuleName, piniaName)
    transformCommitDispatch(script, 'dispatch', storeName, vuexModuleName, piniaName)
    script.find(`import useStore from '@/store'`).each(i => {
      i.after(`import useAppStore from '@/stores/${vuexModuleName}'`)
    })
    script.find(`const ${storeName} = useStore()`).each(i => {
      i.after(`const ${piniaName} = ${piniaHookName}()`)
    })
  }

  const result = ast.generate()

  const distPath = path.resolve(process.cwd(), 'dist', path.relative(process.cwd(), filepath))
  await fs.createFile(distPath)
  fs.writeFile(distPath, result)
}

function transformGetters(ast, storeName, vuexModuleName, piniaName) {
  const matchPre = `${vuexModuleName}/`
  const matchName = `${vuexModuleName}/$_$`
  const getters = ast.find(`${storeName}.getters['${matchName}']`)
  if (!getters?.match[matchPre]?.length) {
    return
  }
  getters.match[matchPre].forEach((i) => {
    const name = i.value.replace(matchPre, '')
    getters.replace(`${storeName}.getters['${matchName}']`, `${piniaName}.${name}`)
  })
}

function transformCommitDispatch(ast, type, storeName, vuexModuleName, piniaName) {
  ast.replace(`${storeName}.${type}($$$0)`, (match) => {
    const matched = match['$$$0']
    const name = matched[0].expressions[0].name
    const prefix = matched[0].quasis[0].value.raw
    const otherParams = matched.slice(1).map((i) => i.name)
    if (prefix !== `${vuexModuleName}/`) {
      return `${storeName}.${type}(\`${prefix}\$\{${name}\}\`${otherParams.length ? ', ' : ''}${otherParams.join(', ')})`
    }
    return `${piniaName}[${name}](${otherParams.join(', ')})`
  })
}

module.exports = {
  transform
}
