import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import * as SecureStore from "expo-secure-store";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clientProgressAPI,
  getWelcomeDataAPI,
  freeTrialAPI,
  getSmartWatchInterestAPI,
} from "../../../services/clientApi";
import {
  safeGetAsyncStorage,
  safeParseInt,
  safeParseJSON,
} from "../../../utils/safeHelpers";
import { useRouter } from "expo-router";
import HomeWaterTrackerCard from "./wateradd";
import Carousel from "./progesspage/carousel";
import Footer from "./progesspage/footer";
import TopPerformers from "./progesspage/leaderboard";
import GiftBar from "./progesspage/progressbar";
import WorkoutStreak from "./progesspage/streak";
import WorkoutSummaryCard from "./progesspage/workoutstats";
import FitnessInfoCards from "./progesspage/gymcards";
import HealthDashboard from "./progesspage/healthdashboard";
import CalorieCardsComponent from "./progesspage/calculatecalories";
import DietProgressTracker from "./progesspage/dietprogress";
import HomeBMICard from "./progesspage/bmicard";
import WeightProgressCard from "./progesspage/weightprogress";
import { showToast } from "../../../utils/Toaster";
import useBackHandler from "../../UseBackHandler ";
import useHomeBackHandler from "../../useHomeBackHandler";
import { WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";
import ScanCard from "./progesspage/scancard";
import XpCard from "../Header/XpCard";
import SkeletonHome from "./skeletonHome";
import {
  isFittbotPremium,
  isGymPremium,
  isPureFreemium,
} from "../../../config/access";
import ScrollableChatModal from "../../../components/ui/Home/kyraAIwelcomemodal";
import GrainConfettiAnimation from "../ConfettiAnimation";
import { Feather } from "@expo/vector-icons";
import ForceUpdateModal from "../../ForceUpdateModal";
import { useForceUpdate } from "../../../hooks/useForceUpdate";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const isTablet = () => {
  const aspectRatio = height / width;
  return width >= 768 || (width >= 600 && aspectRatio < 1.6);
};

export default function Progress(props) {
  const [gymId, setGymId] = React.useState(null);
  React.useEffect(() => {
    safeGetAsyncStorage("gym_id", null)
      .then((id) => setGymId(safeParseInt(id, null)))
      .catch((error) => {
        console.error("Error getting gym_id:", error);
        setGymId(null);
      });
  }, []);
  if (isPureFreemium(props.plan) || isFittbotPremium(props.plan)) {
    return <ProgressTab {...props} hasWebSocket={false} />;
  }
  // if (!gymId) return <ProgressTab {...props} hasWebSocket={false} />;
  const url1 = "websocket_live";
  const url2 = "live";
  return (
    <WebSocketProvider gymId={gymId} url1={url1} url2={url2}>
      <ProgressTab {...props} hasWebSocket={true} />
    </WebSocketProvider>
  );
}

const ProgressTab = ({
  onChangeTab,
  xpbar,
  plan,
  hasWebSocket = true,
  fetchUserData,
}) => {
  const {
    visible: showUpdateModal,
    info: updateInfo,
    handleUpdate,
  } = useForceUpdate();
  const insets = useSafeAreaInsets();
  const [weightProgress, setWeightProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [generalData, setGeneralData] = useState(null);
  const [targets, setTargets] = useState(null);
  const [gender, setGender] = useState(null);
  const [difference, setdifference] = useState(0);
  const [goal, setGoal] = useState(null);
  const [liveCount, setLiveCount] = useState(null);
  const [liveDes, setLiveDes] = useState(null);
  const [totalMem, setTotalMem] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-100)).current;
  const shimmerAnimRef = useRef(null);
  const [showScrollableModal, setShowScrollableModal] = useState(false);
  const [characterUrl, setCharacterUrl] = useState(null);
  const [welcomeResponse, setWelcomeResponse] = useState(null);
  const [oneTimeScan, setOneTimeScan] = useState(false);
  const [freeTrial, setFreeTrial] = useState(false);
  const [freeTrialActive, setFreeTrialActive] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isClaimingTrial, setIsClaimingTrial] = useState(false);
  const [showContestModal, setShowContestModal] = useState(false);
  const [showSuccessGrains, setShowSuccessGrains] = useState(false);
  const successModalTimerRef = useRef(null);
  const refreshDataTimerRef = useRef(null);
  const modalContent = ` Welcome to Fittbot

I know exactly what you're aiming for — and guess what? I've got your perfect diet & workout tips ready based on your goals and body metrics.

Diet Tips:
Eat every 3-4 hours to keep calories consistent. You'll love this UB & rest follows to add calories without stuffing yourself.

Drink smoothies, especially after heavy lifting more food.

Mini-frequent: If you're not gaining ~0.5-1.5 lbs per week, up your calories by ~100-150.

Workout Tips:
Train progressive overload → aim to increase weight or reps. Expect 1-3 mins for big lifts (squats, bench, deadlift), 60-90 secs for smaller muscles.

Good form over everything: focus on heavy lifts, not cardio.

Get at least 7-8 hours sleep to maximize gains as much as food & lifting!

PS, are you ready to start your journey with your perfect plan?`;

  const deviceIsTablet = isTablet();

  const statsAnimations = useRef(
    Array(3)
      .fill(0)
      .map(() => new Animated.Value(50))
  ).current;

  const actionAnimations = useRef(
    Array(3)
      .fill(0)
      .map(() => new Animated.Value(50))
  ).current;

  const [dietStats, setDietStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [boxValues, setBoxValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posters, setPosters] = useState(null);

  const router = useRouter();

  if (hasWebSocket) {
    useFeedSocket(async (message) => {
      if (
        message.action === "get_initial_data" ||
        message.action === "update_live_count"
      ) {
        if (message.live_count !== undefined) {
          setLiveCount(message.live_count);
          setLiveDes(message.live_count);
        } else {
          setLiveCount(0);
        }
      }
    });
  }

  useEffect(() => {
    const mainAnimations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: clientInfo.progress,
        duration: 1500,
        useNativeDriver: false,
      }),
    ];

    const statsAnims = statsAnimations.map((anim) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    );

    const actionAnims = actionAnimations.map((anim) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      ...mainAnimations,
      ...statsAnims,
      ...actionAnims,
    ]).start();

    // Start shimmer animation only once
    if (!shimmerAnimRef.current) {
      shimmerAnimRef.current = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: width,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      shimmerAnimRef.current.start();
    }

    return () => {
      // Cleanup shimmer animation
      if (shimmerAnimRef.current) {
        shimmerAnimRef.current.stop();
        shimmerAnimRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getHomeData();
    }, [])
  );

  useBackHandler();

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (successModalTimerRef.current) {
        clearTimeout(successModalTimerRef.current);
        successModalTimerRef.current = null;
      }
      if (refreshDataTimerRef.current) {
        clearTimeout(refreshDataTimerRef.current);
        refreshDataTimerRef.current = null;
      }
    };
  }, []);

  const clientInfo = {
    name: boxValues?.name,
    profileImage: boxValues?.profile,
    progress: 0.75,
  };

  const handleClaimFreeTrialIOS = async () => {
    setShowConfirmationModal(false);

    try {
      const clientId = await safeGetAsyncStorage("client_id", null);
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Client ID not found",
        });
        return;
      }
      const payload = { client_id: clientId };

      const response = await freeTrialAPI(payload);

      if (response?.status === 200) {
        setFreeTrial(false);
        showToast({
          type: "success",
          title: "Success",
          desc: "Your 7-day free trial has been activated! Enjoy premium features.",
        });
        fetchUserData();
        getHomeData();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to activate free trial",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const handleClaimFreeTrialAndroid = async () => {
    setShowConfirmationModal(false);
    setIsClaimingTrial(true);

    if (successModalTimerRef.current) {
      clearTimeout(successModalTimerRef.current);
    }
    if (refreshDataTimerRef.current) {
      clearTimeout(refreshDataTimerRef.current);
    }

    try {
      const clientId = await safeGetAsyncStorage("client_id", null);
      if (!clientId) {
        setIsClaimingTrial(false);
        showToast({
          type: "error",
          title: "Error",
          desc: "Client ID not found",
        });
        return;
      }
      const payload = { client_id: clientId };

      const response = await freeTrialAPI(payload);

      if (response?.status === 200) {
        setIsClaimingTrial(false);
        setFreeTrial(false);
        setShowSuccessModal(true);

        successModalTimerRef.current = setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);

        refreshDataTimerRef.current = setTimeout(() => {
          fetchUserData();
          getHomeData();
        }, 3500);
      } else {
        setIsClaimingTrial(false);
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to activate free trial",
        });
      }
    } catch (error) {
      setIsClaimingTrial(false);

      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const getInterest = async () => {
    setLoading(true);
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const payload = {
        client_id: client_id,
      };
      const response = await getSmartWatchInterestAPI(payload);
      console.log(response);
      if (response?.status === 200) {
        if (Platform.OS === "android") {
          setShowSuccessGrains(true);

          successModalTimerRef.current = setTimeout(() => {
            setShowSuccessGrains(false);
            setShowContestModal(false);
          }, 3000);
        } else {
          showToast({
            type: "success",
            title: "Success",
            desc: "You Will be Notified Soon",
          });
        }

        getHomeData();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
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
      setShowContestModal(false);
    }
  };

  const getHomeData = async () => {
    // const oldToken = await SecureStore.getItemAsync("expoPushToken");
    // console.log("Old Expo Push Token:", oldToken);
    setLoading(true);
    try {
      const gymId = await safeGetAsyncStorage("gym_id", null);
      const clientId = await safeGetAsyncStorage("client_id", null);
      const gender = await safeGetAsyncStorage("gender", null);

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        setLoading(false);
        return;
      }
      const payload = {
        gym_id: gymId ? gymId : null,
        client_id: clientId,
      };

      const response = await clientProgressAPI(payload);

      if (response?.status === 200) {
        setShowScrollableModal(!response?.data?.modal_shown);
        setShowContestModal(response?.data?.reward_interest_modal || false);
        setCharacterUrl(response?.data?.url);
        setGender(gender);
        setdifference(Math.abs(response?.data?.difference));
        setGoal(response?.data?.goals);
        setWeightProgress(response?.data?.weight_progress);
        setPosters(response?.data?.posters);
        setTotalMem(response?.data?.gym_count);
        setLeaderboard(response?.data?.leaderboard);
        setBmi(response?.data?.bmi);
        setDietStats(response?.data?.diet_progress);
        setTargets({
          calories: response?.data?.diet_progress?.calories?.target || "",
          protein: response?.data?.diet_progress?.protein?.target || "",
          carbs: response?.data?.diet_progress?.carbs?.target || "",
          fat: response?.data?.diet_progress?.fat?.target || "",
          sugar: response?.data?.diet_progress?.sugar?.target || "",
          fiber: response?.data?.diet_progress?.fiber?.target || "",
        });
        setRewardInfo(response?.data?.reward_info);
        setWorkoutData(response?.data?.workout_data);
        setGeneralData(response?.data?.general_data);
        setOneTimeScan(response?.data?.food_scan || false);
        setFreeTrial(response?.data?.free_trial);
        setFreeTrialActive(response?.data?.free_trial_active || false);
        setRemainingDays(response?.data?.remaining_days || 0);

        if (!response?.data?.modal_shown) {
          try {
            const res = await getWelcomeDataAPI(clientId);

            if (res?.status === 200) {
              setWelcomeResponse(res?.data);
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc:
                  response?.detail ||
                  "Something went wrong. Please try again later",
              });
            }
          } catch (err) {
            console.log(err);
            showToast({
              type: "error",
              title: "Error",
              desc: "Something went wrong. Please try again later",
            });
          }
        }
        try {
          let healthDashboardData;
          const defaultData = {
            weight: [],
            calories: [],
            calories_burnt: [],
            protein: [],
            fat: [],
            carbs: [],
            fiber: [],
            sugar: [],
            water_intake: [],
          };

          if (typeof response?.data?.health_dashboard === "string") {
            // If it's a string, parse it safely
            healthDashboardData = safeParseJSON(
              response.data.health_dashboard,
              defaultData
            );
          } else if (
            typeof response?.data?.health_dashboard === "object" &&
            response?.data?.health_dashboard !== null
          ) {
            // If it's already an object, use it directly
            healthDashboardData = response.data.health_dashboard;
          } else {
            // If it's null, undefined, or other type, use default
            healthDashboardData = defaultData;
          }

          setChartData(healthDashboardData);
        } catch (parseError) {
          console.error("Error parsing health dashboard data:", parseError);
          setChartData({
            weight: [],
            calories: [],
            calories_burnt: [],
            protein: [],
            fat: [],
            carbs: [],
            fiber: [],
            sugar: [],
            water_intake: [],
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      console.log(error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonHome type="home" header={false} />;
  }

  return (
    <>
      <ForceUpdateModal
        visible={showUpdateModal}
        info={updateInfo}
        onUpdate={handleUpdate}
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* <XpCard
        userName={xpbar?.userName}
        profileImage={xpbar?.profile}
        xp={xpbar?.xp}
        quote={xpbar?.tag}
        progress={xpbar?.progress}
        badgeImage={xpbar?.badge}
        onBadgePress={xpbar?.onBadgePress}
      /> */}

        {freeTrial && !freeTrialActive && (
          <View style={styles.freeTrialContainer}>
            <View style={styles.freeTrialCard}>
              <View style={styles.freeTrialContent}>
                <View style={styles.freeTrialTextContainer}>
                  <Text style={styles.freeTrialTitle}>
                    💪 7-Day Free Trial Access
                  </Text>
                  <Text style={styles.freeTrialSubtitle}>
                    Explore our best features before choosing your plan.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => setShowConfirmationModal(true)}
                >
                  <Text style={styles.claimButtonText}>Claim Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {freeTrialActive && (
          <View style={styles.freeTrialContainer}>
            <View style={styles.activeTrialCard}>
              <View style={styles.bannerContainer}>
                <Image
                  source={require("../../../assets/images/free_trial.png")}
                  style={styles.freeTrialBanner}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.activeTrialRow}>
                <View style={styles.activeTrialMiddleContent}>
                  <View style={styles.activeTrialTitleRow}>
                    <Text style={styles.activeTrialEmoji}>💪</Text>
                    <Text style={styles.activeTrialTitle}>
                      Your 7-Day Free Trial is Active !
                    </Text>
                  </View>

                  <Text style={styles.activeTrialSubtitle}>
                    Enjoy premium access still free for {remainingDays} days
                  </Text>
                </View>
                {Platform.OS === "ios" ? null : (
                  <TouchableOpacity
                    style={styles.buyPremiumButtonNew}
                    onPress={() => {
                      router.push("/client/subscription");
                    }}
                  >
                    <Text style={styles.buyPremiumButtonTextNew}>
                      Buy Premium
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.contestBanner}
          onPress={() => onChangeTab("My Rewards")}
          activeOpacity={0.8}
        >
          <Image
            source={require("../../../assets/images/contest/watch_home.png")}
            style={styles.contestBannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <WeightProgressCard
            targetWeight={weightProgress?.target_weight || 0}
            currentWeight={weightProgress?.actual_weight || 0}
            initialWeight={weightProgress?.start_weight || 0}
            progress={weightProgress?.progress || 0}
            getHomeData={getHomeData}
            gender={gender || "male"}
            goal={goal}
            difference={difference}
            characterUrl={characterUrl}
            plan={plan}
          />
        </View>

        <View style={{ flex: 1 }}>
          <ScanCard
            targetWeight={weightProgress?.target_weight || 0}
            currentWeight={weightProgress?.actual_weight || 0}
            initialWeight={weightProgress?.start_weight || 0}
            progress={weightProgress?.progress || 0}
            getHomeData={getHomeData}
            gender={gender || "male"}
            goal={goal}
            difference={difference}
            plan={plan}
            oneTimeScan={oneTimeScan}
          />
        </View>

        <View style={{ flex: 1 }}>
          <FitnessInfoCards
            liveValue
            totalValue={totalMem || 0}
            gender={gender || "male"}
            onChangeTab={onChangeTab}
            liveCount={liveCount}
            liveDes={liveDes}
            plan={plan}
            bmi={bmi}
          />
        </View>

        {/* <View style={styles.cardRow}>
        <View style={styles.cardContainer}>
          <HomeBMICard bmi={bmi} />
        </View>

        <View style={styles.cardContainer}>
          <HomeWaterTrackerCard onChangeTab={onChangeTab} />
        </View>
      </View> */}

        <View style={{ flex: 1 }}>
          <WorkoutSummaryCard
            duration={workoutData?.total_time}
            calories={workoutData?.total_calories}
            points={workoutData?.total_volume}
            onStartPress={() => console.log("Start pressed")}
            onKnowMorePress={() =>
              router.push({
                pathname: "/client/workout",
                params: "Reports",
              })
            }
            gender={gender || "male"}
            plan={plan}
          />
        </View>

        {/* <View style={{ flex: 1 }}>
        <WorkoutStreak
          workoutData={workoutData?.attendance}
          plan={plan}
          onChangeTab={onChangeTab}
        />
      </View> */}

        {posters ? (
          <View
            style={{ height: deviceIsTablet ? 260 : 220, marginVertical: 0 }}
          >
            <Carousel
              data={posters}
              onChangeTab={onChangeTab}
              gender={gender}
            />
          </View>
        ) : (
          ""
        )}

        <DietProgressTracker
          calories={dietStats?.calories}
          protein={dietStats?.protein}
          carbs={dietStats?.carbs}
          fat={dietStats?.fat}
          sugar={dietStats?.sugar || 0}
          fiber={dietStats?.fiber || 0}
          calcium={dietStats?.calcium?.actual || 0}
          magnesium={dietStats?.magnesium?.actual || 0}
          sodium={dietStats?.sodium?.actual || 0}
          potassium={dietStats?.potassium?.actual || 0}
          iron={dietStats?.iron?.actual || 0}
          plan={plan}
        />

        <View style={{ flex: 1 }}>
          <CalorieCardsComponent
            calculate={generalData}
            target={targets}
            getHomeData={getHomeData}
            gender={gender || "male"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <GiftBar
            progress={
              rewardInfo?.client_xp && rewardInfo?.next_reward
                ? rewardInfo?.client_xp / rewardInfo?.next_reward
                : 0
            }
            message={rewardInfo?.message}
            title="Gift Bar"
            showAnimation={false}
            plan={plan}
            onChangeTab={onChangeTab}
          />
        </View>
        {/* {isGymPremium(plan) && (
        <View style={{ flex: 1 }}>
          <TopPerformers
            performers={leaderboard?.top_performers}
            onChangeTab={onChangeTab}
            plan={plan}
          />
        </View>
      )} */}

        <View style={{ flex: 1 }}>
          <HealthDashboard
            onButtonPress={() => {
              router.push({
                pathname: "/client/allcharts",
                params: { chartDatas: JSON.stringify(chartData) },
              });
            }}
            onChangeTab={onChangeTab}
            plan={plan}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Footer />
        </View>

        <ScrollableChatModal
          visible={showScrollableModal}
          onClose={() => {
            setShowScrollableModal(false);
          }}
          title="KyraAI"
          subtitle="I am KyraAI. Your personal AI fitness companion"
          content={modalContent}
          profileInitials="KA"
          profileImage={require("../../../assets/images/kyra_welcome.png")}
          userName={xpbar?.userName}
          data={welcomeResponse}
        />

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmationModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmationModal}>
              <View style={styles.confirmationIconContainer}>
                <Feather name="alert-circle" size={50} color="#FF5757" />
              </View>
              <Text style={styles.confirmationTitle}>Confirm Free Trial</Text>
              <Text style={styles.confirmationMessage}>
                Are you sure you want to activate your 7-day free trial? This
                will give you access to all premium features.
              </Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={
                    Platform.OS === "ios"
                      ? handleClaimFreeTrialIOS
                      : handleClaimFreeTrialAndroid
                  }
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {showSuccessGrains && Platform.OS === "android" && (
          <GrainConfettiAnimation numberOfGrains={100} xpPoints={0} />
        )}

        {showSuccessModal && Platform.OS === "android" && (
          <GrainConfettiAnimation numberOfGrains={100} xpPoints={0} />
        )}

        <Modal
          visible={Platform.OS === "android" && showSuccessGrains}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessGrains(false)}
        >
          <TouchableOpacity
            style={[
              styles.modalOverlay,
              { backgroundColor: "rgba(0, 0, 0, 0.1)" },
            ]}
            activeOpacity={1}
            onPress={() => setShowSuccessGrains(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.successModal}>
                <View style={styles.successIconContainer}>
                  <Feather name="check-circle" size={60} color="#FF5757" />
                </View>
                <Text style={styles.successTitle}>Congratulations!</Text>
                <Text style={styles.successMessage}>
                  Thank You for Showing Interest.
                </Text>
                <Text style={styles.successSubMessage}>
                  You will be Notified soon
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Success Modal with Confetti */}
        <Modal
          visible={Platform.OS === "android" && showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <TouchableOpacity
            style={[
              styles.modalOverlay,
              { backgroundColor: "rgba(0, 0, 0, 0.1)" },
            ]}
            activeOpacity={1}
            onPress={() => setShowSuccessModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.successModal}>
                <View style={styles.successIconContainer}>
                  <Feather name="check-circle" size={60} color="#FF5757" />
                </View>
                <Text style={styles.successTitle}>Congratulations!</Text>
                <Text style={styles.successMessage}>
                  Your Free Trial is Active
                </Text>
                <Text style={styles.successSubMessage}>
                  Enjoy 7 days of premium features
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Loading Modal */}
        <Modal visible={isClaimingTrial} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.loadingModal}>
              <Animated.View
                style={[
                  styles.loadingSpinner,
                  {
                    transform: [
                      {
                        rotate: shimmerAnim.interpolate({
                          inputRange: [0, 360],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Feather name="loader" size={40} color="#FF5757" />
              </Animated.View>
              <Text style={styles.loadingText}>
                Activating your free trial...
              </Text>
            </View>
          </View>
        </Modal>

        {/* Contest Modal */}
        <Modal
          visible={showContestModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowContestModal(false)}
        >
          <View style={styles.contestModalOverlay}>
            <View
              style={[
                styles.contestModalContent,
                { paddingBottom: insets.bottom },
              ]}
            >
              <View style={styles.contestModalHeader}>
                <Text style={styles.contestModalTitle}>Fittbot Rewards</Text>
                <TouchableOpacity
                  style={styles.contestCloseButton}
                  onPress={() => setShowContestModal(false)}
                >
                  <View style={styles.contestCloseIconContainer}>
                    <Feather name="x" size={20} color="#333" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 0 }}>
                <Image
                  source={require("../../../assets/images/contest/girl.png")}
                  style={styles.contestGirlImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.contestModalTextContainer}>
                <TouchableOpacity
                  style={styles.contestInterestedButton}
                  onPress={getInterest}
                >
                  <Text style={styles.contestInterestedButtonText}>
                    I'm Interested
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    marginTop: 30,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginTop: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  profileInfo: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  weightCard: {
    margin: 20,
    marginTop: 6,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  weightGradient: {
    borderRadius: 20,
    padding: 20,
  },
  weightContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weightInfo: {
    flex: 1,
  },
  weightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  weightSubtitle: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
  },
  weightNumbers: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  currentWeight: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  weightDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#111",
    marginHorizontal: 10,
  },
  targetWeight: {
    fontSize: 14,
    color: "#111",
  },
  progressCircle: {
    marginLeft: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF5757",
  },
  statsSection: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitleStatistics: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  statsContainer: {
    paddingHorizontal: 15,
  },
  statsCard: {
    width: width * 0.28,
    marginHorizontal: 5,
    marginVertical: 5,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statsGradient: {
    borderRadius: 15,
    padding: 15,
    height: 110,
    alignItems: "center",
    justifyContent: "space-between",
  },
  gif: {
    height: 30,
  },
  statsContent: {
    alignItems: "center",
  },
  statsTitle: {
    color: "#111",
    fontSize: 11,
  },
  statsValue: {
    color: "#000",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 5,
  },
  quickActions: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  actionButton: {
    width: width * 0.28,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionGradient: {
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FF5757",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  viewChartsContainer: {
    margin: 20,
    marginTop: 10,
  },
  viewChartsButton: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewChartsGradient: {
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewChartsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  dietSection: {
    marginTop: 4,
    paddingVertical: 15,
  },
  dietCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  dietCard: {
    width: width * 0.44,
    marginBottom: 12,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dietGradient: {
    borderRadius: 15,
    padding: 15,
  },
  dietHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dietLabel: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  dietPercentage: {
    color: "#ff5757",
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 8,
  },
  dietValues: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currentValue: {
    color: "#ff5757",
    fontSize: 18,
    fontWeight: "bold",
  },
  targetValue: {
    color: "#111",
    fontSize: 14,
    marginLeft: 4,
  },
  targetDietHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    flexDirection: "row",
  },
  targetDietEditButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5757",
  },
  modalBody: {
    padding: 20,
  },
  feeCard: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeDetails: {
    flex: 1,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 5,
  },
  feeDate: {
    fontSize: 14,
    color: "#666",
  },
  receiptIcon: {
    marginLeft: 15,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
  },
  muscleGroups: {
    color: "#666",
    fontSize: 14,
    marginVertical: 5,
  },
  setInfo: {
    color: "#333",
    fontSize: 14,
    marginTop: 3,
  },
  variantContainer: {
    marginBottom: 20,
  },
  variantTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  mealContainer: {
    marginBottom: 15,
  },
  mealTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  nutritionInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  nutritionItem: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
    marginTop: 5,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noFeedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 6,
    zIndex: 1,
  },
  modalTitleWeight: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  inputLabelNew: {
    fontSize: 12,
    color: "#cdcdcd",
    marginVertical: 7,
  },
  inputLabelStart: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
  },
  picker: {
    height: 50,
  },
  targetDietModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  targetDietModalContent: {
    width: width * 0.85,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  targetDietModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  targetDietModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
  },
  targetDietCloseButton: {
    padding: 5,
  },
  targetDietCloseButtonText: {
    fontSize: 22,
    color: "#999",
  },
  targetDietInputContainer: {
    marginBottom: 15,
  },
  targetDietInputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  targetDietInput: {
    height: 45,
  },
  targetDietSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noteContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,

    margin: 10,
  },
  noteText: {
    fontSize: 11,
    color: "#333",
    lineHeight: 20,
  },
  buttonDisabled: {
    backgroundColor: "#FF5757",
    borderRadius: 12,
    height: 50,
    opacity: 0.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  cardRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 8,
  },
  cardContainer: {
    width: "50%",
  },
  freeTrialContainer: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  freeTrialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  freeTrialContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  freeTrialTextContainer: {
    flex: 1,
    paddingRight: 2,
  },
  freeTrialTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  freeTrialSubtitle: {
    fontSize: 10,
    color: "#666",
  },
  claimButton: {
    backgroundColor: "rgba(255,87,87,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF5757",
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF5757",
  },
  activeTrialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 4,
    position: "relative",
    minHeight: 50,
  },
  activeTrialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: "13%",
  },
  bannerContainer: {
    position: "absolute",
    left: 4,
    top: 0,
    alignItems: "center",
  },
  freeTrialBanner: {
    width: 32,
    height: 47,
  },
  activeTrialMiddleContent: {
    width: "65%",
    justifyContent: "center",
    paddingRight: 0,
  },
  activeTrialTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeTrialEmoji: {
    fontSize: 12,
    marginRight: 1,
  },
  activeTrialTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#303030",
  },
  activeTrialSubtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
  },
  buyPremiumButtonNew: {
    width: "28%",
    backgroundColor: "rgba(255,87,87,0.05)",
    borderRadius: 8,
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginRight: 4,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF5757",
  },
  buyPremiumButtonTextNew: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF5757",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModal: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    width: "85%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmationIconContainer: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmationMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#FF5757",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  successModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    width: "85%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF5757",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  loadingModal: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  floatingKyra: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 80,
    height: 80,
    zIndex: 999,
  },
  contestBanner: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: -15,
  },
  contestBannerImage: {
    width: "100%",
    height: width * 0.4,
  },
  contestModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  contestModalContent: {
    width: "100%",
    backgroundColor: "#FF5757",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  contestModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#FF5757",
  },
  contestCloseButton: {
    zIndex: 10,
  },
  contestCloseIconContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  contestGirlImage: {
    width: "100%",
    height: height * 0.5,
  },
  contestModalTextContainer: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  contestModalTitle: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 0,
  },
  contestModalDescription: {
    fontSize: width > 400 ? 14 : 12,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: width > 400 ? 20 : 18,
    marginBottom: 12,
  },
  contestModalDate: {
    fontSize: width > 400 ? 14 : 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  contestInterestedButton: {
    // backgroundColor: "#FFFFFF",
    paddingVertical: width > 400 ? 14 : 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "70%",
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderWidth: 1,
  },
  contestInterestedButtonText: {
    color: "#FFFFFF",
    fontSize: width > 400 ? 16 : 14,
    fontWeight: "700",
  },
});
