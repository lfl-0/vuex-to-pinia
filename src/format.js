const { gitlogPromise } = require('gitlog')
const path = require('path')
const { exec } = require('child_process')
const fs = require('fs/promises')

function getFileRaw(hash, filepath) {
  return new Promise((resolve, reject) => {
    exec(`git show ${hash}:${filepath}`, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
}

async function getCommits(file) {
  const commits = await gitlogPromise({
    repo: process.cwd(),
    file
  })
  return commits
}

const isStartTemplate = (content) => /^\S*<template/.test(content)

function swapTemplateAndScript(str) {
  const templateMatch = str.match(/<template>[\s\S]*<\/template>/)
  const scriptMatch = str.match(/<script.*?>[\s\S]*<\/script>/)

  if (!templateMatch || !scriptMatch) {
    return str
  }

  const template = templateMatch[0]
  const script = scriptMatch[0]

  // 替换原位置为占位符
  str = str.replace(template, 'TEMPLATE_PLACEHOLDER')
  str = str.replace(script, 'SCRIPT_PLACEHOLDER')

  // 交换位置
  str = str.replace('TEMPLATE_PLACEHOLDER', script)
  str = str.replace('SCRIPT_PLACEHOLDER', template)

  return str
}

function getScript(str) {
  return str.match(/<script.*?>/)?.[0]
}

function getStyle(str) {
  return str.match(/<style.*?>/)?.[0]
}

async function formatOne(file) {
  const [last, last2] = await getCommits(file)
  const [lastRaw, last2Raw] = await Promise.all([getFileRaw(last.hash, file), getFileRaw(last2.hash, file)])
  let newRaw = lastRaw
  let isUpdated = false

  if (isStartTemplate(lastRaw) !== isStartTemplate(last2Raw)) {
    newRaw = swapTemplateAndScript(lastRaw)
    isUpdated = true
  }

  const lastScript = getScript(newRaw)
  const last2Script = getScript(last2Raw)
  if (lastScript && last2Script && lastScript !== last2Script) {
    newRaw = newRaw.replace(lastScript, last2Script)
    isUpdated = true
  }

  const lastStyle = getStyle(newRaw)
  const last2Style = getStyle(last2Raw)
  if (lastStyle && last2Style && lastStyle !== last2Style) {
    newRaw = newRaw.replace(lastStyle, last2Style)
    isUpdated = true
  }

  const newTemplateWhite = newRaw.match(/(?<=<template>[\s\S]*<\/template>)\s*/)[0]
  const oldTemplateWhite = last2Raw.match(/(?<=<template>[\s\S]*<\/template>)\s*/)[0]
  if (newTemplateWhite !== oldTemplateWhite) {
    newRaw = newRaw.replace(/(?<=<template>[\s\S]*<\/template>)\s*/, oldTemplateWhite)
    isUpdated = true
  }

  const newScriptWhite = newRaw.match(/(?<=<script.*?>[\s\S]*<\/script>)\s*/)[0]
  const oldScriptWhite = last2Raw.match(/(?<=<script.*?>[\s\S]*<\/script>)\s*/)[0]
  if (newScriptWhite !== oldScriptWhite) {
    newRaw = newRaw.replace(/(?<=<script.*?>[\s\S]*<\/script>)\s*/, oldScriptWhite)
    isUpdated = true
  }

  if (isUpdated) {
    const filepath = path.resolve(process.cwd(), file)
    console.log(filepath)
    await fs.writeFile(filepath, newRaw, 'utf-8')
  }
}

async function format(dir) {
  const [lastCommit] = await getCommits(dir)
  const allFiles = lastCommit.files.filter((i) => i.endsWith('.vue'))
  await Promise.all(allFiles.map((i) => formatOne(i)))
}

module.exports = {
  format
}
