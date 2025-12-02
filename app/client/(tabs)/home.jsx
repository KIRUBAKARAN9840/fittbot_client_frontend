import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import {
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  View,
  PanResponder,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import useBackHandler from "../../../components/UseBackHandler ";
import { registerForPushNotificationsAsync } from "../../../components/usePushNotifications";
import { useNavigation } from "../../../context/NavigationContext";
import { useUser } from "../../../context/UserContext";

// Lazy load heavy components
const ProgressTab = lazy(() =>
  import("../../../components/ui/Home/myprogress")
);
const GymTab = lazy(() => import("../../../components/ui/Home/mygym"));
const Buddy = lazy(() => import("../../../components/ui/Home/buddy"));
const GeneralAnalysis = lazy(() =>
  import("../../../components/ui/Home/generalanalysis")
);
const MyLeaderboard = lazy(() =>
  import("../../../components/ui/Home/myleaderboard")
);
const Rewards = lazy(() => import("../../../components/ui/Home/rewards"));
const WaterTracker = lazy(() =>
  import("../../../components/ui/Home/watertracker")
);
const Reminders = lazy(() => import("../../../components/ui/Home/reminder"));
const GymStudios = lazy(() => import("../../../components/ui/Home/gymstudios"));

import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import MenuItems from "../../../components/ui/Header/tabs";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { showToast } from "../../../utils/Toaster";
import { BackHandler } from "react-native";
import apiConfig from "../../../services/apiConfig";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
import SkeletonHome from "../../../components/ui/Home/skeletonHome";
import { isPureFreemium, isPurePremium } from "../../../config/access";

const { width, height } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 140;
const baseURL = apiConfig.API_URL;

const tabHeaders = [
  {
    title: "My Progress",
    bgColor: "#FFFFFF",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/progress_inactive.png"),
    iconSourceActive: require("../../../assets/images/header-icons/progress_active.png"),
  },
  {
    title: "My Gym",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/mygym_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/mygym_active.png"),
  },
  {
    title: "Gym Studios",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/gymstudios_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/gymstudios_active.png"),
  },
  {
    title: "Gym Buddy",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/buddy_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/buddy_active.png"),
  },
  {
    title: "Water",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/water_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/water_active.png"),
  },
  {
    title: "Reminders",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/reminder_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/reminder_active.png"),
  },
  {
    title: "Analysis",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/analysis_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/analysis_active.png"),
  },
  {
    title: "Leaderboard",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/leaderboard_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/leaderboard_active.png"),
  },
  {
    title: "My Rewards",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/rewards_inactive.png"),
    bgColor: "#FFFFFF",
    iconSourceActive: require("../../../assets/images/header-icons/progress_inactive.png"),
  },
];

const App = () => {
  const { tab, notif_timestamp } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [gymName, setGymName] = useState("");
  const [activeTabHeader, setActiveTabHeader] = useState("My Progress");
  const [headerHeight, setHeaderHeight] = useState(HEADER_MAX_HEIGHT);
  const lastFetchTime = useRef(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds

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

  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [myParams, setMyParams] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState("");
  const router = useRouter();

  const [lastNotifTimestamp, setLastNotifTimestamp] = useState(null);

  const { isSideNavVisible, closeSideNav, toggleSideNav } = useNavigation();

  // Kyra draggable position state with hardcoded max Y
  const calculateKyraY = () => {
    const bottomOffset = Platform.OS === "ios" ? 205 : 140;
    const calculatedY = height - bottomOffset;
    // Limit the maximum Y position to avoid button going too low on tall screens
    const maxY = 600; // Maximum distance from top
    return Math.min(calculatedY, maxY);
  };

  const kyraPosition = useRef(
    new Animated.ValueXY({
      x: width - 85,
      y: calculateKyraY(),
    })
  ).current;

  // PanResponder for Kyra dragging
  const kyraPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only activate if user has moved more than 5 pixels
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        kyraPosition.setOffset({
          x: kyraPosition.x._value,
          y: kyraPosition.y._value,
        });
        kyraPosition.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: kyraPosition.x, dy: kyraPosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        kyraPosition.flattenOffset();

        // Optional: Add boundary constraints
        const maxX = width - 65;
        const maxY = height - 65;
        const minX = 0;
        const minY = 0;

        let finalX = kyraPosition.x._value;
        let finalY = kyraPosition.y._value;

        // Keep within bounds
        if (finalX < minX) finalX = minX;
        if (finalX > maxX) finalX = maxX;
        if (finalY < minY) finalY = minY;
        if (finalY > maxY) finalY = maxY;

        // Animate to bounded position
        Animated.spring(kyraPosition, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (notif_timestamp && notif_timestamp !== lastNotifTimestamp) {
      setLastNotifTimestamp(notif_timestamp);
      scrollY.setValue(0);

      const checkNotificationData = async () => {
        try {
          const storedTab = await AsyncStorage.getItem("notification_tab");
          if (storedTab) {
            handleTabChange(storedTab);
            await AsyncStorage.removeItem("notification_tab");
          }
        } catch (error) {
          console.error("Error reading notification data:", error);
        }
      };

      checkNotificationData();
    }
  }, [notif_timestamp]);

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

  const handleTabChange = (newTab) => {
    setActiveTabHeader(newTab);
    scrollToTab(newTab);
  };

  const scrollToTab = (tabName) => {
    temporarilyDisableSwipe();

    const tabIndex = [
      "My Progress",
      "My Gym",
      "Gym Studios",
      "Gym Buddy",
      "Water",
      "Reminders",
      "Analysis",
      "My Rewards",
      "Leaderboard",
    ].indexOf(tabName);

    if (tabIndex !== -1 && tabScrollViewRef.current) {
      const approximateTabWidth = 100;
      const scrollToX = Math.max(
        0,
        tabIndex * approximateTabWidth - width / 2 + approximateTabWidth / 2
      );
      tabScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
    }
  };

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const getGymName = async () => {
    setLoading(true);
    try {
      const current_name = await AsyncStorage.getItem("gym_name");
      const gender = await AsyncStorage.getItem("gender");
      setGender(gender);
      setGymName(current_name);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  useEffect(() => {
    getGymName();
    if (!tab) {
      setActiveTabHeader("My Progress");
      setHeaderHeight(HEADER_MAX_HEIGHT);
    }
    setActiveTabHeader("My Progress");
  }, []);

  const checkClientStatus = async () => {
    setIsLoading(true);
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      await registerForPushNotificationsAsync(client_id);
    } catch (error) {
      console.log(error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (isSideNavVisible) {
          closeSideNav();
          return true;
        }
        if (activeTabHeader !== "My Progress") {
          setActiveTabHeader("My Progress");
          scrollToTab("My Progress");
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [activeTabHeader, isSideNavVisible])
  );

  const changeTab = (path, params) => {
    setActiveTabHeader(path);
    scrollToTab(path);
    setMyParams(params);
  };

  const onNullTab = () => {
    setMyParams("");
  };

  const xpbarData = React.useMemo(
    () => ({
      userName: sideBarData?.userName,
      xp: xp,
      tag: tag,
      badge: badge,
      progress: progress,
      onBadgePress: () => setShowBadgeSummary(true),
      profile: profile,
    }),
    [sideBarData?.userName, xp, tag, badge, progress, profile]
  );

  // Loading fallback component with tab-specific skeletons
  const LoadingFallback = React.useCallback(() => {
    let skeletonType = "home";

    switch (activeTabHeader) {
      case "My Progress":
        skeletonType = "home";
        break;
      case "My Gym":
        skeletonType = "mygym";
        break;
      case "Gym Studios":
        skeletonType = "studios";
        break;
      case "Gym Buddy":
        skeletonType = "buddy";
        break;
      case "Water":
        skeletonType = "water";
        break;
      case "Reminders":
        skeletonType = "reminders";
        break;
      case "Analysis":
        skeletonType = "analysis";
        break;
      case "Leaderboard":
        skeletonType = "leaderboard";
        break;
      default:
        skeletonType = "home";
    }

    return <SkeletonHome header={false} priority="high" type={skeletonType} />;
  }, [activeTabHeader]);

  const renderContent = React.useCallback(() => {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {activeTabHeader === "My Gym" ? (
          <GymTab scrollY={scrollY} plan={plan} onChangeTab={changeTab} />
        ) : activeTabHeader === "Gym Studios" ? (
          <GymStudios scrollY={scrollY} />
        ) : activeTabHeader === "My Progress" ? (
          <ProgressTab
            onChangeTab={changeTab}
            xpbar={xpbarData}
            plan={plan}
            fetchUserData={fetchUserData}
          />
        ) : activeTabHeader === "Gym Buddy" ? (
          <Buddy scrollY={scrollY} plan={plan} onChangeTab={changeTab} />
        ) : activeTabHeader === "Reminders" ? (
          <Reminders scrollY={scrollY} />
        ) : activeTabHeader === "Analysis" ? (
          <GeneralAnalysis />
        ) : activeTabHeader === "Water" ? (
          <WaterTracker />
        ) : activeTabHeader === "My Rewards" ? (
          <Rewards setActiveTabHeader={setActiveTabHeader} plan={plan} />
        ) : activeTabHeader === "Leaderboard" ? (
          <MyLeaderboard
            tab={myParams}
            onNullTab={onNullTab}
            plan={plan}
            onChangeTab={changeTab}
          />
        ) : (
          <ProgressTab onChangeTab={changeTab} xpbar={xpbarData} plan={plan} />
        )}
      </Suspense>
    );
  }, [activeTabHeader, xpbarData, plan, myParams, scrollY]);

  const goToKyra = () => {
    if (isPurePremium(plan)) {
      router.push({
        pathname: "/client/(workout)/kyraAI",
        params: {
          profileImage: profile,
          userName: sideBarData?.userName,
          source: "default",
        },
      });
    } else if (isPureFreemium(plan)) {
      if (Platform.OS === "ios") {
        return;
      } else {
        router.push("/client/subscription");
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      const checkNotificationData = async () => {
        try {
          const storedTab = await AsyncStorage.getItem("notification_tab");
          if (storedTab) {
            handleTabChange(storedTab);
            await AsyncStorage.removeItem("notification_tab");
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Error reading notification data",
          });
        }
      };

      checkNotificationData();
    }, [activeTabHeader])
  );

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchTime.current > FETCH_COOLDOWN) {
        checkClientStatus();
        fetchUserData();
        lastFetchTime.current = now;
      }
      return () => {
        closeSideNav();
      };
    }, [])
  );

  // Fetch user data only when xp is null or undefined (first load)
  useEffect(() => {
    if (xp === null && !userLoading) {
      fetchUserData();
    }
  }, [xp, userLoading, fetchUserData]);

  useFocusEffect(
    useCallback(() => {
      if (tab) {
        handleTabChange(tab);
      }
    }, [tab])
  );

  return (
    <View style={styles.container} {...panHandlers}>
      {isLoading || !gender ? (
        <SkeletonHome type="home" />
      ) : (
        <>
          {loading || userLoading ? (
            <SkeletonHome type="home" />
          ) : (
            <>
              {activeTabHeader === "My Rewards" ? (
                ""
              ) : (
                <HeaderComponent
                  userName={sideBarData?.userName}
                  progress={progress}
                  tag={tag}
                  badge={badge}
                  showHeader={true}
                  headerTranslateY={new Animated.Value(0)}
                  gymName={gymName}
                  xp={xp}
                  tabHeaders={tabHeaders}
                  activeTabHeader={activeTabHeader}
                  setActiveTabHeader={setActiveTabHeader}
                  setShowHeader={() => {}}
                  isMenuVisible={isMenuVisible}
                  setIsMenuVisible={setIsMenuVisible}
                  setShowBadgeSummary={setShowBadgeSummary}
                  menuItems={menuItems}
                  profile={profile}
                  width={width}
                  tabScrollViewRef={tabScrollViewRef}
                  tabIndex={[
                    "My Progress",
                    "My Gym",
                    "Gym Studios",
                    "Gym Buddy",
                    "Water",
                    "Reminders",
                    "Analysis",
                    "Leaderboard",
                    "My Rewards",
                  ]}
                  color1="#FFFFFF"
                  color2="#FFFFFF"
                  toggleSideNav={toggleSideNav}
                  gymDetails={gymDetails}
                  showXpBar={false}
                  page="home"
                />
              )}

              {isSideNavVisible && (
                <SideNavigation
                  isVisible={isSideNavVisible}
                  onClose={closeSideNav}
                  userData={sideBarData}
                />
              )}

              {activeTabHeader === "Gym Buddy" ||
              activeTabHeader === "My Gym" ||
              activeTabHeader === "Reminders" ||
              activeTabHeader === "Gym Studios" ? (
                renderContent()
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.scrollViewContent,
                    {
                      paddingTop:
                        activeTabHeader === "My Rewards" ? 0 : headerHeight,
                    },
                  ]}
                >
                  {renderContent()}
                </ScrollView>
              )}

              {/* Floating Kyra Image - only show on My Progress tab */}
              {activeTabHeader === "My Progress" && (
                <Animated.View
                  {...kyraPanResponder.panHandlers}
                  style={[
                    styles.floatingKyra,
                    {
                      transform: [
                        { translateX: kyraPosition.x },
                        { translateY: kyraPosition.y },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={goToKyra}
                    activeOpacity={0.7}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Image
                      source={require("../../../assets/images/kyra_float_home.png")}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    marginBottom: Platform.OS === "ios" ? 60 : 0,
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
    color: "#bbbbbb",
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
    backgroundColor: "#000",
    paddingHorizontal: 6,
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
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6c63ff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999, // Ensure it stays on top of other content
  },
  // New styles for swipe functionality
  swipeIndicatorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    backgroundColor: "#007AFF",
    zIndex: 1000,
  },
  floatingKyra: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 65,
    height: 65,
    zIndex: 999,
  },
});

export default App;
