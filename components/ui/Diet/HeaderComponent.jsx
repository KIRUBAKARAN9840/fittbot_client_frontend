// HeaderComponent.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ImageBackground,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import DietHeader from "./DietHeader";
import XpCard from "../Header/XpCard";
import { useRouter } from "expo-router";

const HeaderComponent = ({
  showHeader,
  headerTranslateY,
  gymName,
  xp,
  tabHeaders,
  activeTabHeader,
  setActiveTabHeader,
  setShowHeader,
  isMenuVisible,
  setIsMenuVisible,
  setShowBadgeSummary,
  menuItems,
  profile,
  width,
  tabScrollViewRef,
}) => {
  if (!showHeader) return null;
  const router = useRouter();
  const topRowOpacity = headerTranslateY.interpolate({
    inputRange: [-20, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const descriptionOpacity = headerTranslateY.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const titleTopPosition = headerTranslateY.interpolate({
    inputRange: [-30, 0],
    outputRange: [-10, 0],
    extrapolate: "clamp",
  });

  const radius = 25;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = 80;
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  const handleTabSelection = (tab) => {
    setActiveTabHeader(tab);
    setShowHeader(true);

    const tabIndex = [
      "+Add",
      // 'Templates',
      "Analysis",
      "Reports",
      // 'View All Foods',
      "Desi Diet",
    ].indexOf(tab);

    const approximateTabWidth = 100;
    const scrollToX = Math.max(
      0,
      tabIndex * approximateTabWidth - width / 2 + approximateTabWidth / 2
    );

    if (tabScrollViewRef.current) {
      tabScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
    }
  };

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: showHeader ? 1 : 0,
          height: showHeader ? "auto" : 0,
        },
      ]}
    >
      <ImageBackground
        source={require("../../../assets/images/diet/Diet_bg.png")}
        style={styles.headerGradient}
        contentFit="cover"
      >
        <View style={styles.headerContent}>
          <Animated.View
            style={[
              styles.topRow,
              //   {
              //     opacity: topRowOpacity,
              //     maxHeight: topRowOpacity.interpolate({
              //       inputRange: [0, 1],
              //       outputRange: [0, 40],
              //     }),
              //   },
            ]}
          >
            {/* <View> */}
            <View style={styles.companyContainer}>
              <Text style={styles.logoText}>
                <Text style={styles.logoFirstPart}>Fitt</Text>
                <Text style={styles.logoSecondPart}>bot</Text>
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "white" }}>{gymName?.length > 20 ? gymName.substring(0, 20) + '...' : gymName}</Text>
              <TouchableOpacity
                style={styles.profileButtonInitial}
                onPress={() => setIsMenuVisible(true)}
              >
                <View style={styles.profileIcon}>
                  <Image
                    // source={profile}
                    source={require("../../../assets/images/header/gym_logo.png")}
                    style={{ width: 30, height: 30, borderRadius: 15 }}
                  />
                </View>
              </TouchableOpacity>
            </View>
            {/* </View> */}
          </Animated.View>

          <Animated.View
            style={[
              styles.tabDescription,
              {
                opacity: descriptionOpacity,
                height: descriptionOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
                marginTop: descriptionOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0],
                }),
              },
            ]}
          >
            <XpCard
              userName="User"
              profileImage="../../../assets/images/header/user_pic.png"
              xp={2560}
              progress={0.75}
              badgeImage="../../../assets/images/header/xp_badge.png"
              color1={"#007BFF"}
              color2={"#28A745"}
              onProfilePress={() => setIsMenuVisible(true)}
              onBadgePress={() => setShowBadgeSummary(true)}
            />
          </Animated.View>

          <DietHeader
            ref={tabScrollViewRef}
            tabHeaders={tabHeaders}
            activeTabHeader={activeTabHeader}
            handleTabSelection={handleTabSelection}
          />
        </View>
      </ImageBackground>

      <Modal
        transparent={true}
        visible={isMenuVisible}
        animationType="slide"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={24} color="#FF5757" />
                <Text style={styles.menuItemText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};

export default HeaderComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  contentContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  headerGradient: {
    paddingTop: 40,
    // paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "column",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  companyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeContainer: {
    alignItems: "flex-end",
    marginRight: 10,
  },
  badgeText: {
    color: "#FFA500",
    fontSize: 14,
    fontWeight: "bold",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  xpText: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    // Style for profile button if needed
  },
  profileIconWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badgeIcon: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeInitial: {
    width: 35,
    height: 35,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 0.5,
    gap: 30,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  tabItem: {
    paddingBottom: 8,
    alignItems: "center",
    position: "relative",
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  tabIconContainer: {
    width: 25,
    height: 25,
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
  profileButtonInitial: {
    marginRight: 10,
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF5757",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 70,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: 250,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
});
