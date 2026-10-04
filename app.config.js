const app = require('./app.json');

const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

module.exports = {
  expo: {
    ...app.expo,
    ios: {
      ...app.expo?.ios,
      bundleIdentifier: 'com.fixora.app',
    },
    android: {
      ...app.expo?.android,
      package: 'com.fixora.app',
      config: {
        ...app.expo?.android?.config,
        googleMaps: {
          apiKey,
        },
      },
    },
    extra: {
      ...app.expo?.extra,
      eas: {
        projectId: "367837b8-e08e-4be0-932a-f1c9cb4bc4a9",
      },
    },
  },
};