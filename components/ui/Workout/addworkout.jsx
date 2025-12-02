import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ImageBackground,
  Modal,
  ActivityIndicator,
  AppState,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { toIndianISOString } from "../../../utils/basicUtilFunctions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFittbotWorkoutAPI,
  getInStatusAPI,
  getWorkoutTemplateClientAPI,
  QRAPI,
  addPunchInAPI,
  addPunchOutAPI,
  getPunchedInDetailsAPI,
  getDefaultWorkoutAPI,
} from "../../../services/clientApi";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import QRCodeScanner from "../qrcode";

import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
} from "expo-location";
import { ScrollView } from "react-native";
import WorkoutCompletionModal from "./workoutcompletionmodal";
import WorkoutCard from "./WorkoutCard";
import WorkoutSelectionModal from "./WorkoutSelectionModal";
import * as FileSystem from "expo-file-system/legacy";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { showToast } from "../../../utils/Toaster";
import ConfettiAnimation from "../ConfettiAnimation";
import KyraAIFloatingButton from "./kyraAI";
import SkeletonWorkout from "./skeletonWorkout";
import {
  isFittbotPremium,
  isOnlyFree,
  isPureFreemium,
  isPurePremium,
} from "../../../config/access";
import { useUser } from "../../../context/UserContext";
import PremiumBadge from "../Payment/premiumbadge";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const muscleGroups = [
  "Chest",
  "Shoulder",
  "Leg",
  "Back",
  "ABS",
  "Biceps",
  "Cardio",
  "Core",
  "Cycling",
  "Forearms",
  "Treadmill",
  "Triceps",
];
const ALLOWED_DISTANCE = 200;

const isTablet = () => {
  const aspectRatio = height / width;
  return width >= 768 || (width >= 600 && aspectRatio < 1.6);
};

const WorkoutSelection = (props) => {
  const {
    onScroll,
    scrollEventThrottle,
    headerHeight,
    onSectionChange,
    gender,
    fetchXp,
  } = props;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [fittbotWorkouts, setFittbotWorkouts] = useState(null);
  const [myWorkouts, setMyWorkouts] = useState(null);
  const [isInGym, setIsInGym] = useState(false);
  const [isQRScannerVisible, setQRScannerVisible] = useState(false);
  const { task, caloriesBurned, showFeedback } = useLocalSearchParams();
  const [isEntryModalVisible, setEntryModalVisible] = useState(false);
  const [isExitModalVisible, setExitModalVisible] = useState(false);
  const [isExitConfirmModalVisible, setExitConfirmModalVisible] =
    useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [punchInTime, setPunchInTime] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [gymLocation, setGymLocation] = useState(null);
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [workoutCompletionVisible, setWorkoutCompletionVisible] =
    useState(false);
  const [image, setImage] = useState(null);
  const [currentModalType, setCurrentModalType] = useState(false);
  const [selections, setSelections] = useState({
    workoutType: null,
    gender: "male",
    goals: null,
    level: null,
  });
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const { sideBarData, profile } = useUser();
  const [showKyraMessage, setShowKyraMessage] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const { plan } = useUser();

  const [clientId, setClientId] = useState(null);
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const storedClientId = await AsyncStorage.getItem("client_id");
        if (storedClientId) {
          setClientId(storedClientId);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc: "Client ID not found. Please login again.",
          });
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to fetch user information",
        });
      }
    };

    fetchClientId();
  }, []);
  const [appState, setAppState] = useState(AppState.currentState);
  const appStateRef = useRef(AppState.currentState);

  const checkKyraMessageDisplay = async () => {
    try {
      const lastShownTime = await AsyncStorage.getItem(
        "kyra_workout_message_time"
      );
      const currentTime = Date.now();
      const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      if (!lastShownTime || currentTime - parseInt(lastShownTime) > sixHours) {
        setShowKyraMessage(true);
        await AsyncStorage.setItem(
          "kyra_workout_message_time",
          currentTime.toString()
        );
      } else {
        setShowKyraMessage(false);
      }
    } catch (error) {
      console.error("Error checking Kyra message display:", error);
      setShowKyraMessage(true);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const workoutTypes = [
    {
      id: "machines",
      title: "Know Your Machineries",
      subtitle: "From Confusion to Confidence on Every Machine.",
      imagePath: require("../../../assets/images/machines.png"),
      buttonText: "Start Now",
      charWidth: isTablet() ? 170 : 120,
      charHeight: isTablet() ? 160 : 110,
    },

    {
      id: "fittbot",
      title: "Fittbot Workouts",
      subtitle: "Everything you need for workouts.Just one tap inside Fittbot.",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/FITTBOT_WORKOUT_02 1.png")
          : require("../../../assets/images/fittbot_workout_female.png"),
      buttonText: "Start Now",
      charWidth: isTablet() ? 170 : 110,
      charHeight: isTablet()
        ? 140
        : gender?.toLowerCase() === "male"
        ? 140
        : 120,
    },

    {
      id: "template",
      title: "Fittbot Default Templates",
      subtitle: "Easy-to-follow exercise templates to guide your training.",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/default_template.png")
          : require("../../../assets/images/default_template_female.png"),
      buttonText: "Start Now",
      charWidth: isTablet() ? 170 : 115,
      charHeight: isTablet() ? 140 : 140,
    },
    {
      id: "personal",
      title: "Make Your Own Template",
      subtitle:
        "Build personalized workouts step-by-step and customize your training plan easily.",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/personal_template.png")
          : require("../../../assets/images/personal_template_female.png"),
      buttonText: "Start Now",
      charWidth: isTablet() ? 170 : 100,
      charHeight: isTablet() ? 140 : 145,
    },

    {
      id: "home",
      title: "Home Workouts",
      subtitle: "No gym access? Train anywhere,anytime at home or on the go.",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/home_workout.png")
          : require("../../../assets/images/home_workout_female.png"),
      buttonText: "Start Now",
      charWidth: isTablet()
        ? 170
        : gender?.toLowerCase() === "female"
        ? 140
        : 125,
      charHeight: isTablet()
        ? 140
        : gender?.toLowerCase() === "female"
        ? 96
        : 100,
    },
  ];

  const handleModalClick = (type) => {
    if (isPureFreemium(plan)) {
      if (Platform.OS === "ios") {
        setPremiumModalVisible(true);
      } else {
        if (type == "fittbot") {
          router.push("/client/subscription");
        } else if (type == "personal") {
          router.push("/client/subscription");
        } else if (type == "scan") {
          router.push("/client/subscription");
        } else if (type == "template") {
          router.push("/client/subscription");
        } else if (type == "home") {
          router.push("/client/subscription");
        } else if (type == "machines") {
          router.push("/client/subscription");
        }
      }
    } else {
      if (type == "fittbot") {
        router.push("/client/(workout)/fittbotWorkoutPage");
      } else if (type == "personal") {
        router.push("/client/(workout)/personalTemplate");
      } else if (type == "scan") {
        setQRScannerVisible(true);
      } else if (type == "template") {
        handleWorkoutTypeSelect();
      } else if (type == "home") {
        router.push("/client/(workout)/homeWorkoutPage");
      } else if (type == "machines") {
        router.push("/client/(workout)/machine");
      }
    }
  };

  const genderOptions = [
    {
      id: "male",
      title: "Male",
      subtitle: "No shortcuts. Just scars and stats.",
      imagePath: require("../../../assets/images/Layer 41 1.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "gender",
    },
    {
      id: "female",
      title: "Female",
      subtitle: "Strong. Toned. Unstoppable.",
      imagePath: require("../../../assets/images/FEMALE_V001.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "gender",
    },
  ];

  const goalOptions = [
    {
      id: "weight_gain",
      title: "Weight Gain",
      subtitle: "Build muscle and gain healthy weight",
      imagePath: require("../../../assets/images/BEGINNER (1).png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goals",
    },
    {
      id: "weight_loss",
      title: "Weight Loss",
      subtitle: "Burn fat and get leaner",
      imagePath: require("../../../assets/images/INTERMEDIATE.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goals",
    },
    {
      id: "body_recomposition",
      title: "Body Recomposition",
      subtitle: "Build muscle while losing fat",
      imagePath: require("../../../assets/images/ATHLETE (1).png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goals",
    },
  ];

  const goalOptionsFemale = [
    {
      id: "weight_gain",
      title: "Weight Gain",
      subtitle: "Build muscle and gain healthy weight",
      imagePath: require("../../../assets/images/workout/BEGINNER.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goals",
    },
    {
      id: "weight_loss",
      title: "Weight Loss",
      subtitle: "Burn fat and get leaner",
      imagePath: require("../../../assets/images/workout/weight_loss.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goals",
    },
    {
      id: "body_recomposition",
      title: "Body Recomposition",
      subtitle: "Build muscle while losing fat",
      imagePath: require("../../../assets/images/workout/athlete.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goals",
    },
  ];
  const weightLossLevelsMale = [
    {
      id: "beginner",
      title: "Extreme Fat Loss",
      subtitle: "Lose 20kg+",
      imagePath: require("../../../assets/images/workout/extreme.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "intermediate",
      title: "Major Fat Loss",
      subtitle: "Lose 10-20kg",
      imagePath: require("../../../assets/images/workout/major.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "athlete",
      title: "Power Shred",
      subtitle: "Lose 5-10kg",
      imagePath: require("../../../assets/images/workout/power.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "expert",
      title: "Ultimate Shred",
      subtitle: "Lose 5kg",
      imagePath: require("../../../assets/images/workout/ultimate.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
  ];

  const weightLossLevelsFemale = [
    {
      id: "beginner",
      title: "Extreme Fat Loss",
      subtitle: "Lose 20kg+",
      imagePath: require("../../../assets/images/workout/extreme_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "intermediate",
      title: "Major Fat Loss",
      subtitle: "Lose 10-20kg",
      imagePath: require("../../../assets/images/workout/major_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "athlete",
      title: "Power Shred",
      subtitle: "Lose 5-10kg",
      imagePath: require("../../../assets/images/workout/power_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "expert",
      title: "Ultimate Shred",
      subtitle: "Lose 5kg",
      imagePath: require("../../../assets/images/workout/ultimate_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
  ];

  const experienceLevelsMale = [
    {
      id: "beginner",
      title: "Beginner",
      subtitle: "New to gyms.Gain 10kg+",
      imagePath: require("../../../assets/images/workout/start.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "intermediate",
      title: "Intermediate",
      subtitle: "You’re Not New Anymore.Gain 5-10kg",
      imagePath: require("../../../assets/images/workout/inter.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "athlete",
      title: "Athlete",
      subtitle: "Power Bulk.Gain 3-5kg",
      imagePath: require("../../../assets/images/workout/ath.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "expert",
      title: "Expert",
      subtitle: "You Know the Game.Gain 0-3kg",
      imagePath: require("../../../assets/images/workout/exp.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
  ];

  const experienceLevelsFemale = [
    {
      id: "beginner",
      title: "Beginner",
      subtitle: "New to gyms.Gain 6kg+",
      imagePath: require("../../../assets/images/workout/start_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "intermediate",
      title: "Intermediate",
      subtitle: "You’re Not New Anymore.Gain 3-6kg",
      imagePath: require("../../../assets/images/workout/inter_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "athlete",
      title: "Athlete",
      subtitle: "Built by Discipline.Gain 1.5-3kg",
      imagePath: require("../../../assets/images/workout/ath_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
    {
      id: "expert",
      title: "Expert",
      subtitle: "You Know the Game.Gain 0-1.5kg",
      imagePath: require("../../../assets/images/workout/exp-female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "level",
    },
  ];

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const storedClientId = await AsyncStorage.getItem("client_id");
        if (storedClientId) {
          setClientId(storedClientId);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc: "Client ID not found. Please login again.",
          });
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to fetch user information",
        });
      }
    };

    fetchClientId();
  }, []);

  const [selectedItems, setSelectedItems] = useState(genderOptions);

  const handleSelection = async (type, value, title) => {
    if (type == "gender") {
      setSelections({
        ...selections,
        gender: value,
      });
      // Set goal options based on selected gender
      setSelectedItems(value === "female" ? goalOptionsFemale : goalOptions);
    } else if (type == "goals") {
      setSelections({
        ...selections,
        goals: value,
      });

      if (value === "body_recomposition") {
        // Skip level selection for body recomposition
        setCurrentModalType(false);
        try {
          const response = await getDefaultWorkoutAPI(
            selections.gender,
            "athlete",
            value
          );
          if (response?.status == 200) {
            router.push({
              pathname: "/client/exercise",
              params: {
                exercises: JSON.stringify(response?.data),
                isDefaultWorkouts: true,
                goals: value,
                gender: selections.gender,
                level: "Body Recomposition",
              },
            });
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Something went wrong. Please try again later",
          });
        }
      } else {
        // Show level selection based on gender and goals
        if (value === "weight_gain") {
          setSelectedItems(
            selections.gender === "male"
              ? experienceLevelsMale
              : experienceLevelsFemale
          );
        } else if (value === "weight_loss") {
          setSelectedItems(
            selections.gender === "male"
              ? weightLossLevelsMale
              : weightLossLevelsFemale
          );
        }
      }
    } else if (type == "level") {
      setSelections({
        ...selections,
        level: value,
      });
      setCurrentModalType(false);
      try {
        const response = await getDefaultWorkoutAPI(
          selections.gender,
          value,
          selections.goals
        );
        if (response?.status == 200) {
          router.push({
            pathname: "/client/exercise",
            params: {
              exercises: JSON.stringify(response?.data),
              isDefaultWorkouts: true,
              level: title,
              goals: selections.goals,
              gender: selections.gender,
            },
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } else if (type == "personal") {
      setCurrentModalType(false);
    }
  };

  const handleWorkoutTypeSelect = () => {
    setCurrentModalType(true);
    setSelectedItems(genderOptions);
  };

  const refreshPunchInDetails = async () => {
    if (!isInGym) return; // Only refresh if user is in gym

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      const gymDetailsResponse = await getPunchedInDetailsAPI(clientId, gymId);

      if (gymDetailsResponse?.status === 200) {
        setPunchInTime(gymDetailsResponse?.in_time);
        // Start timer with the new punch-in time
        startTimer(gymDetailsResponse?.in_time);
      }
    } catch (error) {}
  };

  const startTimer = (time = null) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const timeToUse = time || punchInTime;

    if (timeToUse) {
      try {
        const [hours, minutes, seconds] = timeToUse.split(":").map(Number);
        const punchInDate = new Date();
        punchInDate.setHours(hours, minutes, seconds, 0);
        const initialElapsed = Math.floor((new Date() - punchInDate) / 1000);
        setElapsedTime(initialElapsed > 0 ? initialElapsed : 0);
      } catch (error) {
        setElapsedTime(0);
      }
    } else {
      setElapsedTime(0);
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedTime(0);
  }, []);

  const handleAppStateChange = useCallback(
    (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isInGym
      ) {
        // App has come to the foreground
        // console.log('App has come to the foreground!');
        refreshPunchInDetails(); // Refresh the time from backend
      }

      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    },
    [isInGym]
  );

  // Set up AppState change listener
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  useEffect(() => {
    if (task === "exercise added") {
      // Don't show workout completion modal if feedback modal should be shown
      if (showFeedback !== "true") {
        // setTimeout(() => {
        setWorkoutCompletionVisible(true);
        // }, 2000);
      } else {
        setWorkoutCompletionVisible(false);
      }
    } else {
      setWorkoutCompletionVisible(false);
    }
    if (isInGym) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isInGym, punchInTime, task, showFeedback, stopTimer]);

  const handleCloseCompletionModal = () => {
    setWorkoutCompletionVisible(false);
    router.setParams({ task: null });
  };

  useEffect(() => {
    if (onSectionChange) {
      onSectionChange(activeSection);
    }
  }, [activeSection, onSectionChange]);

  const checkGymPresence = async () => {
    // setLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    const gymId = await AsyncStorage.getItem("gym_id");

    try {
      const response = await getInStatusAPI(clientId, gymId ? gymId : null);

      setIsInGym(
        response?.status === 200 ? response?.attendance_status : false
      );
      if (response?.status === 200 && response?.attendance_status) {
        const gymDetailsResponse = await getPunchedInDetailsAPI(
          clientId,
          gymId
        );
        if (gymDetailsResponse?.status === 200) {
          setPunchInTime(gymDetailsResponse?.in_time);
          setGymLocation(gymDetailsResponse?.gym_location);
        }
      } else {
        const gymDetailsResponse = await getPunchedInDetailsAPI(
          clientId,
          gymId
        );
        if (gymDetailsResponse?.status === 200) {
          setGymLocation(gymDetailsResponse?.gym_location);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error checking gym presence",
      });
      setIsInGym(false);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setActiveSection(null);
      checkKyraMessageDisplay();
      if (isOnlyFree(plan) || isFittbotPremium(plan)) {
        setLoading(false);
        return;
      } else {
        checkGymPresence();
      }
    }, [])
  );

  const handleQRCodeScanned = (type, data) => {
    fetchQRData(data);
  };

  const fetchQRData = async (data) => {
    setLoading(true);
    try {
      const payload = {
        link: data,
        gender: gender,
      };
      const response = await QRAPI(payload);

      if (response?.status === 200) {
        router.push({
          pathname: "/client/exercise",
          params: {
            templateId: 1,
            qrExercises: JSON.stringify(Object.values(response?.data).flat()),
            myExercises: JSON.stringify(response?.data),
            isQR: true,
            gender: gender,
          },
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMuscleGroupSelect = (group) => {
    if (fittbotWorkouts && fittbotWorkouts[group]) {
      router.push({
        pathname: "/client/exercise",
        params: {
          muscleGroup: group,
          exercises: JSON.stringify(fittbotWorkouts),
          isMuscleGroup: fittbotWorkouts[group].isMuscleGroup,
          isCardio: fittbotWorkouts[group].isCardio,
          gender: gender,
        },
      });
    }
  };

  const handleTemplateSelect = (template) => {
    if (template && template.exercise_data) {
      router.push({
        pathname: "/client/exercise",
        params: {
          templateId: template.id,
          templateName: template.name,
          templateExercises: JSON.stringify(
            Object.keys(template.exercise_data)
          ),
          myTemplateExercise: JSON.stringify(template.exercise_data),
          isTemplate: true,
          gender: gender,
        },
      });
    }
  };

  const handleSetActiveSection = (section) => {
    setActiveSection(section);
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const toggleMuscleSelection = (muscle) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGymEntry = async () => {
    if (checkingLocation) return;
    setErrorMsg(null);
    setCheckingLocation(true);

    try {
      // Check if we have location permission first
      let { status } = await requestForegroundPermissionsAsync();

      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Permission Required",
          desc: "Location permission is required to punch in. Please enable it in settings.",
        });
        setEntryModalVisible(false);
        setCheckingLocation(false);
        return;
      }

      // Add a small delay to ensure permission is fully processed
      if (Platform.OS === "ios") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Now try to get location with proper accuracy settings
      let position = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!position && attempts < maxAttempts) {
        try {
          position = await getCurrentPositionAsync({
            // Use proper LocationAccuracy enum values
            accuracy:
              Platform.OS === "android"
                ? LocationAccuracy.High
                : LocationAccuracy.Best,
            maximumAge: 10000,
            timeout: 10000,
          });
          break;
        } catch (locationError) {
          attempts++;

          if (attempts < maxAttempts) {
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw locationError;
          }
        }
      }

      if (!position) {
        throw new Error("Unable to get location after multiple attempts");
      }

      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        gymLocation.latitude,
        gymLocation.longitude
      );

      if (distance <= ALLOWED_DISTANCE) {
        await punchIn();
      } else {
        showToast({
          type: "error",
          title: "Location Error",
          desc: "You are not at the gym. Please punch in only when you are inside the gym.",
        });
        setEntryModalVisible(false);
      }
    } catch (error) {
      console.error("Location error:", error);

      // Provide more specific error messages
      let errorMessage =
        "Could not get your location. Please ensure location services are enabled and try again.";

      if (error.message.includes("denied")) {
        errorMessage =
          "Location access was denied. Please enable location permissions in settings.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Location request timed out. Please try again.";
      } else if (error.message.includes("unavailable")) {
        errorMessage =
          "Location services are unavailable. Please check your device settings.";
      }

      showToast({
        type: "error",
        title: "Location Error",
        desc: errorMessage,
      });
      setEntryModalVisible(false);
    } finally {
      setCheckingLocation(false);
    }
  };
  const punchIn = async () => {
    setCheckingLocation(true);
    const clientId = await AsyncStorage.getItem("client_id");
    const gymId = await AsyncStorage.getItem("gym_id");

    try {
      const payload = {
        client_id: clientId,
        gym_id: gymId,
        muscle: selectedMuscles,
      };

      const response = await addPunchInAPI(payload);

      if (response?.status === 200) {
        const currentTime = new Date();
        await checkGymPresence();
        setIsInGym(true);
        const earnedXp = response?.reward_point || 0;
        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
          setTimeout(() => {
            fetchXp();
            setEntryModalVisible(false);
          }, 3000);
          setTimeout(() => {
            setXpRewardVisible(false);
          }, 5000);
        } else {
          setEntryModalVisible(false);
          setXpRewardVisible(false);
        }
        showToast({
          type: "success",
          title: "Success",
          desc: "Punched In Successfully!",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch in.",
        });
        setEntryModalVisible(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
      setEntryModalVisible(false);
    } finally {
      setCheckingLocation(false);
      setSelectedMuscles([]);
    }
  };

  const showExitConfirmation = () => {
    setExitConfirmModalVisible(true);
  };

  const handleGymExit = async () => {
    setLoading(true);
    setExitConfirmModalVisible(false);
    const clientId = await AsyncStorage.getItem("client_id");
    const gymId = await AsyncStorage.getItem("gym_id");

    try {
      const payload = {
        client_id: clientId,
        gym_id: gymId,
      };

      const response = await addPunchOutAPI(payload);

      if (response?.status === 200) {
        setIsInGym(false);
        setPunchInTime(null);
        setExitModalVisible(true);
        setTimeout(() => {
          setExitModalVisible(false);
        }, 2000);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch out",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeTo12Hour = (timeString) => {
    if (!timeString || timeString === "NA") return "NA";

    try {
      const [hours, minutes, seconds] = timeString.split(":").map(Number);

      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;

      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  const renderFittbotWorkouts = () => (
    <FlatList
      data={Object.keys(fittbotWorkouts || {})}
      keyExtractor={(item) => item}
      numColumns={2}
      contentContainerStyle={[styles.flatListContent, { paddingTop: 15 }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      ListHeaderComponent={() => (
        <TouchableOpacity
          style={styles.listHeader}
          onPress={() => handleSetActiveSection(null)}
        >
          <Ionicons name="arrow-back" size={20} color="#000" />
          <Text>Fittbot Workouts</Text>
        </TouchableOpacity>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.muscleGroupCard}
          onPress={() => handleMuscleGroupSelect(item)}
        >
          <ImageBackground
            source={{
              uri:
                fittbotWorkouts[item].imagePath ||
                "https://via.placeholder.com/400x300",
            }}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
              style={styles.gradientOverlay}
            >
              <Text style={styles.muscleGroupText}>{item}</Text>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      )}
    />
  );

  const renderTemplateWorkouts = () => (
    <FlatList
      data={myWorkouts || []}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      contentContainerStyle={[styles.flatListContent, { paddingTop: 15 }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      ListHeaderComponent={() => (
        <TouchableOpacity
          style={styles.listHeader}
          onPress={() => handleSetActiveSection(null)}
        >
          <Ionicons name="arrow-back" size={20} color="#000" />
          <Text>Template Workouts</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={80} color="#DDD" />
          <Text style={styles.emptyStateTitle}>No Templates Found</Text>
          <Text style={styles.emptyStateText}>
            You haven't created any workout templates yet
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.templateCard}
          onPress={() => handleTemplateSelect(item)}
        >
          <LinearGradient
            colors={["#4A90E2", "#80b1eb", "#a5c8f1"]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.templateName}>{item.name}</Text>
            <View style={styles.templateDetails}>
              <Text
                style={styles.templateSubtext}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {Object.keys(item.exercise_data || {})
                  .slice(0, 3)
                  .join(", ")}
                {Object.keys(item.exercise_data || {}).length > 3 ? "..." : ""}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    />
  );

  const renderWorkoutTimer = () => {
    if (!isInGym) return null;

    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerContent}>
          <FontAwesome5 name="stopwatch" size={20} color="#FF5757" />
          <Text style={styles.timerLabel}>Session Duration:</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>
    );
  };

  const renderGymEntryExitButtons = () => (
    <View style={styles.gymButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.gymButton,
          styles.entryButton,
          isInGym && styles.disabledGymButton,
        ]}
        onPress={() => setEntryModalVisible(true)}
        disabled={isInGym}
      >
        <Ionicons
          name="enter-outline"
          size={18}
          color="#297DB3"
          style={styles.gymEntryIcon}
        />
        <View>
          <Text style={styles.gymEntryText}>Gym Entry</Text>
          {punchInTime && isInGym && (
            <Text style={styles.gymTimeText}>
              {formatTimeTo12Hour(punchInTime) || "NA"}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.gymButton,
          styles.exitButton,
          !isInGym && styles.disabledGymButton,
        ]}
        onPress={showExitConfirmation}
        disabled={!isInGym}
      >
        <Ionicons
          name="exit-outline"
          size={18}
          color="#FFF"
          style={styles.gymExitIcon}
        />
        <Text style={styles.gymExitText}>Gym Exit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelectionButtons = () => (
    <ScrollView style={[styles.selectionButtonsContainer]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* <TouchableOpacity
          onPress={() => {
            setXpRewardVisible(true);
            setTimeout(() => {
              setXpRewardVisible(false);
            }, 5000);
          }}
        >
          <Text>Animate</Text>
        </TouchableOpacity> */}
        {workoutTypes?.map((item, index) => {
          // if (!isInGym && index === 0) {
          //   return null;
          // }
          return (
            <WorkoutCard
              key={item?.id}
              title={item?.title}
              subtitle={item?.subtitle}
              buttonText={item?.buttonText}
              imagePath={item?.imagePath}
              onPress={() => handleModalClick(item?.id)}
              textColor={"#297DB3"}
              bg1={"rgba(41, 125, 179, 0.15)"}
              bg2={"#fff"}
              border1={"rgba(41, 125, 179, 0.5)"}
              border2={"#fff"}
              charWidth={item.charWidth}
              charHeight={item?.charHeight}
            />
          );
        })}
      </ScrollView>
    </ScrollView>
  );

  const renderEntryModal = () => (
    <Modal
      visible={isEntryModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEntryModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setEntryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Muscle Groups</Text>
              <Text style={styles.modalSubtitle}>
                Which areas are you planning to workout today?
              </Text>
              {xpRewardVisible ? (
                <ConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
              ) : (
                ""
              )}

              <View style={styles.muscleGroupsModalContainer}>
                {muscleGroups.map((muscle) => (
                  <TouchableOpacity
                    key={muscle}
                    style={[
                      styles.muscleGroupItem,
                      selectedMuscles.includes(muscle) &&
                        styles.selectedMuscleGroupItem,
                    ]}
                    onPress={() => toggleMuscleSelection(muscle)}
                  >
                    <Text
                      style={[
                        styles.muscleGroupItemText,
                        selectedMuscles.includes(muscle) &&
                          styles.selectedMuscleGroupItemText,
                      ]}
                    >
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setEntryModalVisible(false);
                    setSelectedMuscles([]);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalConfirmButton,
                    selectedMuscles.length === 0 &&
                      styles.disabledConfirmButton,
                  ]}
                  onPress={handleGymEntry}
                  disabled={selectedMuscles.length === 0 || checkingLocation}
                >
                  {checkingLocation ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderExitConfirmModal = () => (
    <Modal
      visible={isExitConfirmModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setExitConfirmModalVisible(false)}
    >
      <TouchableWithoutFeedback
        onPress={() => setExitConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Gym Exit</Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to end your workout session?
              </Text>

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setExitConfirmModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleGymExit}
                >
                  <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderExitModal = () => (
    <Modal
      visible={isExitModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setExitModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.exitModalContent}>
          <Text style={styles.exitModalText}>Thank You! Visit Again.</Text>
          <Text style={styles.exitModalSubtext}>
            Punched out at {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </Modal>
  );

  const generateFilename = () => {
    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Client ID not found. Cannot save image.",
      });
      return null;
    }

    const randomId = Math.random().toString().slice(2, 10);
    const date = toIndianISOString(new Date()).split("T")[0];
    return `${clientId}_${randomId}_${date}.jpg`;
  };

  const setupImageDirectory = async () => {
    const dirUri = `${FileSystem.documentDirectory}FittbotImages/`;
    const dirInfo = await FileSystem.getInfoAsync(dirUri);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }

    return dirUri;
  };

  const handleKyraAIPress = () => {
    if (isPurePremium(plan)) {
      router.push({
        pathname: "/client/(workout)/kyraAI",
        params: {
          profileImage: profile,
          userName: sideBarData?.userName,
          source: "workoutlog",
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

  const handleImageUpload = async () => {
    setWorkoutCompletionVisible(false);

    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "User not authenticated. Please login again.",
      });
      return;
    }

    try {
      // Request camera permissions with proper error handling
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (cameraStatus !== "granted") {
        showToast({
          type: "error",
          title: "Camera Permission Required",
          desc: "Please enable camera permissions in your device settings to take photos.",
        });
        setWorkoutCompletionVisible(true);
        return;
      }

      // For iOS, also request media library permissions
      if (Platform.OS === "ios") {
        const { status: mediaLibraryStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus !== "granted") {
        }
      }

      const dirUri = await setupImageDirectory();
      const newFilename = generateFilename();

      if (!newFilename) {
        setWorkoutCompletionVisible(true);
        return;
      }

      const newFileUri = `${dirUri}${newFilename}`;

      // Enhanced camera options for better iOS compatibility
      const cameraOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Set to false for better iOS compatibility
        aspect: [4, 3],
        quality: Platform.OS === "ios" ? 0.7 : 0.8,
        base64: false, // Set to false to reduce memory usage
        exif: false, // Disable EXIF data for faster processing
      };

      // Add iOS-specific options
      if (Platform.OS === "ios") {
        cameraOptions.presentationStyle =
          ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN;
      }

      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        // Delete previous image if exists
        if (image) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(image);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(image);
            }
          } catch (deleteError) {}
        }

        // Copy the image to our directory
        try {
          await FileSystem.copyAsync({
            from: selectedAsset.uri,
            to: newFileUri,
          });

          setImage(newFileUri);

          showToast({
            type: "success",
            title: "Success",
            desc: "Photo captured successfully!",
          });
        } catch (copyError) {
          console.error("Error copying image:", copyError);
          showToast({
            type: "error",
            title: "Error",
            desc: "Failed to save the image. Please try again.",
          });
        }
      } else {
      }
    } catch (error) {
      console.error("Camera error:", error);

      let errorMessage = "Failed to open camera. Please try again.";

      // Provide specific error messages based on the error
      if (error.message?.includes("permission")) {
        errorMessage =
          "Camera permission is required. Please enable it in Settings.";
      } else if (error.message?.includes("unavailable")) {
        errorMessage = "Camera is not available on this device.";
      } else if (error.message?.includes("cancelled")) {
        errorMessage = "Camera was cancelled.";
      }

      showToast({
        type: "error",
        title: "Camera Error",
        desc: errorMessage,
      });
    } finally {
      setWorkoutCompletionVisible(true);
    }
  };

  if (loading) {
    return <SkeletonWorkout header={false} priority="high" gap={true} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.scrollableContent}>
        {activeSection === null
          ? renderSelectionButtons()
          : activeSection === "fittbot"
          ? renderFittbotWorkouts()
          : renderTemplateWorkouts()}
      </View>

      {!activeSection && !isFittbotPremium(plan) && !isOnlyFree(plan) && (
        <View
          style={[
            styles.fixedHeaderContainer,
            { paddingBottom: Platform.OS === "ios" ? insets.bottom : 0 },
          ]}
        >
          {renderGymEntryExitButtons()}
          {renderWorkoutTimer()}
        </View>
      )}

      <KyraAIFloatingButton
        onPress={handleKyraAIPress}
        position="bottom-right"
        size="small"
        showBadge={false}
        colors={["#78CAFF", "#297DB3"]}
        style={{ bottom: Platform.OS === "ios" ? 300 : 300 }}
        message={
          showKyraMessage
            ? "Hi, I'm KyraAI\nI can help you log your workouts instantly"
            : ""
        }
        boxColor={["#78CAFF", "#297DB3"]}
      />

      {/* <KyraAIFloatingButton
        onPress={handleKyraAIPress}
        position="bottom-left" // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        size="small" // 'small', 'medium', 'large'
        showBadge={false}
        // badgeText="NEW"
        colors={["#D9D9D9", "#737373"]} // Custom gradient colors
        style={{ bottom: Platform.OS === "ios" ? 210 : 150 }} // Additional custom positioning
        message={"Hi, I'm KyraAI\nYour Personal Workout Coach"}
        boxColor={["#78CAFF", "#297DB3"]}
      /> */}

      {/* QR Scanner */}
      {isQRScannerVisible && (
        <QRCodeScanner
          isVisible={isQRScannerVisible}
          onClose={() => setQRScannerVisible(false)}
          onCodeScanned={handleQRCodeScanned}
        />
      )}
      {/* {currentModalType && ( */}
      <WorkoutSelectionModal
        visible={currentModalType}
        setCurrentModalType={setCurrentModalType}
        items={selectedItems}
        handleSelection={handleSelection}
        height={125}
      />
      {/* )} */}

      {/* Modals */}
      {renderEntryModal()}
      {renderExitConfirmModal()}
      {renderExitModal()}

      <WorkoutCompletionModal
        visible={workoutCompletionVisible}
        onClose={handleCloseCompletionModal}
        onAddImage={handleImageUpload}
        image={image}
        type={"workout"}
        caloriesBurned={caloriesBurned}
      />

      {/* <KyraAIFloatingButton
        onPress={handleKyraAIPress}
        position="bottom-right" // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        size="small" // 'small', 'medium', 'large'
        showBadge={false}
        // badgeText="NEW"
        colors={["#78CAFF", "#297DB3"]} // Custom gradient colors
        style={{ bottom: Platform.OS === "ios" ? 190 : 130 }} // Additional custom positioning
        message={
          "Hi, I'm KyraAI\nI can help you log your workouts instantly"
        }
        boxColor={["#78CAFF", "#297DB3"]}
      /> */}

      {/* XP Reward Animation */}
      {/* <XpRewardAnimation
                xpAmount={xpAmount}
                visible={xpRewardVisible}
                onAnimationComplete={handleAnimationComplete}
                startPosition={startPosition}
                endPosition={endPosition}
                color="#FF5757"
            /> */}

      {/* Premium Modal for iOS */}
      <Modal
        visible={premiumModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPremiumModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPremiumModalVisible(false)}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  gymButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.04,
    paddingBottom: width * 0.04,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gymButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    flex: 0.48,
    elevation: 3,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  entryButton: {
    backgroundColor: "#297DB3",
  },
  exitButton: {
    color: "#F44336",
    backgroundColor: "#fff",
    borderColor: "#F44336",
    borderWidth: 1,
  },
  disabledGymButton: {
    opacity: 0.5,
  },
  gymEntryIcon: {
    backgroundColor: "#fff",
    padding: 4,
    borderRadius: 50,
  },
  gymExitIcon: {
    backgroundColor: "#F44336",
    padding: 4,
    borderRadius: 50,
  },
  gymEntryText: {
    color: "#fff",
  },
  gymExitText: {
    color: "#F44336",
  },
  gymTimeText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
  },
  timerContainer: {
    paddingHorizontal: width * 0.04,
    paddingBottom: width * 0.02,
    marginBottom: 8,
  },
  timerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  timerLabel: {
    fontSize: width * 0.035,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    marginRight: 4,
  },
  timerText: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: "#FF5757",
  },

  selectionButtonsContainer: {
    padding: isTablet() ? width * 0.025 : width * 0.035,
    overflow: "visible",
    // marginTop: 13,
  },
  selectionButton: {
    marginBottom: height * 0.02,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonGradient: {
    padding: height * 0.03,
  },
  buttonIconContainer: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.075,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  buttonTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: height * 0.005,
  },
  buttonSubtitle: {
    fontSize: width * 0.035,
    color: "rgba(255, 255, 255, 0.9)",
  },
  // Workout list styles
  flatListContent: {
    padding: width * 0.04,
    paddingBottom: height * 0.1,
  },
  listHeader: {
    marginBottom: height * 0.01,
    marginTop: 25,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  muscleGroupCard: {
    width: width * 0.43,
    height: height * 0.18,
    margin: width * 0.02,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    flex: 1,
    padding: width * 0.03,
    justifyContent: "center",
    alignItems: "center",
  },
  muscleGroupText: {
    fontSize: width * 0.038,
    fontWeight: "bold",
    color: "#FFF",
    textTransform: "uppercase",
  },
  templateCard: {
    width: width * 0.43,
    height: height * 0.18,
    margin: width * 0.02,
    borderRadius: 15,
    overflow: "visible",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientBackground: {
    flex: 1,
    padding: width * 0.03,
    justifyContent: "center",
    alignItems: "center",
  },
  templateName: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#FFF",
  },
  templateDetails: {
    marginTop: height * 0.01,
  },
  templateSubtext: {
    fontSize: width * 0.03,
    color: "rgba(255, 255, 255, 0.8)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: width * 0.08,
    marginTop: height * 0.06,
  },
  emptyStateTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#333",
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  emptyStateText: {
    fontSize: width * 0.04,
    color: "#777",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  muscleGroupsModalContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  muscleGroupItem: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
    marginVertical: 6,
  },
  selectedMuscleGroupItem: {
    backgroundColor: "#297DB3",
    borderColor: "#297DB3",
  },
  muscleGroupItemText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  selectedMuscleGroupItemText: {
    color: "#FFF",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    flex: 0.45,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#297DB3",
    flex: 0.45,
    alignItems: "center",
  },
  disabledConfirmButton: {
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  exitModalContent: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 20,
    elevation: 10,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#297DB3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  exitModalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#297DB3",
    textAlign: "center",
    marginBottom: 10,
  },
  exitModalSubtext: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  fixedHeaderContainer: {
    backgroundColor: "#F7F7F7",
    zIndex: 10,
  },
  scrollableContent: {
    flex: 1,
    marginTop: 20,
    overflow: "visible",
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

export default WorkoutSelection;
