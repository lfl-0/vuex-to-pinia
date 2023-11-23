const $ = require('gogocode')
const fs = require('fs-extra')
const path = require('path')

async function transform(filepath, vuexModuleName, piniaName, piniaHookName, output) {
  const isVue = path.extname(filepath) === '.vue'
  const source = await fs.readFile(filepath, { encoding: 'utf-8' })
  const ast = $(source, isVue ? { parseOptions: { language: 'vue' } } : {})
  const script = isVue ? ast.find('<script setup></script>') : ast

  const storeName = script.find('const $_$ = useStore()')?.match?.[0]?.[0].value

  if (!storeName) {
    return
  }

  const isReplaced = [
    transformState(script, storeName, vuexModuleName, piniaName),
    transformGetters(script, storeName, vuexModuleName, piniaName),
    transformCommitDispatch(script, 'commit', storeName, vuexModuleName, piniaName),
    transformCommitDispatch(script, 'dispatch', storeName, vuexModuleName, piniaName)
  ].includes(true)

  if (!isReplaced) {
    return
  }

  transformImport(script, storeName, vuexModuleName, piniaName, piniaHookName)

  const result = ast.generate()

  const distPath = getDistPath(filepath, output)
  await fs.createFile(distPath)
  fs.writeFile(distPath, result)

  console.log(`Modified: ${filepath}`)
  return true
}

function getDistPath(filepath, output) {
  if (!output) {
    return filepath
  }

  const outputRelative = path.relative(process.cwd(), output)
  const fileRelative = path.relative(process.cwd(), filepath)
  const dir = fileRelative.split(path.sep)[0]
  return path.resolve(process.cwd(), fileRelative.replace(dir, outputRelative))
}

function transformState(ast, storeName, vuexModuleName, piniaName) {
  if (!ast.find(`${storeName}.state.${vuexModuleName}.$_$`)?.match?.[0]) {
    return false
  }
  ast.replace(`${storeName}.state.${vuexModuleName}.$_$`, `${piniaName}.$_$`)
  return true
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
  return true
}

function transformCommitDispatch(ast, type, storeName, vuexModuleName, piniaName) {
  let isReplace = false
  ast.replace(`${storeName}.${type}($$$0)`, (match) => {
    const matched = match['$$$0']
    const name = matched[0].expressions[0].name
    const prefix = matched[0].quasis[0].value.raw
    const otherParams = matched.slice(1).map((i) => i.name)
    if (prefix !== `${vuexModuleName}/`) {
      return `${storeName}.${type}(\`${prefix}\$\{${name}\}\`${otherParams.length ? ', ' : ''}${otherParams.join(
        ', '
      )})`
    }
    isReplace = true
    return `${piniaName}[${name}](${otherParams.join(', ')})`
  })
  return isReplace
}

function transformImport(ast, storeName, vuexModuleName, piniaName, piniaHookName) {
  // 添加 pinia 导入
  ast.find(`import useStore from '@/store'`).each((i) => {
    i.after(`import ${piniaHookName} from '@/stores/${vuexModuleName}'\n`)
  })

  const actionAst = ast.find(`import { $$$0 } from '@/store/${vuexModuleName}/actionTypes'`)
  const mutationAst = ast.find(`import { $$$0 } from '@/store/${vuexModuleName}/mutationTypes'`)
  const actionTypesName = actionAst.match?.['$$$0']?.map((i) => i.local.name) || []
  const mutationTypesName = mutationAst.match?.['$$$0']?.map((i) => i.local.name) || []
  const allTypesName = [...actionTypesName, ...mutationTypesName].filter((i) => i)
  if (allTypesName.length) {
    actionAst.remove()
    mutationAst.remove()
    ast.before(`import { ${allTypesName.join(', ')} } from '@/stores/${vuexModuleName}/actionTypes'\n`)
  }

  // 添加 pinia hook
  ast.find(`const ${storeName} = useStore()`).each((i) => {
    i.after(`const ${piniaName} = ${piniaHookName}()`)
  })

  // 没有使用则移除vuex
  if (!ast.find(`${storeName}.$_$`)?.match?.[0]) {
    ast.find(`import useStore from '@/store'`).remove()
    ast.find('const $_$ = useStore()').remove()
  }
}

module.exports = {
  transform
}
