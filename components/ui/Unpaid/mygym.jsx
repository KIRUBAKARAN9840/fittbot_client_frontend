import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addPunchInAPI,
  addPunchOutAPI,
  getInStatusAPI,
  getPunchedInDetailsAPI,
} from "../../../services/clientApi";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { showToast } from "../../../utils/Toaster";

const { width, height } = Dimensions.get("window");
const muscleGroups = ["Chest", "Shoulders", "Legs", "Back", "Arms", "Abs"];
const ALLOWED_DISTANCE = 500;
export default function MyGymComponent({ gymData }) {
  const [isInGym, setIsInGym] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEntryModalVisible, setEntryModalVisible] = useState(false);
  const [isExitModalVisible, setExitModalVisible] = useState(false);
  const [isExitConfirmModalVisible, setExitConfirmModalVisible] =
    useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gymLocation, setGymLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isInGym) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInGym, punchInTime]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (punchInTime) {
      try {
        const [hours, minutes, seconds] = punchInTime.split(":").map(Number);
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

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedTime(0);
  };

  useFocusEffect(
    useCallback(() => {
      checkGymPresence();

      (async () => {
        try {
          let { status } = await requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setErrorMsg("Permission to access location was denied");
          }
        } catch (err) {
          setErrorMsg("Error requesting location permission");
        }
      })();
    }, [])
  );

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

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGymEntry = async () => {
    if (checkingLocation) return;
    setErrorMsg(null);
    setCheckingLocation(true);
    try {
      const position = await getCurrentPositionAsync({
        accuracy: Platform.OS === "android" ? 1 : 0,
        maximumAge: 10000,
        timeout: 5000,
      });

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
        setSelectedMuscles([]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Location Error",
        desc: "Could not get your location. Please try again.",
      });
      setEntryModalVisible(false);
    } finally {
      setCheckingLocation(false);
    }
  };
  const checkGymPresence = async () => {
    setLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const response = await getInStatusAPI(clientId);
      setIsInGym(
        response?.status === 200 ? response?.attendance_status : false
      );
      if (response?.status === 200 && response?.attendance_status) {
        const gymDetailsResponse = await getPunchedInDetailsAPI(
          clientId,
          gymData?.gym_id
        );
        if (gymDetailsResponse?.status === 200) {
          setPunchInTime(gymDetailsResponse?.in_time);
          setGymLocation(gymDetailsResponse?.gym_location);
        }
      } else {
        const gymDetailsResponse = await getPunchedInDetailsAPI(
          clientId,
          gymData?.gym_id
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
  const punchIn = async () => {
    setLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const payload = {
        client_id: clientId,
        gym_id: gymData?.gym_id,
        muscle: selectedMuscles,
      };

      const response = await addPunchInAPI(payload);

      if (response?.status === 200) {
        const currentTime = new Date();
        await checkGymPresence();
        setIsInGym(true);
        setEntryModalVisible(false);
        showToast({
          type: "success",
          title: "Success",
          desc: "Successfully punched in!",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch in!",
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
      setLoading(false);
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

    try {
      const payload = {
        client_id: clientId,
        gym_id: gymData?.gym_id,
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
          desc: response?.detail || "Failed to punchout",
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
          color="#FFF"
          style={styles.gymButtonIcon}
        />
        <View>
          <Text style={styles.gymButtonText}>Gym Entry</Text>
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
          style={styles.gymButtonIcon}
        />
        <Text style={styles.gymButtonText}>Gym Exit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEntryModal = () => (
    <Modal
      visible={isEntryModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEntryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Muscle Groups</Text>
          <Text style={styles.modalSubtitle}>
            Which areas are you planning to workout today?
          </Text>

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
              }}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                selectedMuscles.length === 0 && styles.disabledConfirmButton,
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
      </View>
    </Modal>
  );

  const renderExitConfirmModal = () => (
    <Modal
      visible={isExitConfirmModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setExitConfirmModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
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
      </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.gymInfoCard}>
        <View style={styles.gymInfoHeader}>
          <FontAwesome5 name="dumbbell" size={20} color="#FF5757" />
          <Text style={styles.gymInfoHeaderText}>Your Gym</Text>
        </View>

        <Text style={styles.gymName}>{gymData?.gym_name || "Your Gym"}</Text>
        <Text style={styles.gymLocation}>
          {gymData?.gym_location || "Location not available"}
        </Text>

        <View style={styles.divider} />

        {renderWorkoutTimer()}
        {renderGymEntryExitButtons()}
      </View>

      {renderEntryModal()}
      {renderExitConfirmModal()}
      {renderExitModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
  },
  gymInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  gymInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  gymInfoHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginLeft: 8,
  },
  gymName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  gymLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  gymButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.03,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 80,
    marginTop: 10,
  },
  gymButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 0.48,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  entryButton: {
    backgroundColor: "#4CAF50",
  },
  exitButton: {
    backgroundColor: "#F44336",
  },
  disabledGymButton: {
    opacity: 0.5,
  },
  gymButtonIcon: {
    marginRight: 6,
  },
  gymButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
    margin: 6,
  },
  selectedMuscleGroupItem: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
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
    backgroundColor: "#FF5757",
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
    borderColor: "#FF5757",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  exitModalText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF5757",
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
});
