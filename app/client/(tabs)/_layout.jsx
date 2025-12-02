import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Platform, Image, Pressable, Dimensions } from "react-native";
import { LogBox } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");
// Ignore specific warnings that might be causing crashes
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Sending `onAnimatedValueUpdate` with no listeners registered",
]);

export default function TabLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const getTabColor = (routeName, isFocused) => {
    const tabColors = {
      home: "#FF5757",
      feed: "#1DA1F2",
      workout: "#297DB3",
      diet: "#28A745",
      marketplace: "#D11AFF",
    };

    return isFocused ? tabColors[routeName] || "#A1338E" : "#979797";
  };

  // Custom tab icon generator function
  const getTabIcon = (routeName, isActive) => {
    // Define your image paths
    const icons = {
      home: {
        active: require("@/assets/images/icons/home-active.png"),
        inactive: require("@/assets/images/icons/home-inactive.png"),
      },
      feed: {
        active: require("@/assets/images/icons/feed-active.png"),
        inactive: require("@/assets/images/icons/feed-inactive.png"),
      },
      workout: {
        active: require("@/assets/images/icons/workout-active.png"),
        inactive: require("@/assets/images/icons/workout-inactive.png"),
      },
      diet: {
        active: require("@/assets/images/icons/diet-active.png"),
        inactive: require("@/assets/images/icons/diet-inactive.png"),
      },
      marketplace: {
        active: require("@/assets/images/icons/shop-active.png"),
        inactive: require("@/assets/images/icons/shop-inactive.png"),
      },
    };

    // Return the appropriate image based on active state
    return (
      <Image
        source={isActive ? icons[routeName].active : icons[routeName].inactive}
        style={{ width: icons[routeName] == "workout" ? 27 : 45, height: 27 }}
        resizeMode="contain"
      />
    );
  };

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: "#FF5757",
          tabBarInactiveTintColor: "#979797",
          headerShown: false,
          tabBarButton: (props) => (
            <Pressable {...props} android_ripple={null} style={props.style} />
          ),
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: "#FFFFFF",
              borderTopWidth: 0,
              paddingTop: 5,
              // paddingBottom: insets.bottom,
              height: 65 + insets.bottom,
              display: pathname.includes("/marketplace") ? "none" : "flex",
              opacity: 1,
              shadowColor: "transparent",
              elevation: 0,
            },
            default: {
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderColor: "#FFDDDD",
              paddingTop: 5,
              // paddingBottom: insets.bottom,
              height: 65 + insets.bottom,
              display: pathname.includes("/marketplace") ? "none" : "flex",
              opacity: 1,
              elevation: 0,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 5,
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 2,
          },
        })}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => getTabIcon("home", focused),
          }}
        />

        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ focused }) => getTabIcon("feed", focused),
          }}
        />

        <Tabs.Screen
          name="workout"
          options={{
            title: width >= 786 ? `${"   "}Workout` : "Workout",
            tabBarIcon: ({ focused }) => getTabIcon("workout", focused),
          }}
        />

        <Tabs.Screen
          name="diet"
          options={{
            title: "Diet",
            tabBarIcon: ({ focused }) => getTabIcon("diet", focused),
          }}
        />

        <Tabs.Screen
          name="marketplace"
          options={{
            title: "Shop",
            tabBarIcon: ({ focused }) => getTabIcon("marketplace", focused),
          }}
        />
      </Tabs>
    </>
  );
}
