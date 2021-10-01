/* eslint global-require: 0 */
/* eslint import/no-dynamic-require: 0 */

const { resolve } = require('path')
const PnpWebpackPlugin = require('pnp-webpack-plugin')
const WebpackAssetsManifest = require('webpack-assets-manifest')
const webpack = require('webpack')
const rules = require('../rules')
const { isProduction } = require('../env')
const config = require('../config')
const { moduleExists, parseEntryPath } = require('../utils/helpers')

const getEntryObject = () => {
  let entries = {}
  
  if (Array.isArray(config.source_entry_path)) {
    config.source_entry_path.forEach((entryPath) => {
      Object.assign(entries, parseEntryPath(config.source_path, entryPath))
    }) 
  } else {
    entries = parseEntryPath(config.source_path, config.source_entry_path)
  }

  return entries
}

const getModulePaths = () => {
  const result = [resolve(config.source_path)]

  if (config.additional_paths) {
    config.additional_paths.forEach((path) => result.push(resolve(path)))
  }
  result.push('node_modules')

  return result
}

const getPlugins = () => {
  const plugins = [
    new webpack.EnvironmentPlugin(process.env),
    new WebpackAssetsManifest({
      entrypoints: true,
      writeToDisk: true,
      output: 'manifest.json',
      entrypointsUseAssets: true,
      publicPath: true
    })
  ]

  if (moduleExists('css-loader') && moduleExists('mini-css-extract-plugin')) {
    const hash = isProduction ? '-[contenthash:8]' : ''
    const MiniCssExtractPlugin = require('mini-css-extract-plugin')
    plugins.push(
      new MiniCssExtractPlugin({
        filename: `css/[name]${hash}.css`,
        chunkFilename: `css/[id]${hash}.css`
      })
    )
  }

  return plugins
}

// Don't use contentHash except for production for performance
// https://webpack.js.org/guides/build-performance/#avoid-production-specific-tooling
const hash = isProduction ? '-[contenthash]' : ''
module.exports = {
  mode: 'production',
  output: {
    filename: `js/[name]${hash}.js`,
    chunkFilename: `js/[name]${hash}.chunk.js`,

    // https://webpack.js.org/configuration/output/#outputhotupdatechunkfilename
    hotUpdateChunkFilename: 'js/[id].[fullhash].hot-update.js',
    path: config.outputPath,
    publicPath: config.publicPath
  },
  entry: getEntryObject(),
  resolve: {
    extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.coffee'],
    modules: getModulePaths(),
    plugins: [PnpWebpackPlugin]
  },

  plugins: getPlugins(),

  resolveLoader: {
    modules: ['node_modules'],
    plugins: [PnpWebpackPlugin.moduleLoader(module)]
  },

  optimization: {
    splitChunks: { chunks: 'all' },

    runtimeChunk: 'single'
  },

  module: {
    strictExportPresence: true,
    rules
  }
}
