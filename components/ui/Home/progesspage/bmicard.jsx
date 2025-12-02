import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import useHealthConnect from "../../../../hooks/useHealthConnect";
import {
  isFittbotPremium,
  isGymPremium,
  isPureFreemium,
  isPurePremium,
} from "../../../../config/access";
import JoinGym from "../../Payment/joingym";
import PremiumBadge from "../../Payment/premiumbadge";
import { useRouter } from "expo-router";

const HomeBMICard = ({
  bmi = 18.0,
  steps: propSteps = 2001,
  goal: propGoal,
  distance: propDistance = 1.5,
  plan,
}) => {
  const {
    isAvailable,
    hasPermission,
    stepsData,
    isLoading,
    error,
    setupHealthConnect,
    checkPermission,
  } = useHealthConnect();

  const [showSetup, setShowSetup] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const router = useRouter();
  // Set default goal to 10000
  const goal = propGoal || 10000;

  // Use Health Connect steps if available and permission granted, otherwise use prop steps
  const steps =
    Platform.OS === "android" && hasPermission ? stepsData : propSteps;

  // Calculate distance from steps (average: 1 step = 0.0008 km)
  const distance =
    Platform.OS === "android" && hasPermission
      ? (steps * 0.0008).toFixed(1)
      : propDistance;

  useEffect(() => {
    if (Platform.OS === "android") {
      setShowSetup(!hasPermission && isAvailable);
      setShowRefresh(false);
    }
  }, [hasPermission, isAvailable]);

  const handleSetup = async () => {
    const granted = await setupHealthConnect();
    if (granted) {
      // Permission granted directly, no need for refresh
      setShowSetup(false);
      setShowRefresh(false);
    } else {
      // Opened settings, hide setup and show only refresh button
      setShowSetup(false);
      setShowRefresh(true);
    }
  };

  const handleRefresh = async () => {
    const granted = await checkPermission();
    if (granted) {
      setShowSetup(false);
      setShowRefresh(false);
    } else {
      // Permission still not granted, go back to setup button
      setShowSetup(true);
      setShowRefresh(false);
    }
  };
  const createCircularArc = (percentage, radius = 45) => {
    const startAngle = -90;
    const endAngle = startAngle + percentage * 360;

    const centerX = 50;
    const centerY = 50;
    const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    if (percentage === 0) return "";
    if (percentage >= 1) {
      // For 100%, create a full circle using two arcs
      const midX = centerX + radius;
      const midY = centerY;
      return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${midX} ${midY} A ${radius} ${radius} 0 0 1 ${startX} ${startY}`;
    }

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const stepPercentage = Math.min(steps / goal, 1);

  const goTo = () => {
    if (isPurePremium(plan) || Platform.OS === "ios") {
      return;
    } else {
      router.push("/client/subscription");
    }
  };
  return (
    <TouchableOpacity style={styles.container} activeOpacity={1}>
      <View style={[styles.card, { height: isGymPremium(plan) ? 130 : 175 }]}>
        <LinearGradient
          colors={["#FFFFFF", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <MaskedView
            maskElement={<Text style={styles.cardTitle}>Steps Count</Text>}
          >
            <LinearGradient
              colors={["#1A1A1A", "#1A1A1A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 20 }}
            >
              <Text style={[styles.cardTitle, { opacity: 0 }]}>
                Steps Count
              </Text>
            </LinearGradient>
          </MaskedView>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {/* {isPurePremium(plan) ? ( */}
          {/* // Coming Soon button for both Android and iOS */}
          <View style={styles.setupSection}>
            <TouchableOpacity
              style={styles.comingSoonButton}
              activeOpacity={0.7}
            >
              <Text style={styles.comingSoonButtonText}>Coming Soon</Text>
            </TouchableOpacity>
          </View>
          {/* ) : (
            <View style={styles.progressSection}>
              <View style={styles.circleContainer}>
                <Svg width="70" height="70" viewBox="0 0 100 100">
              
                  <Circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#E5E5E5"
                    strokeWidth="8"
                    fill="none"
                  />

                 
                  <Path
                    d={createCircularArc(stepPercentage, 45)}
                    stroke="#FF5757"
                    strokeLinecap="round"
                    strokeWidth="8"
                    fill="none"
                  />
                </Svg>

             
                <View style={styles.circleContent}>
                  <Image
                    source={require("../../../../assets/images/steps.png")}
                    style={styles.stepsIcon}
                  />
                </View>
              </View>
            </View>
          )} */}
        </View>
        {/* {isPureFreemium(plan) && (
          <View style={{ marginBottom: 10, alignItems: "center" }}>
            <PremiumBadge size={12} get={true} />
            <Text style={{ fontSize: 12 }}>& unlock this feature</Text>
          </View>
        )} */}

        {!isGymPremium(plan) && (
          <View
            style={{
              marginBottom: 10,
              alignItems: "center",
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ fontSize: 12, textAlign: "center" }}>
              Keep Track of your daily step count.
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    // padding: 7,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 130,
    overflow: Platform.OS === "ios" ? "visible" : "hidden",
  },
  cardHeader: {
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: Platform.OS === "ios" ? 1 : 0,
    borderBottomColor: "#ddd",
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "normal",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  progressSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  circleContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stepsIcon: {
    width: 20,
    height: 23,
    marginBottom: 2,
    tintColor: "#FF5757",
  },
  stepsCount: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  infoPanel: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRadius: 4,
    minWidth: 70,
    justifyContent: "space-around",
  },
  infoLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "400",
    minWidth: 25,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "500",
    color: "#3B3B3B",
    marginLeft: 5,
  },
  unitText: {
    fontSize: 9,
    color: "rgba(59,59,59,0.5)",
    fontWeight: "normal",
  },
  setupSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  setupButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "#FF5757",
  },
  setupButtonText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "bold",
  },
  setupSubText: {
    color: "#FF5757",
    fontSize: 9,
    fontWeight: "500",
    marginTop: 2,
  },
  instructionText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  refreshButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "#5B2B9B",
    marginTop: 0,
  },
  refreshButtonText: {
    color: "#5B2B9B",
    fontSize: 14,
    fontWeight: "bold",
  },
  comingSoonButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    borderWidth: 2,
    borderColor: "#FF5757",
  },
  comingSoonButtonText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default HomeBMICard;
