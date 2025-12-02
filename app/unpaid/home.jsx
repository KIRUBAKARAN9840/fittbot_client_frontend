// Home.js
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Platform,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter, useFocusEffect } from "expo-router";
import { getUnsubscribedHomeAPI } from "../../services/clientApi";
import FeaturesComponent from "../../components/ui/Unpaid/features";
import GymStudiosComponent from "../../components/ui/Unpaid/gymsearch";
import ProfileModalComponent from "../../components/ui/Unpaid/profilemodal";
import SubscriptionPlansComponent from "../../components/ui/Unpaid/subscriptionplans";
import MyGymComponent from "../../components/ui/Unpaid/mygym";
import useBackHandler from "../../components/UseBackHandler ";
import { showToast } from "../../utils/Toaster";
import { LinearGradient } from "expo-linear-gradient";

export default function Home() {
  const [activeTab, setActiveTab] = useState("features");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [plansModalVisible, setPlansModalVisible] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const resetAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useBackHandler();

  const getHomeData = async () => {
    setLoading(true);
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
      const response = await getUnsubscribedHomeAPI(client_id);

      if (response?.status === 200) {
        setClientData(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      resetAnimations();
      getHomeData();
      setActiveTab("features");
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (profileModalVisible) {
            setProfileModalVisible(false);
            return true;
          }
          if (plansModalVisible) {
            setPlansModalVisible(false);
            return true;
          }
          return false;
        }
      );

      return () => {
        setIsScreenFocused(false);
        backHandler.remove();
      };
    }, [])
  );

  useEffect(() => {
    resetAnimations();

    return () => {
      setProfileModalVisible(false);
      setPlansModalVisible(false);
    };
  }, []);

  const logOut = async () => {
    try {
      setProfileModalVisible(false);

      setTimeout(async () => {
        await AsyncStorage.removeItem("gym_id");
        await AsyncStorage.removeItem("client_id");
        await AsyncStorage.removeItem("gym_name");
        await AsyncStorage.removeItem("role");
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");

        router.push("/");
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleGymSelection = (gym) => {
    setSelectedGym(gym);
    setPlansModalVisible(true);
  };

  const handleViewPlans = () => {
    router.push("/client/subscription");
  };

  const navigateToProfile = () => {
    setProfileModalVisible(false);
    setTimeout(() => {
      router.push("/unpaid/profile");
    }, 100);
  };

  const navigateToActivate = () => {
    setProfileModalVisible(false);
    setTimeout(() => {
      router.push("/unpaid/activateaccount");
    }, 100);
  };

  const navigateToSubscription = () => {
    setProfileModalVisible(false);
    setTimeout(() => {
      router.push("/client/subscription");
    }, 100);
  };

  const renderContent = () => {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.logoText}>
                <Text style={styles.logoFirstPart}>Fitt</Text>
                <Text style={styles.logoSecondPart}>bot</Text>
              </Text>
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.greeting}>
                Hi, {clientData?.client_name || "User"}
              </Text>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => setProfileModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={30} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Animated.View
          style={[
            styles.mainContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab("features")}
              activeOpacity={0.7}
            >
              {activeTab === "features" ? (
                <LinearGradient
                  colors={["#5B2B9B", "#FF3C7B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Text style={styles.activeTabText}>Fittbot Features</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>Fittbot Features</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() =>
                setActiveTab(clientData?.joined ? "mygym" : "gyms")
              }
              activeOpacity={0.7}
            >
              {activeTab === (clientData?.joined ? "mygym" : "gyms") ? (
                <LinearGradient
                  colors={["#5B2B9B", "#FF3C7B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Text style={styles.activeTabText}>
                    {clientData?.joined ? "My Gym" : "Gym Studios"}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>
                  {clientData?.joined ? "My Gym" : "Gym Studios"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {activeTab === "features" ? (
              <FeaturesComponent
                onViewPlans={handleViewPlans}
                joinedGym={clientData?.joined}
                freeTrail={clientData?.free_trial}
                gym_id={clientData?.gym_id}
                daysLeft={clientData?.days_left}
              />
            ) : activeTab === "mygym" ? (
              <MyGymComponent gymData={clientData} />
            ) : (
              <GymStudiosComponent onSelectGym={handleGymSelection} />
            )}
          </View>
        </Animated.View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      {/* Modals */}
      <ProfileModalComponent
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onNavigateToProfile={navigateToProfile}
        onNavigateToActivate={navigateToActivate}
        onNavigateToSubscription={navigateToSubscription}
        onLogout={logOut}
        onShowGymStudios={() => setActiveTab("gyms")}
        joinedGym={clientData?.joined}
      />

      <SubscriptionPlansComponent
        visible={plansModalVisible}
        onClose={() => setPlansModalVisible(false)}
        selectedGym={selectedGym}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    marginTop: 30,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  profileButton: {
    padding: 8,
    marginLeft: 10,
  },
  mainContainer: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: "hidden",
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    overflow: "hidden", // Important for gradient borders
  },
  activeTabGradient: {
    width: "100%",
    paddingVertical: 15,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "bold",
    color: "#666",
    paddingVertical: 15,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontSize: 17,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
    paddingLeft: 8,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#000",
  },
});
