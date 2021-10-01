const { basename, dirname, join, relative, resolve } = require('path')
const { sync: globSync } = require('glob')
const extname = require('path-complete-extname')

const isArray = (value) => Array.isArray(value)
const isBoolean = (str) => /^true/.test(str) || /^false/.test(str)
const chdirTestApp = () => {
  try {
    return process.chdir('test/test_app')
  } catch (e) {
    return null
  }
}

const chdirCwd = () => process.chdir(process.cwd())

const resetEnv = () => {
  process.env = {}
}

const ensureTrailingSlash = (path) => (path.endsWith('/') ? path : `${path}/`)

const resolvedPath = (packageName) => {
  try {
    return require.resolve(packageName)
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
    return null
  }
}

const moduleExists = (packageName) => (!!resolvedPath(packageName))

const canProcess = (rule, fn) => {
  const modulePath = resolvedPath(rule)

  if (modulePath) {
    return fn(modulePath)
  }

  return null
}

const parseEntryPath = (sourcePath, entryPath) => {
  const entries = {}
  const rootPath = join(sourcePath, entryPath)

  globSync(`${rootPath}/*.*`).forEach((path) => {
    const namespace = relative(join(rootPath), dirname(path))
    const name = join(namespace, basename(path, extname(path)))
    let assetPaths = resolve(path)
    
    // Allows for multiple filetypes per entry (https://webpack.js.org/guides/entry-advanced/)
    // Transforms the config object value to an array with all values under the same name
    let previousPaths = entries[name]
    if (previousPaths) {
      previousPaths = Array.isArray(previousPaths)
        ? previousPaths
        : [previousPaths]
      previousPaths.push(assetPaths)
      assetPaths = previousPaths
    }

    if (entryPath === '/') {
      entries[name] = assetPaths
    } else {
      entries[`${entryPath.substring(1)}/${name}`] = assetPaths
    }
  })

  return entries
}

module.exports = {
  chdirTestApp,
  chdirCwd,
  isArray,
  isBoolean,
  ensureTrailingSlash,
  canProcess,
  moduleExists,
  resetEnv,
  parseEntryPath
}
