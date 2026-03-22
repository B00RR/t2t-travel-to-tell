const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable persistent filesystem cache — speeds up cold starts and rebuilds
config.cacheStores = require('metro-cache').FileStore
  ? [new (require('metro-cache').FileStore)({ root: require('path').join(__dirname, '.metro-cache') })]
  : config.cacheStores;

module.exports = config;
