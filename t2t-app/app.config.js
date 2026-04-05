const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 't2t-app',
    slug: 't2t-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 't2tapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: 'b00r',
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      package: 'com.t2t.travel',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      versionCode: 2,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-video',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to use your location.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.',
        },
      ],
      'expo-secure-store',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      eas: {
        projectId: '6e2b1264-ba9e-4185-9b04-57b688492d45',
      },
    },
  },
};

