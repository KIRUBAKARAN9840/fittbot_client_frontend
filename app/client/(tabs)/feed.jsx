import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  BackHandler,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import AllFeed from "../../../components/ui/Feed/allfeeds";
import { safeGetAsyncStorage } from "../../../utils/safeHelpers";
import { useUser } from "../../../context/UserContext";
import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import MenuItems from "../../../components/ui/Header/tabs";
import { useNavigation } from "../../../context/NavigationContext";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
import SkeletonFeeds from "../../../components/ui/Feed/skeletonFeed";
import { isFittbotPremium, isOnlyFree } from "../../../config/access";
import PremiumBadge from "../../../components/ui/Payment/premiumbadge";
import JoinGym from "../../../components/ui/Payment/joingym";
import { Ionicons } from "@expo/vector-icons";

const HEADER_MAX_HEIGHT = 245;

const bgColors = {
  "My Feed": {
    color1: "#1DA1F2",
    color2: "#52BAF9",
  },
  "Gym Announcements": {
    color1: "#FF7D51",
    color2: "#FECC87",
  },
  "Gym Offers": {
    color1: "#73C4CB",
    color2: "#30818B",
  },
  "Blocked Users": {
    color1: "#024172",
    color2: "#5C9FC7",
  },
};

const Feed = () => {
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState("");
  const [activeTabHeader, setActiveTabHeader] = useState("");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const { menuItems } = MenuItems({ setIsMenuVisible });
  const { isSideNavVisible, closeSideNav } = useNavigation();
  const { toggleSideNav } = useNavigation();
  const [gender, setGender] = useState("");

  // Use centralized user state
  const {
    xp,
    profile,
    plan,
    progress,
    badge,
    tag,
    gymDetails,
    sideBarData,
    fetchUserData,
    loading: userLoading,
  } = useUser();

  const router = useRouter();

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };
  const {
    panHandlers,
    SwipeIndicator,
    isSwipeActive,
    isEnabled: swipeEnabled,
    swipeAnimatedValue,
    resetSwipe,
    debug,
    temporarilyDisableSwipe,
  } = useEdgeSwipe({
    onSwipeComplete: toggleSideNav,
    isEnabled: true,
    isBlocked: isSideNavVisible,
    config: {
      edgeSwipeThreshold: 30,
      swipeMinDistance: 50,
      swipeMinVelocity: 0.3,
      preventIOSBackSwipe: true,
    },
  });

  const getGymName = async () => {
    try {
      const current_name = await safeGetAsyncStorage("gym_name", "");
      const genderValue = await safeGetAsyncStorage("gender", "");
      setGender(genderValue);
      setGymName(current_name);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching gym name:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getGymName();
  }, []);

  const renderContent = () => {
    return (
      <AllFeed
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        headerHeight={HEADER_MAX_HEIGHT}
        scrollY={scrollY}
      />
    );
  };

  // Fetch user data only when xp is null (first load)
  useEffect(() => {
    if (xp === null && !userLoading) {
      fetchUserData();
    }
  }, [xp, userLoading, fetchUserData]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        closeSideNav();
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
    }, [activeTabHeader])
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        router.push("/client/home");
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const goToGym = () => {
    router.push({
      pathname: "/client/home",
      params: {
        tab: "Gym Studios",
      },
    });
  };

  if (isOnlyFree(plan) || isFittbotPremium(plan)) {
    return (
      <TouchableOpacity style={styles.premiumContainer} onPress={goToGym}>
        <JoinGym size={30} />
        <Text style={styles.premiumSubText}>Join Gym to use this feature</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container} {...panHandlers}>
      {loading || userLoading || !gender ? (
        <SkeletonFeeds type="feeds" priority="high" />
      ) : (
        <>
          <View style={styles.customHeader}>
            <View style={styles.topRow}>
              <View style={styles.companyContainer}>
                <TouchableOpacity onPress={toggleSideNav}>
                  <Ionicons name="menu-outline" size={28} color={"#000"} />
                </TouchableOpacity>
                <Text style={styles.logoText}>
                  <Text style={styles.logoFirstPart}>Fitt</Text>
                  <Text style={styles.logoSecondPart}>bot</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.profileSection}
                onPress={() => {
                  router.push({
                    pathname: "/client/profile",
                    params: {
                      tab: "gym",
                    },
                  });
                }}
              >
                <View style={styles.profileContent}>
                  <Text style={styles.gymNameText}>
                    {gymDetails?.name?.length > 20
                      ? gymDetails?.name.substring(0, 20) + "..."
                      : gymDetails?.name}
                  </Text>
                  <View style={styles.profileIcon}>
                    <Image
                      source={
                        gymDetails?.logo ||
                        require("../../../assets/images/header/gym_logo.png")
                      }
                      style={styles.profileImage}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              userData={sideBarData}
              color1={bgColors[activeTabHeader]?.color1 || "#1DA1F2"}
              color2={bgColors[activeTabHeader]?.color2 || "#52BAF9"}
            />
          )}

          {/* {activeTabHeader === "My Feed" ? ( */}
          {renderContent()}
          {/* ) : (
                        <Animated.ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[
                                styles.scrollViewContent,
                                { paddingTop: HEADER_MAX_HEIGHT }
                            ]}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: false }
                            )}
                            scrollEventThrottle={16}
                        >
                            {renderContent()}
                        </Animated.ScrollView>
                    )} */}

          <BadgeSummaryModal
            visible={showBadgeSummary}
            onClose={() => setShowBadgeSummary(false)}
            userXP={parseInt(xp) || 0}
            currentBadge={""}
            onMoreDetails={handleMoreDetailsClick}
          />

          <BadgeDetailsModal
            visible={showBadgeDetails}
            onClose={() => setShowBadgeDetails(false)}
            currentBadge={""}
            currentLevel={""}
          />

          <SwipeIndicator />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
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
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
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
  premiumContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
    paddingHorizontal: 16,
  },
  premiumText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 10,
    textAlign: "center",
  },
  premiumSubText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 10,
  },
  customHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontSize: 17,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileSection: {
    padding: 4,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gymNameText: {
    color: "#000",
    fontWeight: "500",
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

export default Feed;
