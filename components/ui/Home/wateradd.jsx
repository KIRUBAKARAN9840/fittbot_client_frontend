import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  ClientWeightUpdateNewAPI,
  clientWaterTrackerAPI,
} from "../../../services/clientApi";
import MaskedView from "@react-native-masked-view/masked-view";
import { showToast } from "../../../utils/Toaster";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 375;
const GLASS_VOLUME = 200;

const HomeWaterTrackerCard = ({ onChangeTab }) => {
  const [waterGoal, setWaterGoal] = useState(null);
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [litersConsumed, setLitersConsumed] = useState("0.0");
  const [fillAnimation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWaterData();
  }, []);

  useEffect(() => {
    if (waterConsumed !== null && waterGoal !== null) {
      const fillPercentage = Math.min(waterConsumed / waterGoal, 1);

      Animated.timing(fillAnimation, {
        toValue: fillPercentage,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();

      // Update liters consumed
      const liters = ((waterConsumed * GLASS_VOLUME) / 1000).toFixed(1);
      setLitersConsumed(liters);
    }
  }, [waterConsumed, waterGoal]);

  const loadWaterData = async () => {
    setLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");

      if (!clientId) {
        fallbackToLocalStorage();
        return;
      }

      const payload = {
        gym_id: gymId ? gymId : null,
        client_id: clientId,
      };

      const response = await clientWaterTrackerAPI(payload);

      if (response?.status === 200) {
        const apiWaterGoal =
          response.data.target_actual.water_intake.target * 1000;
        const goalInGlasses = Math.round(apiWaterGoal / GLASS_VOLUME);
        setWaterGoal(goalInGlasses);

        const apiWaterConsumed = response.data.target_actual.water_intake.actual
          ? response.data.target_actual.water_intake.actual * 1000
          : 0;
        const consumedInGlasses = Math.round(apiWaterConsumed / GLASS_VOLUME);
        setWaterConsumed(consumedInGlasses);
      } else {
        console.error("API error:", response?.detail);
        fallbackToLocalStorage();
      }
    } catch (error) {
      console.error("Error loading water data:", error);
      fallbackToLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToLocalStorage = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem("waterGoal");
      const savedConsumed = await AsyncStorage.getItem("waterConsumed");

      if (savedGoal) setWaterGoal(parseInt(savedGoal));
      if (savedConsumed) setWaterConsumed(parseInt(savedConsumed));
    } catch (error) {
      console.error("Error with local water data:", error);
    }
  };

  const updateWater = async (newValue) => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const floatValue = (newValue * 0.2).toFixed(1);

      const payload = {
        client_id: clientId,
        gym_id: gymId ? gymId : null,
        type: "water",
        actual_water: floatValue,
      };

      const response = await ClientWeightUpdateNewAPI(payload);

      if (response?.status !== 200) {
        console.error("API error:", response?.detail);
      }
    } catch (error) {
      console.error("Error updating water consumption:", error);
    }
  };

  const handleAddWater = async () => {
    if (waterConsumed < waterGoal) {
      const newValue = waterConsumed + 1;
      setWaterConsumed(newValue);
      updateWater(newValue);
    }
  };

  const handleRemoveWater = async () => {
    if (waterConsumed > 0) {
      const newValue = waterConsumed - 1;
      setWaterConsumed(newValue);
      updateWater(newValue);
    }
  };

  const isGoalReached = waterConsumed >= waterGoal;
  const progressPercent = waterGoal
    ? Math.min(Math.round((waterConsumed / waterGoal) * 100), 100)
    : 0;

  if (loading || waterGoal === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading water data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <LinearGradient
          colors={["rgba(91, 43, 155, 0.09)", "rgba(255, 60, 123, 0.09)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <MaskedView
            maskElement={
              <Text style={styles.cardTitle}>Daily Water Intake</Text>
            }
          >
            <LinearGradient
              colors={["#5B2B9B", "#FF3C7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 20 }}
            >
              <Text style={[styles.cardTitle, { opacity: 0 }]}>
                Daily Water Intake
              </Text>
            </LinearGradient>
          </MaskedView>
        </LinearGradient>
        <View style={styles.contentContainer}>
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRemoveWater}
              disabled={waterConsumed === 0}
            >
              <LinearGradient
                colors={
                  waterConsumed === 0
                    ? ["#FFD0E0", "#FFA0C0"]
                    : ["#FFA0C0", "#FF50A0"]
                }
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonSymbol}>−</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.centerSection}>
            <View style={styles.waterBottleContainer}>
              <View style={styles.bottleTop}>
                <View style={styles.bottleCap} />
                <View style={styles.bottleNeck} />
              </View>

              <View style={styles.waterBottle}>
                {/* Bottle Lines - Rendered from top to bottom */}
                <View style={[styles.bottleLine, { top: "15%" }]} />
                <View style={[styles.bottleLine, { top: "30%" }]} />
                <View style={[styles.bottleLine, { top: "45%" }]} />
                <View style={[styles.bottleLine, { top: "60%" }]} />
                <View style={[styles.bottleLine, { top: "75%" }]} />

                {/* Water Fill - Bottom portion with wavy top */}
                <Animated.View
                  style={[
                    styles.waterFill,
                    {
                      height: fillAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["10%", "90%"],
                      }),
                    },
                  ]}
                >
                  <View style={styles.waterFillTop}>
                    <View style={styles.wave} />
                    <View style={styles.wave} />
                    <View style={styles.wave} />
                  </View>
                  <View style={styles.waterFillBody} />
                </Animated.View>
              </View>
            </View>
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddWater}
              disabled={isGoalReached}
            >
              <LinearGradient
                colors={
                  isGoalReached
                    ? ["#FFD0E0", "#FFA0C0"]
                    : ["#FFA0C0", "#FF50A0"]
                }
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonSymbol}>+</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.waterAmount}>{litersConsumed} ltr</Text>
        {/* <Text style={styles.waterLabel}>Daily Water Intake</Text> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 7,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    // padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 150,
    overflow: Platform.OS === "ios" ? "visible" : "hidden",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  leftSection: {
    width: 40,
    alignItems: "center",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  rightSection: {
    width: 40,
    alignItems: "center",
  },
  waterBottleContainer: {
    height: 85,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  bottleTop: {
    alignItems: "center",
    height: 15,
    marginBottom: -1,
    zIndex: 1,
  },
  bottleCap: {
    width: 12,
    height: 6,
    backgroundColor: "#D0D0D0",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bottleNeck: {
    width: 20,
    height: 8,
    backgroundColor: "#D0D0D0",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  waterBottle: {
    height: 60,
    width: 44,
    borderRadius: 6,
    backgroundColor: "#F8F8F8",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
  bottleLine: {
    position: "absolute",
    width: "100%",
    height: 4,
    backgroundColor: "#E0E0E0",
    left: 0,
    zIndex: 1,
  },
  waterFill: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    backgroundColor: "#9C2E9E",
    // borderTopLeftRadius: 6,
    // borderTopRightRadius: 6,
    overflow: "hidden",
  },
  waterFillTop: {
    flexDirection: "row",
    height: 5,
    position: "absolute",
    top: -2,
    left: 0,
    right: 0,
  },
  wave: {
    height: 5,
    width: 12,
    backgroundColor: "#9C2E9E",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  waterFillBody: {
    flex: 1,
    backgroundColor: "#9C2E9E",
  },
  waterAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
    textAlign: "center",
  },
  waterLabel: {
    fontSize: 14,
    width: "100%",
    color: "#FF5757",
    textAlign: "center",
    // color: "#666",
    fontWeight: "500",
  },
  actionButton: {
    width: 25,
    height: 25,
  },
  actionButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    lineHeight: 26,
  },
  loadingText: {
    textAlign: "center",
    color: "#5C7099",
    paddingVertical: 20,
  },
  cardHeader: {
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default HomeWaterTrackerCard;
