import React, { useState, useEffect } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { toIndianISOString } from "../../../utils/basicUtilFunctions";
import {
  clientWaterTrackerAPI,
  ClientWeightUpdateAPI,
} from "../../../services/clientApi";
import FitnessLoader from "../FitnessLoader";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 375;
const GLASS_VOLUME = 200;
const MAX_WATER_GOAL_ML = 5000;

const WaterTracker = () => {
  const [loading, setLoading] = useState(true);
  const [waterGoal, setWaterGoal] = useState(null);
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [fillAnimation] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalML, setNewGoalML] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inputError, setInputError] = useState("");
  const [waveAnimation] = useState(new Animated.Value(0));

  const updateWater = async (resetPayload) => {
    try {
      const response = await ClientWeightUpdateAPI(resetPayload);
      if (response?.status === 200) {
      } else {
        alert(
          response?.detail || "Something Went Wrong.Please try again later"
        );
      }
    } catch (error) {
      alert("Something Went Wrong.Please try again later");
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    const loadData = async () => {
      setLoading(true);
      try {
        const currentDate = toIndianISOString(new Date()).split("T")[0];
        const lastAccessDate = await AsyncStorage.getItem("lastAccessDate");

        const gymId = await AsyncStorage.getItem("gym_id");
        const clientId = await AsyncStorage.getItem("client_id");
        if (!gymId || !clientId) {
          alert("Error Loading Page");
          return;
        }
        const payload = {
          gym_id: gymId,
          client_id: clientId,
        };

        const response = await clientWaterTrackerAPI(payload);
        if (response?.status === 200) {
          const apiWaterGoal =
            response.data.target_actual.water_intake.target * 1000;
          setWaterGoal(Math.round(apiWaterGoal / GLASS_VOLUME));
          const apiWaterConsumed = response.data.target_actual.water_intake
            .actual
            ? response.data.target_actual.water_intake.actual * 1000
            : 0;

          if (lastAccessDate !== currentDate) {
            await AsyncStorage.setItem("lastAccessDate", currentDate);
            let resetPayload = {
              client_id: clientId,
              gym_id: gymId,
              type: "water",
              actual_water: 0,
            };
            setWaterConsumed(0);
            await updateWater(resetPayload);
          } else {
            if (apiWaterGoal)
              setWaterGoal(Math.round(apiWaterGoal / GLASS_VOLUME));
            if (apiWaterConsumed !== undefined)
              setWaterConsumed(Math.round(apiWaterConsumed / GLASS_VOLUME));
          }
        } else {
          alert(
            response?.detail || "Something Went Wrong.Please try again later"
          );
        }
      } catch (error) {
        alert("Error loading water data");
        fallbackToLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    const fallbackToLocalStorage = async () => {
      try {
        const currentDate = toIndianISOString(new Date()).split("T")[0];
        const lastAccessDate = await AsyncStorage.getItem("lastAccessDate");
        const savedGoal = await AsyncStorage.getItem("waterGoal");

        if (savedGoal) setWaterGoal(parseInt(savedGoal));

        if (lastAccessDate !== currentDate) {
          await AsyncStorage.setItem("lastAccessDate", currentDate);
          setWaterConsumed(0);
          await AsyncStorage.setItem("waterConsumed", "0");
        } else {
          const savedConsumed = await AsyncStorage.getItem("waterConsumed");
          if (savedConsumed) setWaterConsumed(parseInt(savedConsumed));
        }

        setLoading(false);
      } catch (error) {
        alert("Error with water data");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("waterGoal", waterGoal.toString());
        await AsyncStorage.setItem("waterConsumed", waterConsumed.toString());
      } catch (error) {
        alert("Error saving water data");
      }
    };

    if (!loading) {
      saveData();
    }
  }, [waterGoal, waterConsumed, loading]);

  useEffect(() => {
    const fillPercentage = Math.min(waterConsumed / waterGoal, 1);

    Animated.timing(fillAnimation, {
      toValue: fillPercentage,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [waterConsumed, waterGoal]);

  const handleAddWater = async () => {
    if (waterConsumed < waterGoal) {
      const newValue = waterConsumed + 1;
      setWaterConsumed(newValue);
      try {
        const clientId = await AsyncStorage.getItem("client_id");
        const gymId = await AsyncStorage.getItem("gym_id");
        if (!clientId) {
          alert("Error Adding Water Data");
          return;
        }
        const floatvalue = (newValue * 0.2).toFixed(1);
        const type = "water";
        const payload = {
          client_id: clientId,
          gym_id: gymId,
          type: type,
          actual_water: floatvalue,
        };
        await updateWater(payload);
      } catch (error) {
        alert("Error updating water consumption:");
      }
    }
  };

  const handleRemoveWater = async () => {
    if (waterConsumed > 0) {
      const newValue = waterConsumed - 1;
      setWaterConsumed(newValue);
      try {
        const clientId = await AsyncStorage.getItem("client_id");
        const gymId = await AsyncStorage.getItem("gym_id");
        if (!clientId) {
          alert("Error Removing Water Data");
          return;
        }
        const floatvalue = (newValue * 0.2).toFixed(1);
        const type = "water";
        const payload = {
          client_id: clientId,
          gym_id: gymId,
          type: type,
          actual_water: floatvalue,
        };
        await updateWater(payload);
      } catch (error) {
        alert("Error updating water consumption:");
      }
    }
  };

  const handlebulkWater = async (glassnum) => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");
      if (!clientId) {
        alert("Error Modifying Water Data");
        return;
      }
      const floatvalue = (glassnum * 0.2).toFixed(1);
      const type = "water";
      const payload = {
        client_id: clientId,
        gym_id: gymId,
        type: type,
        actual_water: floatvalue,
      };
      await updateWater(payload);
    } catch (error) {
      alert("Error updating water consumption:");
    }
  };

  const validateGoalInput = (text) => {
    setNewGoalML(text);

    if (!text) {
      setInputError("");
      return;
    }

    const value = parseInt(text);
    if (isNaN(value)) {
      setInputError("Please enter a valid number");
    } else if (value > MAX_WATER_GOAL_ML) {
      setInputError(`Maximum goal is ${MAX_WATER_GOAL_ML}ml`);
    } else if (value <= 0) {
      setInputError("Goal must be greater than 0");
    } else {
      setInputError("");
    }
  };

  const updateWaterGoal = async () => {
    if (!newGoalML || isNaN(parseInt(newGoalML))) {
      setInputError("Please enter a valid number");
      return;
    }

    const value = parseInt(newGoalML);
    if (value > MAX_WATER_GOAL_ML) {
      setInputError(`Maximum goal is ${MAX_WATER_GOAL_ML}ml`);
      return;
    }

    if (value <= 0) {
      setInputError("Goal must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const newGoalInML = value;
      const newGoalInGlasses = Math.round(newGoalInML / GLASS_VOLUME);

      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");
      if (!clientId) {
        alert("Error Setting Water Goal");
        return;
      }
      const floatvalue = (newGoalInML / 1000).toFixed(1);
      const type = "water";
      const payload = {
        client_id: clientId,
        gym_id: gymId,
        type: type,
        target_water: floatvalue,
      };
      await updateWater(payload);

      setWaterGoal(newGoalInGlasses);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setSubmitting(false);
      setNewGoalML("");
      setInputError("");
    }
  };

  const isGoalReached = waterConsumed >= waterGoal;
  const isGoalInputValid =
    newGoalML &&
    !isNaN(parseInt(newGoalML)) &&
    parseInt(newGoalML) <= MAX_WATER_GOAL_ML &&
    parseInt(newGoalML) > 0;

  const renderGlassIndicators = () => {
    const maxGlassesPerRow = 5;
    const rows = Math.ceil(waterGoal / maxGlassesPerRow);

    let indicators = [];
    let glassCount = 0;

    for (let row = 0; row < rows; row++) {
      const glassesInThisRow = Math.min(
        maxGlassesPerRow,
        waterGoal - row * maxGlassesPerRow
      );
      let rowGlasses = [];

      for (let i = 0; i < glassesInThisRow; i++) {
        const currentGlassNum = glassCount + 1;
        const isFilled = currentGlassNum <= waterConsumed;

        rowGlasses.push(
          <TouchableOpacity
            key={`glass-${currentGlassNum}`}
            style={styles.glassIndicator}
            onPress={() => {
              if (currentGlassNum <= waterConsumed) {
                setWaterConsumed(currentGlassNum - 1);
                handlebulkWater(currentGlassNum - 1);
              } else {
                setWaterConsumed(currentGlassNum);
                handlebulkWater(currentGlassNum);
              }
            }}
          >
            <FontAwesome5
              name="glass-whiskey"
              size={24}
              color={isFilled ? "#1D7BFF" : "#A0C1E8"}
            />
            {(currentGlassNum % 5 === 0 || currentGlassNum === waterGoal) && (
              <Text style={styles.glassIndicatorLabel}>
                {currentGlassNum * GLASS_VOLUME}ml
              </Text>
            )}
          </TouchableOpacity>
        );

        glassCount++;
      }

      indicators.push(
        <View key={`row-${row}`} style={styles.glassRow}>
          {rowGlasses}
        </View>
      );
    }

    return indicators;
  };

  if (loading) {
    return <FitnessLoader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F9FF" />
      <LinearGradient
        colors={["#F5F9FF", "#E8F1FF"]}
        style={styles.mainWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* <View style={styles.headerSection}>
                            <Text style={styles.pageTitle}>Water Tracker</Text>
                            <Text style={styles.pageSubtitle}>Stay hydrated and healthy</Text>
                        </View> */}

            {/* Glass Indicators */}
            <View style={styles.glassIndicatorsContainer}>
              <View style={styles.top}>
                <Text style={styles.sectionTitle}>Your Progress</Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="settings-outline" size={20} color="#1D7BFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.glassIndicatorsWrapper}>
                {renderGlassIndicators()}
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Quick Add</Text>
              <View style={styles.quickActionButtons}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    waterConsumed === 0 && styles.disabledButton,
                  ]}
                  onPress={handleRemoveWater}
                  disabled={waterConsumed === 0}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={24}
                    color={waterConsumed === 0 ? "#A0A0A0" : "#FF5757"}
                  />
                  <Text
                    style={[
                      styles.quickActionText,
                      waterConsumed === 0 && styles.disabledText,
                    ]}
                  >
                    Remove Glass
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    isGoalReached && styles.disabledButton,
                  ]}
                  onPress={handleAddWater}
                  disabled={isGoalReached}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={isGoalReached ? "#A0A0A0" : "#1D7BFF"}
                  />
                  <Text
                    style={[
                      styles.quickActionText,
                      isGoalReached && styles.disabledText,
                    ]}
                  >
                    Add Glass
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {isGoalReached ? (
              <LinearGradient
                colors={["#33B0FF", "#007AFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusCard}
              >
                <View style={styles.statusCardContent}>
                  <Ionicons name="trophy" size={30} color="#FFFFFF" />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusCardTitle}>Goal Complete!</Text>
                    <Text style={styles.statusCardText}>
                      You've hit your daily water target
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.statusCard}>
                <View style={styles.statusCardContent}>
                  <Ionicons name="water-outline" size={30} color="#1D7BFF" />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.remainingTitle}>
                      {waterGoal - waterConsumed} more to go
                    </Text>
                    <Text style={styles.remainingText}>
                      Keep hydrating! You're doing great
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setNewGoalML("");
          setInputError("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Daily Water Goal</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewGoalML("");
                  setInputError("");
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter target amount in milliliters (ml)
            </Text>
            <Text style={styles.modalLimit}>
              Maximum: {MAX_WATER_GOAL_ML}ml
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.modalInput,
                  inputError ? styles.inputError : null,
                ]}
                keyboardType="numeric"
                placeholder="e.g., 2000"
                value={newGoalML}
                onChangeText={validateGoalInput}
              />
              <Text style={styles.inputUnit}>ml</Text>
            </View>

            {inputError ? (
              <Text style={styles.errorText}>{inputError}</Text>
            ) : null}

            <View style={styles.presetButtons}>
              <Text style={styles.presetLabel}>Quick Select:</Text>
              <View style={styles.presetButtonsRow}>
                {[1000, 1500, 2000, 2500, 3000].map((value) => (
                  <TouchableOpacity
                    key={`preset-${value}`}
                    style={styles.presetButton}
                    onPress={() => validateGoalInput(value.toString())}
                  >
                    <Text style={styles.presetButtonText}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.glassesInfoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#1D7BFF"
              />
              <Text style={styles.glassesInfoText}>
                Each glass equals {GLASS_VOLUME}ml
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                (!isGoalInputValid || submitting) &&
                  styles.modalSubmitButtonDisabled,
              ]}
              onPress={updateWaterGoal}
              disabled={!isGoalInputValid || submitting}
            >
              <Text style={styles.modalSubmitButtonText}>
                {submitting ? "Updating..." : "Set Goal"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    marginTop: 20,
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: isSmallScreen ? 16 : 24,
    paddingTop: 10,
  },
  headerSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: "700",
    color: "#FF5757",
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: "#5C7099",
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: "600",
    color: "#0A2463",
    marginBottom: 10,
  },

  // Progress Circle
  progressCircleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  progressCircleWrapper: {
    width: isSmallScreen ? 150 : 180,
    height: isSmallScreen ? 150 : 180,
    borderRadius: 100,
    backgroundColor: "#E9F0FC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  progressInnerCircle: {
    position: "absolute",
    width: isSmallScreen ? 130 : 160,
    height: isSmallScreen ? 130 : 160,
    borderRadius: 100,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentage: {
    fontSize: isSmallScreen ? 28 : 36,
    fontWeight: "700",
    color: "#0A2463",
    marginBottom: 4,
  },
  progressInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  progressInfo: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: "600",
    color: "#1D7BFF",
    marginLeft: 4,
  },
  mlCounter: {
    fontSize: isSmallScreen ? 12 : 14,
    color: "#5C7099",
  },

  // Goal Container
  goalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
  },
  goalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F0FC",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  settingsButtonText: {
    color: "#1D7BFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  goalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  goalInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#5C7099",
  },

  // Glass Indicators
  glassIndicatorsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
  },
  glassIndicatorsWrapper: {
    width: "100%",
  },
  glassRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  glassIndicator: {
    alignItems: "center",
    marginRight: 12,
    marginBottom: 8,
  },
  glassIndicatorLabel: {
    fontSize: 10,
    color: "#5C7099",
    marginTop: 2,
  },

  // Quick Actions
  quickActionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
  },
  quickActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F5FF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1D7BFF",
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: "#F5F5F5",
  },
  disabledText: {
    color: "#A0A0A0",
  },

  // Status Cards
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
    overflow: "hidden",
  },
  statusCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statusCardText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  remainingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D7BFF",
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 12,
    color: "#5C7099",
  },

  // Benefits Card
  benefitsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A2463",
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: "#5C7099",
    marginLeft: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A2463",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#5C7099",
    marginBottom: 4,
  },
  modalLimit: {
    fontSize: 14,
    color: "#FF5757",
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
  },
  inputUnit: {
    position: "absolute",
    right: 15,
    color: "#5C7099",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#FF5757",
  },
  errorText: {
    color: "#FF5757",
    fontSize: 14,
    marginBottom: 15,
  },
  presetButtons: {
    marginVertical: 15,
  },
  presetLabel: {
    fontSize: 14,
    color: "#5C7099",
    marginBottom: 8,
  },
  presetButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  presetButton: {
    backgroundColor: "#E9F0FC",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  presetButtonText: {
    color: "#1D7BFF",
    fontSize: 14,
  },
  glassesInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  glassesInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#5C7099",
  },
  modalSubmitButton: {
    backgroundColor: "#1D7BFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#A0C1E8",
  },
  modalSubmitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
});

export default WaterTracker;
