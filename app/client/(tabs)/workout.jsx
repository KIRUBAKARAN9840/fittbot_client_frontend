import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  BackHandler,
  TouchableWithoutFeedback,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import FeedbackModal from "../../../components/ui/FeedbackModal";
import AddWorkout from "../../../components/ui/Workout/addworkout";
import WorkoutAnalysis from "../../../components/ui/Workout/workoutanalysis";
import WorkoutReports from "../../../components/ui/Workout/workoutreports";
import { useUser } from "../../../context/UserContext";
import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import MenuItems from "../../../components/ui/Header/tabs";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import TransformationPage from "../transformation";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { useNavigation } from "../../../context/NavigationContext";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
import SkeletonWorkout from "../../../components/ui/Workout/skeletonWorkout";
import { isOnlyFree, isPureFreemium } from "../../../config/access";
import PremiumBadge from "../../../components/ui/Payment/premiumbadge";
const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 130;

const tabHeaders = [
  {
    title: "+Add",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/add_workout.png"),
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
  },
  {
    title: "Reports",
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/report.png"),
  },
  {
    title: "Analysis",
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/diet/analysis_icon.png"),
  },
  {
    title: "Transformation",
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/transformation.png"),
  },
];

const Workout = () => {
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState("");
  const { task, workoutTab, showFeedback, tab } = useLocalSearchParams();
  const [activeTabHeader, setActiveTabHeader] = useState("+Add");
  const [headerHeight, setHeaderHeight] = useState(HEADER_MAX_HEIGHT);
  const [showHeader, setShowHeader] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const router = useRouter();

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

  const [gender, setGender] = useState("");
  const getGymName = async () => {
    const current_name = await AsyncStorage.getItem("gym_name");
    setGender(await AsyncStorage.getItem("gender"));
    setGymName(current_name);
    setLoading(false);
  };
  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();

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

  useEffect(() => {
    getGymName();
    // Only set to "+Add" if no tab parameter is provided
    if (!tab) {
      setActiveTabHeader("+Add");
    }
    setHeaderHeight(HEADER_MAX_HEIGHT);
  }, [tab]);

  // Handle feedback modal from params
  useEffect(() => {
    if (showFeedback === "true") {
      // Small delay to ensure smooth navigation
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 500);
    }
  }, [showFeedback]);

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  const { menuItems } = MenuItems({ setIsMenuVisible });

  // Remove local fetchXp - now using centralized fetchUserData

  // Fetch user data only when xp is null (first load)
  useEffect(() => {
    if (xp === null && !userLoading) {
      fetchUserData();
    }
  }, [xp, userLoading, fetchUserData]);

  // Handle tab parameter to auto-switch to Reports tab
  useEffect(() => {
    console.log("Workout page - tab parameter:", tab);
    if (tab === "Reports") {
      console.log("Setting active tab to Reports");
      setActiveTabHeader("Reports");
    } else if (tab === "+Add") {
      console.log("Setting active tab to +Add");
      setActiveTabHeader("+Add");
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        closeSideNav();
      };
    }, [])
  );

  const handleTabChange = (path) => {
    setActiveTabHeader(path);
    temporarilyDisableSwipe();
  };

  useFocusEffect(
    useCallback(() => {
      if (workoutTab) {
        handleTabChange(workoutTab);
      }
    }, [workoutTab])
  );

  const handleSectionChange = (section) => {
    setShowHeader(section === null);
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  // Handle premium check when tab changes
  useEffect(() => {
    if (
      (activeTabHeader === "Analysis" ||
        activeTabHeader === "Reports" ||
        activeTabHeader === "Transformation") &&
      isPureFreemium(plan) &&
      tab !== "Reports"  // Don't override if user specifically navigated to Reports
    ) {
      if (Platform.OS === "ios") {
        setPremiumModalVisible(true);
      } else {
        router.push("/client/subscription");
      }
      setActiveTabHeader("+Add");
    }
  }, [activeTabHeader, plan, tab]);

  const renderContent = () => {
    if (activeTabHeader === "+Add") {
      return (
        <AddWorkout
          gender={gender}
          headerHeight={HEADER_MAX_HEIGHT}
          onSectionChange={handleSectionChange}
          fetchXp={fetchUserData}
        />
      );
    } else if (activeTabHeader === "Analysis") {
      return <WorkoutAnalysis headerHeight={35} gender={gender} />;
    } else if (activeTabHeader === "Reports") {
      return (
        <WorkoutReports
          gender={gender}
          onSectionChange={handleSectionChange}
          headerHeight={HEADER_MAX_HEIGHT}
          profilePic={sideBarData?.profile}
          userName={sideBarData?.userName}
          badge={badge}
          xp={xp}
          plan={plan}
        />
      );
    } else if (activeTabHeader === "Transformation") {
      return <TransformationPage headerHeight={35} gender={gender} />;
    } else {
      return (
        <AddWorkout
          gender={gender}
          headerHeight={HEADER_MAX_HEIGHT}
          onSectionChange={handleSectionChange}
          fetchXp={fetchUserData}
        />
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      setShowHeader(true);
    }, [activeTabHeader])
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (activeTabHeader !== "+Add") {
          setActiveTabHeader("+Add");
          return true;
        } else {
          router.push("/client/home");
          return true;
        }
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [activeTabHeader])
  );

  // useEffect(() => {
  //   if (isOnlyFree(plan) && Platform.OS === "android") {
  //     router.push("/client/subscription");
  //   }
  // }, [plan, router]);

  // Show premium message for iOS free users
  // if (isOnlyFree(plan) && Platform.OS === "ios") {
  //   return (
  //     <View style={styles.premiumContainer}>
  //       <PremiumBadge size={30} />
  //       <Text style={styles.premiumSubText}>
  //         This feature requires a Premium subscription
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container} {...panHandlers}>
      {loading || userLoading ? (
        <SkeletonWorkout header={true} priority="high" />
      ) : (
        <>
          <HeaderComponent
            userName={sideBarData?.userName}
            progress={progress}
            badge={badge}
            tag={tag}
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
            tabIndex={["+Add", "Reports", "Analysis", "Transformation"]}
            color1={"#006dadde"}
            color2={"#006dad48"}
            toggleSideNav={toggleSideNav}
            gymDetails={gymDetails}
            headerName={"Workout"}
            showXpBar={false}
          />

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              userData={sideBarData}
              color2={"#006dadde"}
              color1={"#006dad48"}
            />
          )}

          {activeTabHeader === "+Add" ? (
            <View
              style={[
                styles.contentContainer,
                { paddingTop: showHeader ? headerHeight : 0 },
              ]}
            >
              {renderContent()}
            </View>
          ) : activeTabHeader === "Reports" ||
            activeTabHeader === "Templates" ? (
            renderContent()
          ) : (
            <View
              style={[styles.scrollViewContent, { paddingTop: headerHeight }]}
            >
              {renderContent()}
            </View>
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

          {/* Feedback Modal */}
          <FeedbackModal
            visible={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
          />

          <SwipeIndicator />

          {/* Premium Modal for iOS */}
          <Modal
            visible={premiumModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setPremiumModalVisible(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setPremiumModalVisible(false)}
            >
              <View style={styles.premiumModalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.premiumModalContent}>
                    <PremiumBadge size={30} />
                    <Text style={styles.premiumModalText}>
                      This feature requires a Premium subscription
                    </Text>
                    <TouchableOpacity
                      style={styles.premiumModalButton}
                      onPress={() => setPremiumModalVisible(false)}
                    >
                      <Text style={styles.premiumModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
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
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: width * 0.8,
    maxWidth: 400,
  },
  premiumModalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  premiumModalButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  premiumModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Workout;
