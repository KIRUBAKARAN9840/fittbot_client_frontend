import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import ExerciseCard from "../../../components/ui/Workout/ExerciseCard";
import OneTapExerciseCard from "../../../components/ui/Workout/OneTapExerciseCard";
import { showToast } from "../../../utils/Toaster";
import GrainConfettiAnimation from "../../../components/ui/ConfettiAnimation";
import UnsavedChangesBackHandler from "../../../components/WorkoutHardwareBackHandler";
import { toIndianISOString } from "../../../utils/basicUtilFunctions";
import {
  getExercisesAPI,
  addClientWorkoutAPI,
  getInStatusAPI,
  getEquipmentHistoryAPI,
} from "../../../services/clientApi";
import { useFocusEffect } from "@react-navigation/native";
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

const MachineExercises = () => {
  const { machineName } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [activeExercises, setActiveExercises] = useState({});
  const [oneTapExercises, setOneTapExercises] = useState([]);
  const [oneTapLoading, setOneTapLoading] = useState(false);
  const [selectedSets, setSelectedSets] = useState({});
  const [currentExercise, setCurrentExercise] = useState(null);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [historicalInputVisible, setHistoricalInputVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentSets, setCurrentSets] = useState([
    { reps: "", weight: "", duration: "" },
  ]);
  const [currentReps, setCurrentReps] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentDuration, setCurrentDuration] = useState("");
  const [userWeight, setUserWeight] = useState(70);
  const [isInGym, setIsInGym] = useState(false);
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [gifPath, setGifPath] = useState(null);
  const [gender, setGender] = useState("male");
  const [change, setChange] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [durationUnits, setDurationUnits] = useState({});
  const [MET, setMET] = useState(6);
  const [isBackConfirmModalVisible, setIsBackConfirmModalVisible] =
    useState(false);
  const [scrollViewRef, setScrollViewRef] = useState(null);

  const scrollViewRefOld = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getGenderAndWeight();
      checkGymPresence();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // console.log(machineName);
      const response = await getExercisesAPI(machineName);
      if (response?.status === 200) {
        const exercisesData = response?.data || [];
        setExercises(exercisesData);
        setFilteredExercises(exercisesData);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to fetch exercises",
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

  const fetchOneTapData = async () => {
    setOneTapLoading(true);
    try {
      const response = await getEquipmentHistoryAPI(machineName);
      if (response?.status === 200) {
        const exercisesData = response?.data || [];
        setOneTapExercises(exercisesData);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to fetch exercise history",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setOneTapLoading(false);
    }
  };

  const getGenderAndWeight = async () => {
    try {
      const storedGender = await AsyncStorage.getItem("gender");
      const weight = await AsyncStorage.getItem("user_weight");
      if (storedGender) setGender(storedGender);
      if (weight) setUserWeight(parseFloat(weight));
    } catch (error) {
      console.error("Error fetching gender/weight:", error);
    }
  };

  const checkGymPresence = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const response = await getInStatusAPI(clientId);
      setIsInGym(
        response?.status === 200 ? response?.attendance_status : false
      );
    } catch (error) {
      setIsInGym(false);
    }
  };

  const toggleMuscleGroupSelection = (group) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const applyMuscleGroupFilter = () => {
    if (selectedMuscleGroups.length === 0) {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter((ex) =>
        selectedMuscleGroups.includes(ex.muscle_group)
      );
      setFilteredExercises(filtered);
    }
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setSelectedMuscleGroups([]);
    setFilteredExercises(exercises);
    setFilterModalVisible(false);
  };

  const calculateCalories = (met, duration, weight) => {
    return Math.round(met * weight * (duration / 3600) * 100) / 100;
  };

  const handleStartExercise = (exerciseName) => {
    setActiveExercises((prev) => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        startTime: new Date(),
        isActive: true,
        sets: [...(prev[exerciseName]?.sets || [])],
      },
    }));
    showToast({
      type: "success",
      title: "Success",
      desc: "🎯 Workout Started! Let's crush it! 💪",
    });
  };

  const handleStopExercise = (exerciseName) => {
    const endTime = new Date();
    const exerciseState = activeExercises[exerciseName];
    const duration = Math.round((endTime - exerciseState.startTime) / 1000);

    setCurrentDuration(duration.toString());
    setCurrentExercise(exerciseName);
    setCurrentReps("");
    setCurrentWeight("");

    const exercise = exercises.find((ex) => ex.name === exerciseName);
    const isCardioExercise = exercise?.isCardio || false;

    if (isCardioExercise) {
      const caloriesBurned = calculateCalories(MET, duration, userWeight);

      const newSet = {
        setNumber: (exerciseState?.sets?.length || 0) + 1,
        startTime: exerciseState.startTime,
        endTime: endTime,
        reps: 0,
        weight: 0,
        duration: duration,
        MET: MET,
        calories: caloriesBurned,
      };

      setActiveExercises((prev) => ({
        ...prev,
        [exerciseName]: {
          ...prev[exerciseName],
          isActive: false,
          sets: [...(prev[exerciseName]?.sets || []), newSet],
        },
      }));

      setChange(!change);
      showToast({
        type: "success",
        title: "Success",
        desc: `🎯 Set completed! Burned ${caloriesBurned} calories! 💪`,
      });
    } else {
      setInputModalVisible(true);
    }
  };

  const handleHistoricalExercise = (exerciseName) => {
    setCurrentExercise(exerciseName);
    setSelectedDate(new Date());
    setCurrentSets([{ reps: "", weight: "", duration: "" }]);
    setDurationUnits({});
    setShowDatePicker(false);
    setHistoricalInputVisible(true);
  };

  const handleViewGif = (gifPath) => {
    setGifPath(gifPath);
    setInfoModalVisible(true);
  };

  const handleDeleteSet = (exerciseName, setIndex) => {
    setActiveExercises((prev) => {
      const updated = { ...prev };
      if (updated[exerciseName] && updated[exerciseName].sets) {
        updated[exerciseName].sets.splice(setIndex, 1);
        if (updated[exerciseName].sets.length === 0) {
          delete updated[exerciseName];
        }
      }
      return updated;
    });
    setChange(!change);
  };

  const resetInputs = () => {
    setCurrentReps("");
    setCurrentWeight("");
    setCurrentDuration("");
  };

  const handleSetComplete = () => {
    const exercise = exercises.find((ex) => ex.name === currentExercise);
    if (!exercise) return;

    const isCardioExercise = exercise.isCardio || false;
    const isBodyWeightExercise = exercise.isBodyWeight || false;
    const isMuscleGroupExercise = exercise.isMuscleGroup || false;

    if (!isCardioExercise) {
      if (!currentReps || isNaN(currentReps) || currentReps <= 0) {
        showToast({
          type: "error",
          title: "Invalid Input",
          desc: "Please enter a valid number of reps",
        });
        return;
      }
      if (isMuscleGroupExercise && !isBodyWeightExercise) {
        if (!currentWeight || isNaN(currentWeight) || currentWeight <= 0) {
          showToast({
            type: "error",
            title: "Invalid Input",
            desc: "Please enter a valid weight",
          });
          return;
        }
      }
    }

    const endTime = new Date();
    const exerciseState = activeExercises[currentExercise];

    const selectedMET = MET || (isCardioExercise ? 8 : 6);
    const duration = parseInt(currentDuration);
    const caloriesBurned = calculateCalories(selectedMET, duration, userWeight);

    const newSet = {
      setNumber: (exerciseState?.sets?.length || 0) + 1,
      startTime: exerciseState.startTime,
      endTime: endTime,
      reps: parseInt(currentReps) || 0,
      weight: parseFloat(currentWeight) || 0,
      duration: duration,
      MET: selectedMET,
      calories: caloriesBurned,
    };

    setActiveExercises((prev) => ({
      ...prev,
      [currentExercise]: {
        ...prev[currentExercise],
        isActive: false,
        sets: [...(prev[currentExercise]?.sets || []), newSet],
      },
    }));

    setInputModalVisible(false);
    resetInputs();
    setChange(!change);
    showToast({
      type: "success",
      title: "Success",
      desc: `🎯 Set completed! Burned ${caloriesBurned} calories! 💪`,
    });
  };

  const addHistoricalSet = () => {
    setCurrentSets((prev) => [...prev, { reps: "", weight: "", duration: "" }]);
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const updateHistoricalSet = (index, field, value) => {
    const updatedSets = [...currentSets];
    updatedSets[index] = { ...updatedSets[index], [field]: value };
    setCurrentSets(updatedSets);
  };

  const deleteHistoricalSet = (setIndex) => {
    if (currentSets.length > 1) {
      setCurrentSets((prev) => prev.filter((_, index) => index !== setIndex));
      const newUnits = {};
      Object.keys(durationUnits).forEach((key) => {
        const keyIndex = parseInt(key);
        if (keyIndex < setIndex) {
          newUnits[key] = durationUnits[key];
        } else if (keyIndex > setIndex) {
          newUnits[keyIndex - 1] = durationUnits[key];
        }
      });
      setDurationUnits(newUnits);
    }
  };

  const handleHistoricalSave = async () => {
    const exercise = exercises.find((ex) => ex.name === currentExercise);
    if (!exercise) return;

    const isCardioExercise = exercise.isCardio || false;
    const isBodyWeightExercise = exercise.isBodyWeight || false;
    const isMuscleGroupExercise = exercise.isMuscleGroup || false;

    let hasErrors = false;
    const errors = currentSets.map((set, index) => {
      if (isCardioExercise) {
        if (!set.duration || isNaN(set.duration) || set.duration <= 0) {
          hasErrors = true;
          return `Set ${index + 1}: Please enter a valid duration`;
        }
      } else {
        if (!set.reps || isNaN(set.reps) || set.reps <= 0) {
          hasErrors = true;
          return `Set ${index + 1}: Please enter a valid number of reps`;
        }
        if (isMuscleGroupExercise && !isBodyWeightExercise) {
          if (!set.weight || isNaN(set.weight) || set.weight <= 0) {
            hasErrors = true;
            return `Set ${index + 1}: Please enter a valid weight`;
          }
        }
      }
      return null;
    });

    if (hasErrors) {
      showToast({
        type: "error",
        title: "Invalid Input",
        desc: errors.filter((e) => e !== null).join("\n"),
      });
      return;
    }

    const processedSets = currentSets.map((set) => {
      const unit = durationUnits[currentExercise] || "seconds";
      let durationInSeconds = 0;

      if (isCardioExercise && set.duration) {
        const durationValue = parseFloat(set.duration);
        durationInSeconds =
          unit === "minutes" ? durationValue * 60 : durationValue;
      } else if (set.reps) {
        durationInSeconds = parseFloat(set.reps) * 3;
      }

      const calories = calculateCalories(MET, durationInSeconds, userWeight);

      return {
        reps: set.reps ? parseFloat(set.reps) : 0,
        weight: set.weight ? parseFloat(set.weight) : 0,
        duration: isCardioExercise ? durationInSeconds : durationInSeconds,
        MET: MET,
        calories: calories,
      };
    });

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      const workoutData = {
        client_id: Number(clientId),
        date: toIndianISOString(selectedDate).split("T")[0],
        workout_details: [
          {
            [exercise.muscle_group || "General"]: processedSets.map((set) => ({
              name: currentExercise,
              sets: [set],
            })),
          },
        ],
        live_status: isInGym,
        gym_id: gymId ? Number(gymId) : null,
      };

      const response = await addClientWorkoutAPI(workoutData);

      if (response?.status === 200) {
        const earnedXp = response?.reward_point || 0;
        if (earnedXp > 0) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
          setTimeout(() => {
            setXpRewardVisible(false);
          }, 5000);
        }

        showToast({
          type: "success",
          title: "Success",
          desc: "Exercise logged successfully!",
        });
        setHistoricalInputVisible(false);
        setCurrentSets([{ reps: "", weight: "", duration: "" }]);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to save workout",
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

  const hasUnsavedSets = () => {
    return Object.keys(activeExercises).length > 0;
  };

  const handleConfirmBackNavigation = () => {
    setIsBackConfirmModalVisible(false);
    setActiveExercises({});
    router.back();
  };

  const handleToggleSet = (exerciseName, setIndex) => {
    setSelectedSets((prev) => {
      const exerciseSets = prev[exerciseName] || [];
      const isSelected = exerciseSets.includes(setIndex);

      if (isSelected) {
        return {
          ...prev,
          [exerciseName]: exerciseSets.filter((idx) => idx !== setIndex),
        };
      } else {
        return {
          ...prev,
          [exerciseName]: [...exerciseSets, setIndex],
        };
      }
    });
  };

  const handleUpdateSet = (exerciseName, setIndex, updatedSet) => {
    setOneTapExercises((prev) => {
      return prev.map((exercise) => {
        if (exercise.name === exerciseName) {
          const updatedExerciseData = [...exercise.exercise_data];
          updatedExerciseData[setIndex] = updatedSet;
          return {
            ...exercise,
            exercise_data: updatedExerciseData,
          };
        }
        return exercise;
      });
    });
  };

  const saveOneTapWorkouts = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Client ID not found",
        });
        return;
      }

      // Check if any sets are selected
      const hasSelectedSets = Object.values(selectedSets).some(
        (sets) => sets.length > 0
      );

      if (!hasSelectedSets) {
        showToast({
          type: "error",
          title: "No Sets Selected",
          desc: "Please select at least one set to save",
        });
        return;
      }

      const groupedExercises = {};

      oneTapExercises.forEach((exercise) => {
        const exerciseName = exercise.name;
        const selectedSetIndices = selectedSets[exerciseName] || [];

        if (selectedSetIndices.length > 0) {
          const muscleGroup = exercise.muscle_group || "General";

          if (!groupedExercises[muscleGroup]) {
            groupedExercises[muscleGroup] = [];
          }

          const selectedSetData = selectedSetIndices.map(
            (setIndex) => exercise.exercise_data[setIndex]
          );

          groupedExercises[muscleGroup].push({
            name: exerciseName,
            sets: selectedSetData,
          });
        }
      });

      const workoutData = {
        client_id: Number(clientId),
        date: toIndianISOString(new Date()).split("T")[0],
        workout_details: [groupedExercises],
        live_status: isInGym,
        gym_id: gymId ? Number(gymId) : null,
      };

      const response = await addClientWorkoutAPI(workoutData);

      if (response?.status === 200) {
        let totalCaloriesBurned = 0;

        oneTapExercises.forEach((exercise) => {
          const exerciseName = exercise.name;
          const selectedSetIndices = selectedSets[exerciseName] || [];

          selectedSetIndices.forEach((setIndex) => {
            const set = exercise.exercise_data[setIndex];
            if (set?.calories) {
              totalCaloriesBurned += set.calories;
            }
          });
        });

        totalCaloriesBurned = Math.round(totalCaloriesBurned * 100) / 100;

        setSelectedSets({});

        const earnedXp = response?.reward_point || 0;
        if (earnedXp > 0) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
          setTimeout(() => {
            setXpRewardVisible(false);
            router.push({
              pathname: "/client/workout",
              params: {
                task: "exercise added",
                caloriesBurned: totalCaloriesBurned,
              },
            });
            setIsSaveModalVisible(false);
          }, 3000);
        } else {
          showToast({
            type: "success",
            title: "Success",
            desc: "Workout saved successfully!",
          });
          router.push({
            pathname: "/client/workout",
            params: {
              task: "exercise added",
              caloriesBurned: totalCaloriesBurned,
            },
          });
          setIsSaveModalVisible(false);
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to save workout",
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

  const saveAllWorkouts = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Client ID not found",
        });
        return;
      }

      const groupedExercises = {};
      Object.entries(activeExercises).forEach(
        ([exerciseName, exerciseData]) => {
          const exercise = exercises.find((ex) => ex.name === exerciseName);
          const muscleGroup = exercise?.muscle_group || "General";

          if (!groupedExercises[muscleGroup]) {
            groupedExercises[muscleGroup] = [];
          }

          groupedExercises[muscleGroup].push({
            name: exerciseName,
            sets: exerciseData.sets || [],
          });
        }
      );

      const workoutData = {
        client_id: Number(clientId),
        date: toIndianISOString(selectedDate).split("T")[0],
        workout_details: [groupedExercises],
        live_status: isInGym,
        gym_id: gymId ? Number(gymId) : null,
      };

      const response = await addClientWorkoutAPI(workoutData);

      if (response?.status === 200) {
        let totalCaloriesBurned = 0;
        Object.values(activeExercises).forEach((exerciseData) => {
          if (exerciseData.sets) {
            exerciseData.sets.forEach((set) => {
              if (set.calories) {
                totalCaloriesBurned += set.calories;
              }
            });
          }
        });
        totalCaloriesBurned = Math.round(totalCaloriesBurned * 100) / 100;

        setActiveExercises({});

        const earnedXp = response?.reward_point || 0;
        if (earnedXp > 0) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
          setTimeout(() => {
            setXpRewardVisible(false);
            router.push({
              pathname: "/client/workout",
              params: {
                task: "exercise added",
                caloriesBurned: totalCaloriesBurned,
              },
            });
            setIsSaveModalVisible(false);
          }, 3000);
        } else {
          showToast({
            type: "success",
            title: "Success",
            desc: "Workout saved successfully!",
          });
          router.push({
            pathname: "/client/workout",
            params: {
              task: "exercise added",
              caloriesBurned: totalCaloriesBurned,
            },
          });
          setIsSaveModalVisible(false);
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to save workout",
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

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{machineName}</Text>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons
          name="filter"
          size={24}
          color={selectedMuscleGroups.length > 0 ? "#297DB3" : "#333"}
        />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "all" && styles.activeTab]}
        onPress={() => setActiveTab("all")}
      >
        <LinearGradient
          colors={
            activeTab === "all"
              ? ["#297DB3", "#5299DB"]
              : ["transparent", "transparent"]
          }
          style={styles.tabGradient}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === "all" ? "#FFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            All Exercise
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "onetap" && styles.activeTab]}
        onPress={() => {
          setActiveTab("onetap");
          if (oneTapExercises.length === 0) {
            fetchOneTapData();
          }
        }}
      >
        <LinearGradient
          colors={
            activeTab === "onetap"
              ? ["#297DB3", "#5299DB"]
              : ["transparent", "transparent"]
          }
          style={styles.tabGradient}
        >
          <Ionicons
            name="flash"
            size={20}
            color={activeTab === "onetap" ? "#FFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "onetap" && styles.activeTabText,
            ]}
          >
            One Tap Log
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGymStatus = () => {
    if (!isInGym) return null;

    return (
      <View style={styles.gymStatusContainer}>
        <LinearGradient
          colors={["#4CAF50", "#45a049"]}
          style={styles.gymStatusGradient}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.gymStatusText}>Training In Gym</Text>
        </LinearGradient>
      </View>
    );
  };

  const renderExerciseList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#297DB3" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      );
    }

    if (filteredExercises.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={80} color="#CCC" />
          <Text style={styles.emptyText}>No exercises found</Text>
        </View>
      );
    }

    return (
      <>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item, index) => item.id.toString() || index.toString()}
          renderItem={({ item, index }) => (
            <ExerciseCard
              exercise={{
                name: item.name,
                gifPath: item.gifPath,
                imgPath: item.imgPath,
                gifPathFemale: item.gifPathFemale,
                imgPathFemale: item.imgPathFemale,
                isCardio: item.isCardio,
                isBodyWeight: item.isBodyWeight,
                isMuscleGroup: item.isMuscleGroup,
                muscleGroup: item.muscle_group,
              }}
              index={index}
              isInGym={isInGym}
              activeExercises={activeExercises}
              onStartExercise={handleStartExercise}
              onStopExercise={handleStopExercise}
              onHistoricalExercise={handleHistoricalExercise}
              onViewGif={(exerciseName, gifPath) => {
                setCurrentExercise(exerciseName);
                setGifPath(gifPath);
                setInfoModalVisible(true);
              }}
              onDeleteSet={handleDeleteSet}
              gender={gender}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        <TouchableOpacity
          style={styles.saveWorkoutButton}
          onPress={() => {
            const hasSets = Object.values(activeExercises).some(
              (exercise) => exercise.sets && exercise.sets.length > 0
            );

            if (hasSets) {
              setIsSaveModalVisible(true);
            } else {
              showToast({
                type: "error",
                title: "No Workout Data",
                desc: "Please log at least one set before saving.",
              });
            }
          }}
        >
          <Text style={styles.saveWorkoutButtonText}>SAVE WORKOUT</Text>
          <Ionicons
            name="save-outline"
            size={20}
            color="#fff"
            style={styles.saveButtonIcon}
          />
        </TouchableOpacity>
      </>
    );
  };

  const renderOneTapExerciseList = () => {
    if (oneTapLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#297DB3" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      );
    }

    if (oneTapExercises.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={80} color="#CCC" />
          <Text style={styles.emptyText}>No exercises found</Text>
        </View>
      );
    }

    return (
      <>
        <FlatList
          data={oneTapExercises}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item, index }) => (
            <OneTapExerciseCard
              exercise={{
                name: item.name,
                gifPath: item.gifPath,
                imgPath: item.imgPath,
                gifPathFemale: item.gifPathFemale,
                imgPathFemale: item.imgPathFemale,
                isCardio: item.isCardio,
                isBodyWeight: item.isBodyWeight,
                isMuscleGroup: item.isMuscleGroup,
                muscleGroup: item.muscle_group,
                exercise_data: item.exercise_data,
              }}
              index={index}
              onViewGif={(exerciseName, gifPath) => {
                setCurrentExercise(exerciseName);
                setGifPath(gifPath);
                setInfoModalVisible(true);
              }}
              gender={gender}
              selectedSets={selectedSets}
              onToggleSet={handleToggleSet}
              onUpdateSet={handleUpdateSet}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        <TouchableOpacity
          style={styles.saveWorkoutButton}
          onPress={() => {
            const hasSelectedSets = Object.values(selectedSets).some(
              (sets) => sets.length > 0
            );

            if (hasSelectedSets) {
              setIsSaveModalVisible(true);
            } else {
              showToast({
                type: "error",
                title: "No Sets Selected",
                desc: "Please select at least one set to save.",
              });
            }
          }}
        >
          <Text style={styles.saveWorkoutButtonText}>SAVE WORKOUT</Text>
          <Ionicons
            name="save-outline"
            size={20}
            color="#fff"
            style={styles.saveButtonIcon}
          />
        </TouchableOpacity>
      </>
    );
  };

  const renderGifModal = () => (
    <Modal visible={infoModalVisible} transparent animationType="fade">
      <View style={styles.gifModalOverlay}>
        <LinearGradient
          colors={["#B5D3EF", "#FFFFFF"]}
          style={styles.gifModalContent}
        >
          <View style={styles.gifModalHeader}>
            <TouchableOpacity
              style={styles.gifModalCloseButton}
              onPress={() => {
                setInfoModalVisible(false);
                setGifPath(null);
              }}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {gifPath ? (
            <Image
              source={{ uri: gifPath }}
              style={styles.gifImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.gifPlaceholder}>
              <Ionicons name="image-outline" size={80} color="#CCC" />
              <Text style={styles.gifPlaceholderText}>
                Animation Coming Soon!
              </Text>
            </View>
          )}

          <Text style={styles.gifModalTitle}>{currentExercise}</Text>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={isFilterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterModalContent}>
              <Text style={styles.modalTitle}>Filter by Muscle Group</Text>
              <ScrollView style={styles.muscleGroupsScrollView}>
                <View style={styles.muscleGroupsContainer}>
                  {muscleGroups.map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={[
                        styles.muscleGroupChip,
                        selectedMuscleGroups.includes(group) &&
                          styles.selectedMuscleGroupChip,
                      ]}
                      onPress={() => toggleMuscleGroupSelection(group)}
                    >
                      <Text
                        style={[
                          styles.muscleGroupChipText,
                          selectedMuscleGroups.includes(group) &&
                            styles.selectedMuscleGroupChipText,
                        ]}
                      >
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.filterModalButtons}>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyFiltersButton}
                  onPress={applyMuscleGroupFilter}
                >
                  <LinearGradient
                    colors={["#297DB3", "#5299DB"]}
                    style={styles.applyFiltersGradient}
                  >
                    <Text style={styles.applyFiltersButtonText}>Apply</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderInputModal = () => {
    const exercise = exercises.find((ex) => ex.name === currentExercise);
    if (!exercise) return null;

    const isMuscleGroupExercise = exercise.isMuscleGroup || false;
    const isBodyWeightExercise = exercise.isBodyWeight || false;

    return (
      <Modal visible={inputModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContentSave}>
                <Text style={styles.modalTitle2}>Enter Set Details</Text>
                <Text style={styles.exerciseSubtitle}>{currentExercise}</Text>

                {isMuscleGroupExercise ? (
                  <View style={styles.inputFieldsContainer}>
                    <View style={styles.inputField}>
                      <Ionicons
                        name="repeat"
                        size={20}
                        color="#297DB3"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Number of Reps"
                        keyboardType="phone-pad"
                        value={currentReps}
                        onChangeText={setCurrentReps}
                        placeholderTextColor="#999"
                      />
                    </View>

                    {!isBodyWeightExercise && (
                      <View style={styles.inputField}>
                        <FontAwesome5
                          name="weight"
                          size={18}
                          color="#297DB3"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Weight (kg)"
                          keyboardType="phone-pad"
                          value={currentWeight}
                          onChangeText={setCurrentWeight}
                          placeholderTextColor="#999"
                        />
                      </View>
                    )}
                  </View>
                ) : null}

                <View>
                  <Text style={styles.intensityLabel}>Workout Intensity</Text>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{
                        label: "Select Intensity",
                        value: null,
                      }}
                      onValueChange={(value) => setMET(value)}
                      value={MET}
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      style={pickerSelectStyles}
                      items={
                        isMuscleGroupExercise
                          ? [
                              { label: "Low Intensity", value: 4 },
                              { label: "Moderate Intensity", value: 6 },
                              { label: "High Intensity", value: 8 },
                            ]
                          : [
                              { label: "Low Intensity", value: 8 },
                              { label: "Moderate Intensity", value: 10 },
                              { label: "High Intensity", value: 12 },
                            ]
                      }
                      Icon={() => (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#666666"
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setInputModalVisible(false);
                      resetInputs();
                    }}
                  >
                    <Text style={styles.modalButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSetComplete}
                  >
                    <Text style={styles.modalButtonText}>SAVE SET</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderHistoricalModal = () => {
    const exercise = exercises.find((ex) => ex.name === currentExercise);
    if (!exercise) return null;

    const isCardioExercise = exercise.isCardio || false;
    const isMuscleGroupExercise = exercise.isMuscleGroup || false;
    const isBodyWeightExercise = exercise.isBodyWeight || false;

    return (
      <Modal
        visible={historicalInputVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoricalInputVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={(e) => {
                e.stopPropagation();
                setShowDatePicker(false);
              }}
            >
              <View style={styles.modalContentSave}>
                <Text style={styles.modalTitle}>Log Historical Workout</Text>
                <Text style={styles.exerciseSubtitle}>{currentExercise}</Text>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#297DB3" />
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                    maximumDate={new Date()}
                  />
                )}

                <ScrollView
                  ref={(ref) => setScrollViewRef(ref)}
                  style={styles.setsContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  {currentSets.map((set, index) => {
                    const showMuscleGroupInputs = isMuscleGroupExercise;

                    return (
                      <View
                        key={`set-input-${index}`}
                        style={styles.setInputContainer}
                      >
                        <View style={styles.setHeaderRow}>
                          <Text style={styles.setLabel}>Set {index + 1}</Text>
                          {index > 0 && (
                            <TouchableOpacity
                              onPress={() => deleteHistoricalSet(index)}
                              style={styles.deleteSetIcon}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={24}
                                color="#FF5757"
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        {showMuscleGroupInputs && (
                          <>
                            <View style={styles.inputField}>
                              <Ionicons
                                name="repeat"
                                size={20}
                                color="#297DB3"
                                style={styles.inputIcon}
                              />
                              <TextInput
                                style={styles.input}
                                placeholder="Number of Reps"
                                keyboardType="phone-pad"
                                value={set.reps}
                                onChangeText={(value) =>
                                  updateHistoricalSet(index, "reps", value)
                                }
                                placeholderTextColor="#999"
                              />
                            </View>

                            {!isBodyWeightExercise && (
                              <View style={styles.inputField}>
                                <FontAwesome5
                                  name="weight"
                                  size={18}
                                  color="#297DB3"
                                  style={styles.inputIcon}
                                />
                                <TextInput
                                  style={styles.input}
                                  placeholder="Weight (kg)"
                                  keyboardType="phone-pad"
                                  value={set.weight}
                                  onChangeText={(value) =>
                                    updateHistoricalSet(index, "weight", value)
                                  }
                                  placeholderTextColor="#999"
                                />
                              </View>
                            )}
                          </>
                        )}

                        <View style={styles.durationContainer}>
                          <View style={styles.durationHeader}>
                            <Text style={styles.durationLabel}>Duration</Text>
                          </View>

                          <View style={styles.radioButtonContainer}>
                            <TouchableOpacity
                              style={styles.radioButton}
                              onPress={() => {
                                const newUnits = { ...durationUnits };
                                newUnits[index] = "seconds";
                                setDurationUnits(newUnits);
                              }}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  (durationUnits[index] || "seconds") ===
                                    "seconds" && styles.radioCircleSelected,
                                ]}
                              >
                                {(durationUnits[index] || "seconds") ===
                                  "seconds" && (
                                  <View style={styles.radioInnerCircle} />
                                )}
                              </View>
                              <Text style={styles.radioLabel}>Seconds</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.radioButton}
                              onPress={() => {
                                const newUnits = { ...durationUnits };
                                newUnits[index] = "minutes";
                                setDurationUnits(newUnits);
                              }}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  durationUnits[index] === "minutes" &&
                                    styles.radioCircleSelected,
                                ]}
                              >
                                {durationUnits[index] === "minutes" && (
                                  <View style={styles.radioInnerCircle} />
                                )}
                              </View>
                              <Text style={styles.radioLabel}>Minutes</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.inputField}>
                            <Ionicons
                              name="stopwatch-outline"
                              size={20}
                              color="#297DB3"
                              style={styles.inputIcon}
                            />

                            <TextInput
                              style={styles.input}
                              placeholder={`Enter ${
                                durationUnits[index] || "seconds"
                              }`}
                              keyboardType="phone-pad"
                              value={set.duration}
                              onChangeText={(value) =>
                                updateHistoricalSet(index, "duration", value)
                              }
                              placeholderTextColor="#999"
                            />
                          </View>
                        </View>
                        <View>
                          <Text style={styles.intensityLabel}>
                            Workout Intensity
                          </Text>
                          <View style={styles.pickerContainer}>
                            <RNPickerSelect
                              placeholder={{
                                label: "Select Intensity",
                                value: null,
                              }}
                              onValueChange={(value) => setMET(value)}
                              value={MET}
                              pickerProps={{
                                itemStyle: {
                                  color: "#000000",
                                },
                              }}
                              style={pickerSelectStyles}
                              items={
                                isMuscleGroupExercise
                                  ? [
                                      { label: "Low Intensity", value: 4 },
                                      { label: "Moderate Intensity", value: 6 },
                                      { label: "High Intensity", value: 8 },
                                    ]
                                  : [
                                      { label: "Low Intensity", value: 8 },
                                      {
                                        label: "Moderate Intensity",
                                        value: 10,
                                      },
                                      { label: "High Intensity", value: 12 },
                                    ]
                              }
                              Icon={() => (
                                <Ionicons
                                  name="chevron-down"
                                  size={20}
                                  color="#666666"
                                />
                              )}
                              useNativeAndroidPickerStyle={false}
                              fixAndroidTouchableBug={true}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={addHistoricalSet}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#FFF"
                    style={styles.addButtonIcon}
                  />
                  <Text style={styles.addSetButtonText}>ADD SET</Text>
                </TouchableOpacity>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setHistoricalInputVisible(false);
                      resetInputs();
                    }}
                  >
                    <Text style={styles.modalButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleHistoricalSave}
                  >
                    <Text style={styles.modalButtonText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderSaveModal = () => (
    <Modal visible={isSaveModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlaySave}>
        <View style={styles.modalContentSave}>
          <View style={styles.saveModalHeader}>
            <FontAwesome5 name="check-circle" size={40} color="#FF5757" />
            <Text style={styles.saveModalTitle}>Save Workout</Text>
          </View>

          <Text style={styles.saveModalText}>
            Ready to save your workout? Your progress will be recorded{" "}
            {isInGym ? "and you'll earn XP rewards!" : "for your analysis"}
          </Text>

          {xpRewardVisible ? (
            <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
          ) : (
            ""
          )}

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsSaveModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={saveAllWorkouts}
            >
              <Text style={styles.modalButtonText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const hasActiveExercises = Object.keys(activeExercises).length > 0;

  return (
    <View style={styles.container}>
      <UnsavedChangesBackHandler
        hasUnsavedChanges={hasUnsavedSets()}
        enabled={true}
        onShowConfirmModal={() => setIsBackConfirmModalVisible(true)}
        routePath="/client/(workout)/machine"
      />

      {renderHeader()}
      {renderTabs()}
      {renderGymStatus()}

      {activeTab === "all" ? (
        renderExerciseList()
      ) : (
        <View style={styles.comingSoonContainer}>
          <Ionicons name="time-outline" size={80} color="#CCC" />
          <Text style={styles.comingSoonText}>One Tap Log</Text>
          <Text style={styles.comingSoonSubtext}>Coming Soon...</Text>
        </View>
      )}

      {xpRewardVisible && (
        <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
      )}

      {renderGifModal()}
      {renderFilterModal()}
      {renderInputModal()}
      {renderHistoricalModal()}
      {renderSaveModal()}

      {/* Back Confirmation Modal */}
      <Modal
        visible={isBackConfirmModalVisible}
        transparent
        animationType="slide"
      >
        <TouchableWithoutFeedback
          onPress={() => setIsBackConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <View style={styles.inputModalContent}>
                <View style={styles.modalHeaderDiscard}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsBackConfirmModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.saveModalHeader}>
                  <Ionicons name="warning-outline" size={40} color="#FF9500" />
                  <Text style={styles.saveModalTitle}>Unsaved Changes</Text>
                </View>

                <Text style={styles.saveModalText}>
                  You have unsaved workout data. Do you want to save your
                  progress before leaving?
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleConfirmBackNavigation}
                  >
                    <Text style={styles.cancelButtonText}>DISCARD</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveAllWorkouts}
                  >
                    <LinearGradient
                      colors={["#297DB3", "#5299DB"]}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>SAVE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  filterButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  activeTab: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FFF",
  },
  gymStatusContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  gymStatusGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 8,
  },
  gymStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#999",
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#666",
    marginTop: 20,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  gifModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  gifModalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  gifModalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  gifModalCloseButton: {
    padding: 5,
  },
  gifImage: {
    width: width * 0.8,
    height: height * 0.5,
    borderRadius: 15,
    marginBottom: 20,
  },
  gifPlaceholder: {
    width: width * 0.8,
    height: height * 0.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    marginBottom: 20,
  },
  gifPlaceholderText: {
    marginTop: 15,
    fontSize: 16,
    color: "#999",
  },
  gifModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  filterModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: width * 0.85,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  muscleGroupsScrollView: {
    maxHeight: height * 0.4,
    marginBottom: 20,
  },
  muscleGroupsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  muscleGroupChip: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
  },
  selectedMuscleGroupChip: {
    backgroundColor: "#297DB3",
    borderColor: "#297DB3",
  },
  muscleGroupChipText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  selectedMuscleGroupChipText: {
    color: "#FFF",
  },
  filterModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  applyFiltersButton: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  applyFiltersGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  inputModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  exerciseSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#297DB3",
    fontWeight: "600",
  },
  setsScrollView: {
    maxHeight: height * 0.35,
    marginBottom: 15,
  },
  setRow: {
    marginBottom: 15,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  setInputsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  setInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  addSetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#297DB3",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  saveModalHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  modalHeaderDiscard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#297DB3",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  saveModalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
  },
  modalContentSave: {
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
  modalTitle2: {
    color: "#000",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
  },
  modalTitle: {
    color: "#000",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
  },
  inputFieldsContainer: {
    marginVertical: 5,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  intensityLabel: {
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
    fontWeight: "400",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#297DB3",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  setsContainer: {
    maxHeight: height * 0.4,
    marginBottom: 15,
  },
  setInputContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
  },
  setHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  deleteSetIcon: {
    padding: 5,
  },
  durationContainer: {
    marginTop: 10,
  },
  durationHeader: {
    marginBottom: 8,
  },
  durationLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "400",
  },
  radioButtonContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 20,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#297DB3",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#297DB3",
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#297DB3",
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  addButtonIcon: {
    marginRight: 5,
  },
  modalOverlaySave: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveWorkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF ",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    shadowColor: "#374151",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveWorkoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  saveButtonIcon: {
    marginLeft: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    minWidth: 120,
  },
  inputAndroid: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    minWidth: 120,
  },
});

export default MachineExercises;
