const { withInfoPlist } = require('@expo/config-plugins');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

/** @type {import('expo/config').ExpoConfig} */
const config = require('./app.json').expo;

module.exports = {
  expo: {
    ...config,
    owner: 'b00r',
    ios: {
      ...config.ios,
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: (config.plugins || []).filter(
      (p) =>
        !(Array.isArray(p) ? p[0] === 'react-native-maps' : p === 'react-native-maps')
    ),
    extra: {
      ...(config.extra || {}),
      eas: {
        projectId: '6e2b1264-ba9e-4185-9b04-57b688492d45',
      },
    },
  },
};
