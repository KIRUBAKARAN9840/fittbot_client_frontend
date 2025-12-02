import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../utils/Toaster";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vibration, Platform, AppState } from "react-native";
import { NavigationProvider } from "../context/NavigationContext";
import { UserProvider } from "../context/UserContext";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";

import { NoInternetScreen } from "../components/NoInternetScreen";
import { useNetworkStatusExpo } from "../hooks/useNetworkStatus";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const channel = notification.request.content.data?.channel || "default";

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldHandleActionButtons: true,
      vibrate: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { isConnected, isRetrying, retryConnection } = useNetworkStatusExpo();
  // Check if the current route is the change password screen
  const isChangePasswordScreen = pathname === "/changepassword";

  const [isSideNavVisible, setIsSideNavVisible] = useState(false);

  const toggleSideNav = () => {
    setIsSideNavVisible(!isSideNavVisible);
  };

  const closeSideNav = () => {
    setIsSideNavVisible(false);
  };

  async function configureNotificationChannels() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#FF231F7C",
        enableVibrate: true,
        sound: "general_alert.wav",
      });

      await Notifications.setNotificationChannelAsync("diet_channel", {
        name: "Diet Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#FF231F7C",
        enableVibrate: true,
        sound: "diet_alert.wav",
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync("workout_channel", {
        name: "Workout Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#FF231F7C",
        enableVibrate: true,
        sound: "workout_alert.wav",
        vibrationPattern: [0, 300, 300, 300],
      });

      await Notifications.setNotificationChannelAsync("water_channel", {
        name: "Workout Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#FF231F7C",
        enableVibrate: true,
        sound: "water_alert.wav",
        vibrationPattern: [0, 300, 300, 300],
      });

      await Notifications.setNotificationChannelAsync("other_channel", {
        name: "Workout Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#FF231F7C",
        enableVibrate: true,
        sound: "other_alert.wav",
        vibrationPattern: [0, 300, 300, 300],
      });
    }
  }

  // Check for OTA updates on app launch
  useEffect(() => {
    async function checkForUpdates() {
      try {
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.log("Update check failed:", error);
      }
    }
    checkForUpdates();
  }, []);

  useEffect(() => {
    configureNotificationChannels();
  }, []);

  const goToPage = (page: string) => {
    switch (page) {
      case "My Gym":
        return "/client/home";
      case "Water":
        return "/client/home";
      case "Diet":
        return "/client/diet";
      default:
        return "/client/home";
    }
  };

  const getParams = (page: any) => {
    switch (page) {
      case "My Gym":
        return "My Gym";
      case "Water":
        return "Water";
      case "Diet":
        return "";
      default:
        return "";
    }
  };

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const channel = notification.request.content.data?.channel || "default";

        const vibrationPattern =
          notification.request.content.data?.vibrationPattern;

        if (AppState.currentState === "active") {
          if (vibrationPattern && Array.isArray(vibrationPattern)) {
            Vibration.vibrate(vibrationPattern);
          }
        }
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const channel =
          response.notification.request.content.data?.channel || "default";

        const vibrationPattern =
          response.notification.request.content.data?.vibrationPattern;

        if (vibrationPattern && Array.isArray(vibrationPattern)) {
          Vibration.vibrate(vibrationPattern);
        }

        const notificationPage =
          response.notification.request.content.data.page;
        const tabParam = getParams(notificationPage);

        const saveNotificationData = async () => {
          try {
            await AsyncStorage.setItem("notification_tab", tabParam);
            await AsyncStorage.setItem(
              "notification_timestamp",
              Date.now().toString()
            );
            await AsyncStorage.setItem("notification_channel", channel);
            const accessToken = await SecureStore.getItemAsync("access_token");
            const targetRoute = accessToken ? goToPage(notificationPage) : "/";
            router.push({
              pathname: targetRoute,
              params: {
                tab: tabParam,
                notif_timestamp: Date.now().toString(),
                channel: channel,
              },
            });
          } catch (error) {}
        };

        saveNotificationData();
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          // Splash screen already hidden or not registered
        }
      };
      hideSplash();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (isConnected === false) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NoInternetScreen onRetry={retryConnection} isRetrying={isRetrying} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  // If we're on the change password screen, render outside of GestureHandlerRootView
  if (isChangePasswordScreen) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <UserProvider>
          <NavigationProvider>
            <View style={{ zIndex: 10000 }}>
              <Toast topOffset={70} config={toastConfig} />
            </View>

            {/* Separate navigation stack just for the change password screen */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="changepassword" />
              <Stack.Screen name="forgotpassword" />
              <Stack.Screen name="index" />
            </Stack>

            <StatusBar style="auto" />
          </NavigationProvider>
        </UserProvider>
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <UserProvider>
          <NavigationProvider>
            <View style={{ zIndex: 10000 }}>
              <Toast topOffset={70} config={toastConfig} />
            </View>

            <Stack>
              <Stack.Screen
                name="client/(tabs)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/(diet)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/(workout)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="index"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="forgotpassword"
                options={{ headerShown: false }}
              />
              {/* changepassword is handled in the conditional branch above */}

              <Stack.Screen
                name="verification"
                options={{ headerShown: false }}
              />

              {/* ---------------------- registration routes ---------------------- */}
              <Stack.Screen
                name="register/index"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="register/second-step"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/age-selector"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/third-step"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/fourth-step"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/fifth-step"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/fifth-step-target"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/body-shape-current"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/body-shape-target"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/sixth-step"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/seventh-step"
                options={{ headerShown: false }}
              />

              {/* ---------------------- subscribed client routes ---------------------- */}
              <Stack.Screen
                name="OtpVerification"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/exercise"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/subscription"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/paynow"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/referral"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/help"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/transformation"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/addimage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/profile"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="client/allcharts"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/clientfeedback"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/sessionchat"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/viewjourney"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/preferences"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/ratenow"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/deleteaccount"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="client/personaltraining"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/gymdetails"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/fittbotfeatures"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/dailypass"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/allpass"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/upgradegyms"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/upgradepass"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/purchasehistory"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/passpay"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/gympay"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="client/blockedusers"
                options={{ headerShown: false }}
              />
               <Stack.Screen
                name="client/fittbotcash"
                options={{ headerShown: false }}
              />

              {/* ---------------------- Unsubscribed client routes ---------------------- */}
              <Stack.Screen
                name="unpaid/home"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="unpaid/activateaccount"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="unpaid/profile"
                options={{ headerShown: false, gestureEnabled: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </NavigationProvider>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
