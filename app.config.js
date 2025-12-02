export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: "./google-services.json",
      permissions: [
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",
        "com.android.vending.BILLING",
        "android.permission.health.READ_STEPS",
      ],
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_EXTERNAL_STORAGE",
      ],
    },
    extra: {
      ...config.extra,
      // backendUrl: "https://app.fittbot.com",
      backendUrl: "https://erminia-mirthful-nonpatriotically.ngrok-free.dev",
      // backendUrl: "https://staging.fittbot.com",
      // backendUrl: "http://192.168.1.14",
      backendPort: "8000",
      eas: {
        projectId: "d83115b4-2dd1-43c9-af11-da8dc85a5966",
      },
    },
  };
};
//"buildType": "app-bundle"
