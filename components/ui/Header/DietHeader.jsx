import { Image } from "expo-image";
import React, { forwardRef } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native";

const { width, height } = Dimensions.get("window");

const DietHeader = forwardRef(
  (
    {
      tabHeaders,
      activeTabHeader,
      handleTabSelection,
      headerName,
      showXpBar,
      page,
    },
    ref
  ) => {
    const isTablet = () => {
      const aspectRatio = height / width;
      return width >= 768 || (width >= 600 && aspectRatio < 1.6);
    };

    return (
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabsContainer,
          // { flex: tabHeaders?.length > 3 ? 0 : 1 },
          {
            flex:
              (headerName === "Diet" ||
                headerName === "Feed" ||
                headerName === "Workout") &&
              1,
          },
          // Add minimum height when no tabs to maintain header height
          tabHeaders?.length === 0 && { minHeight: 70 },
        ]}
        pointerEvents="auto"
        style={{ zIndex: 999 }}
      >
        {tabHeaders?.map((tab, index) => {
          const isActive = activeTabHeader === tab.title;

          return (
            <TouchableOpacity
              key={tab.title}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => handleTabSelection(tab.title, index)}
            >
              <View
                style={[
                  styles.tabIconContainer,
                  isActive && styles.tabIconContainerActive,
                ]}
              >
                {tab.iconType === "icon" && tab.iconLibrary && tab.iconName && (
                  <tab.iconLibrary
                    name={tab.iconName}
                    size={14}
                    color={isActive ? "#fff" : "rgba(255, 255, 255, 0.5)"}
                  />
                )}
                {tab.iconType === "png" && page === "home" && isActive && (
                  <Image
                    source={tab.iconSourceActive}
                    style={{
                      width: 31,
                      height: 31,
                      // tintColor: isActive ? "#fff" : "rgba(255, 255, 255, 0.5)",
                    }}
                    contentFit="contain"
                  />
                )}

                {tab.iconType === "png" && page === "home" && !isActive && (
                  <Image
                    source={tab.iconSource}
                    style={{
                      width: 31,
                      height: 31,
                      // tintColor: isActive ? "#fff" : "rgba(255, 255, 255, 0.5)",
                    }}
                    contentFit="contain"
                  />
                )}

                {tab.iconType === "png" && page !== "home" && (
                  <Image
                    source={tab.iconSource}
                    style={{
                      width: 40,
                      height: 40,
                      tintColor: isActive ? "#fff" : "rgba(255, 255, 255, 0.5)",
                    }}
                    contentFit="contain"
                  />
                )}
                {tab.iconType === "image" && (
                  <Image
                    source={tab.iconSource}
                    style={{
                      width: 14,
                      height: 14,
                    }}
                    contentFit="contain"
                  />
                )}
              </View>
              {page === "home" ? (
                <Text
                  style={[
                    styles.tabTextHeader,
                    isActive && styles.tabTextActive,
                    // !showXpBar && styles.tabTextXp,
                    isActive && {
                      color: "#1A1A1A",
                      fontWeight: "normal",
                      paddingTop: 3,
                    },
                    !isActive && {
                      color: "rgba(26,26,26,0.4)",
                      fontWeight: "normal",
                      paddingTop: 3,
                    },
                  ]}
                >
                  {tab.title}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.tabTextHeader,
                    isActive && styles.tabTextActive,
                    // !showXpBar && styles.tabTextXp,
                  ]}
                >
                  {tab.title}
                </Text>
              )}
              {isActive && page === "home" && (
                <View
                  style={[styles.border_bottom, { backgroundColor: "#FF5757" }]}
                ></View>
              )}
              {isActive && page !== "home" && (
                <View style={styles.border_bottom}></View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }
);

export default DietHeader;

const styles = StyleSheet.create({
  tabsContainer: {
    // flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 0.5,
    gap: 30,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    // backgroundColor: 'green',
  },

  tabItem: {
    // paddingBottom: 8,
    alignItems: "center",
    position: "relative",
  },
  tabItemActive: {
    // borderBottomWidth: 3,
    // borderBottomColor: '#fff',
    // borderTopLeftRadius: 50,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  tabIconContainerActive: {
    // Style for active tab icon if needed
  },
  tabTextHeader: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    paddingBottom: 8,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  tabDescription: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontSize: 15,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#FFFFFF",
  },
  border_bottom: {
    width: "100%",
    height: 3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#fff",
  },
  tabTextXp: {
    color: "#000000",
  },
});
