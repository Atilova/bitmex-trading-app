const { defineConfig } = require('@vue/cli-service')
const Dotenv = require('dotenv-webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      'proxy-bitmex/': {
        target: 'https://testnet.bitmex.com',
        changeOrigin: true,
        pathRewrite: { '^/proxy-bitmex': '' }
      }
    },
  }
})
