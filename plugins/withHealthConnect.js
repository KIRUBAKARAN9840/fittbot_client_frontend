const { withAndroidManifest, withMainActivity, AndroidConfig } = require('@expo/config-plugins');

const withHealthConnect = (config) => {
  // First, modify MainActivity to add permission delegate setup
  config = withMainActivity(config, (config) => {
    const { modResults } = config;
    let { contents } = modResults;

    // Detect if file is Kotlin or Java
    const isKotlin = modResults.path?.endsWith('.kt') || contents.includes('class MainActivity');

    // Only proceed if HealthConnectPermissionDelegate is not already set up
    if (contents.includes('HealthConnectPermissionDelegate.registerPermissionDelegate')) {
      // Already configured, skip
      return config;
    }

    // Add imports for HealthConnectPermissionDelegate
    if (!contents.includes('dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate')) {
      if (isKotlin) {
        // For Kotlin files - add after package declaration
        let importsToAdd = '\nimport dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate\n';

        // Only add Bundle import if not already present
        if (!contents.includes('import android.os.Bundle')) {
          importsToAdd += 'import android.os.Bundle\n';
        }

        contents = contents.replace(
          /(package\s+[^\n]+\n)/,
          '$1' + importsToAdd
        );
      } else {
        // For Java files
        let importsToAdd = '\nimport dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate;\n';

        if (!contents.includes('import android.os.Bundle')) {
          importsToAdd += 'import android.os.Bundle;\n';
        }

        contents = contents.replace(
          /(package\s+[^;]+;\s*)/,
          '$1' + importsToAdd
        );
      }
    }

    // Add onCreate override with permission delegate setup
    if (isKotlin) {
      // Check if onCreate already exists in MainActivity class
      const mainActivityRegex = /class\s+MainActivity[\s\S]*?(?=\nclass\s|\n$)/;
      const mainActivityMatch = contents.match(mainActivityRegex);

      if (mainActivityMatch && mainActivityMatch[0].includes('override fun onCreate')) {
        // onCreate exists in MainActivity, add delegate setup inside it
        contents = contents.replace(
          /(override\s+fun\s+onCreate\s*\([^)]*\)\s*\{\s*super\.onCreate\s*\([^)]*\))/s,
          '$1\n        HealthConnectPermissionDelegate.registerPermissionDelegate(this)'
        );
      } else {
        // No onCreate in MainActivity, create new method
        const onCreateMethod = `
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        HealthConnectPermissionDelegate.registerPermissionDelegate(this)
    }
`;
        // Insert after MainActivity class declaration opening brace
        contents = contents.replace(
          /(class\s+MainActivity[^{]*\{)/,
          '$1' + onCreateMethod
        );
      }
    } else {
      // Java version
      const mainActivityRegex = /class\s+MainActivity[\s\S]*?(?=\nclass\s|\n$)/;
      const mainActivityMatch = contents.match(mainActivityRegex);

      if (mainActivityMatch && mainActivityMatch[0].includes('void onCreate')) {
        // onCreate exists in MainActivity, add delegate setup inside it
        contents = contents.replace(
          /(@Override\s+protected\s+void\s+onCreate\s*\([^)]*\)\s*\{\s*super\.onCreate\s*\([^)]*\);)/s,
          '$1\n    HealthConnectPermissionDelegate.INSTANCE.registerPermissionDelegate(this);'
        );
      } else {
        // No onCreate in MainActivity, create new method
        const onCreateMethod = `
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    HealthConnectPermissionDelegate.INSTANCE.registerPermissionDelegate(this);
  }
`;
        // Insert after MainActivity class declaration opening brace
        contents = contents.replace(
          /(class\s+MainActivity[^{]*\{)/,
          '$1' + onCreateMethod
        );
      }
    }

    modResults.contents = contents;
    return config;
  });

  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add queries section if it doesn't exist
    if (!androidManifest.queries) {
      androidManifest.queries = [];
    }

    // Add Health Connect package query
    const healthConnectQuery = {
      package: [
        {
          $: {
            'android:name': 'com.google.android.apps.healthdata',
          },
        },
      ],
    };

    // Check if the query already exists
    const queryExists = androidManifest.queries.some((query) => {
      return query.package && query.package.some((pkg) => {
        return pkg.$['android:name'] === 'com.google.android.apps.healthdata';
      });
    });

    if (!queryExists) {
      androidManifest.queries.push(healthConnectQuery);
    }

    // Add intent-filter to the main activity for Health Connect
    const application = androidManifest.application;
    if (application && application[0] && application[0].activity) {
      const mainActivity = application[0].activity.find((activity) => {
        return activity['intent-filter'] && activity['intent-filter'].some((filter) => {
          return filter.action && filter.action.some((action) => {
            return action.$['android:name'] === 'android.intent.action.MAIN';
          });
        });
      });

      if (mainActivity) {
        // Add Health Connect intent filter
        const healthConnectIntentFilter = {
          action: [
            {
              $: {
                'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE',
              },
            },
          ],
        };

        // Check if intent filter already exists
        const intentFilterExists = mainActivity['intent-filter'].some((filter) => {
          return filter.action && filter.action.some((action) => {
            return action.$['android:name'] === 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';
          });
        });

        if (!intentFilterExists) {
          mainActivity['intent-filter'].push(healthConnectIntentFilter);
        }
      }
    }

    return config;
  });
};

module.exports = withHealthConnect;
