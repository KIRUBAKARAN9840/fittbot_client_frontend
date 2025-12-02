import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import PremiumBadge from "../../Payment/premiumbadge";
import {
  handleFreemiumAccess,
  isPureFreemium,
  isPurePremium,
} from "../../../../config/access";

const WorkoutSummaryCard = ({
  title = "Today's Workout Stats",
  message = "You crushed it! That's one step closer to your strongest self.",
  duration,
  calories,
  points,
  gender,
  plan,
  onStartPress = () => {},
  onKnowMorePress = () => {},
}) => {
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const openInfoModal = () => {
    setIsInfoModalVisible(true);
  };
  const router = useRouter();

  const closeInfoModal = () => {
    setIsInfoModalVisible(false);
  };
  const routeTo = () => {
    handleFreemiumAccess(plan, "/client/workout");
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={routeTo}
      activeOpacity={1}
    >
      <View style={styles.contentContainer}>
        {/* Left side: Title, message and stats */}
        <View style={styles.infoContainer}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
                // marginBottom: 10,
              }}
            >
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={openInfoModal}>
                <Image
                  source={require("../../../../assets/images/icons/info.png")}
                  style={{ width: 16, height: 16 }}
                />
              </TouchableOpacity>
            </View>
            <Text>
              {" "}
              {isPureFreemium(plan) && (
                <Image
                  source={require("../../../../assets/images/lock.png")}
                  style={{ width: 16, height: 16 }}
                />
              )}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            {/* Duration */}
            <View style={styles.statItem}>
              <View style={styles.durationIcon}>
                <Image
                  source={require("../../../../assets/images/clockbig.png")}
                  style={styles.icons}
                />
              </View>
              <View style={styles.statsInside}>
                <Text style={styles.statValueMiddle}>Gym Time</Text>
                <LinearGradient
                  colors={["#FFFFFF", "#FFFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientContainer}
                >
                  <MaskedView
                    maskElement={
                      <Text style={styles.statValue}>
                        {duration && isPurePremium(plan) ? duration : "NA"}
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={["#323232", "#323232"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      // style={{ height: 20 }}
                    >
                      <Text style={[styles.statValue, { opacity: 0 }]}>
                        {duration && isPurePremium(plan) ? duration : "NA"}
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                  {/* <Text style={styles.statValue}>
                    {duration ? duration : "NA"}
                  </Text> */}
                </LinearGradient>
              </View>
            </View>

            {/* Calories */}
            <View style={styles.statItem}>
              <View style={styles.caloriesIcon}>
                <Image
                  source={require("../../../../assets/images/caloriesbig.png")}
                  style={styles.iconsCalories}
                />
              </View>
              <View style={styles.statsInside}>
                <Text style={styles.statValueMiddle}>Calories Burnt</Text>
                <LinearGradient
                  colors={["#FFFFFF", "#FFFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientContainer}
                >
                  <MaskedView
                    maskElement={
                      <Text style={styles.statValue}>
                        {calories && isPurePremium(plan) ? calories : "0"} Cals
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={["#323232", "#323232"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      // style={{ height: 20 }}
                    >
                      <Text style={[styles.statValue, { opacity: 0 }]}>
                        {calories && isPurePremium(plan) ? calories : "0"} Cals
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                  {/* <Text style={styles.statValue}>
                    {calories ? calories : "0"} Cals
                  </Text> */}
                </LinearGradient>
              </View>
            </View>

            {/* Points */}
            <View style={styles.statItem}>
              <View style={styles.pointsIcon}>
                <Image
                  source={require("../../../../assets/images/weightbig.png")}
                  style={styles.icons}
                />
              </View>
              <View style={styles.statsInside}>
                <Text style={styles.statValueMiddle}>Total Volume</Text>
                <LinearGradient
                  colors={["#FFFFFF", "#FFFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientContainer}
                >
                  <MaskedView
                    maskElement={
                      <Text style={styles.statValue}>
                        {points && isPurePremium(plan) ? points : "0"} kg
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={["#323232", "#323232"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      // style={{ height: 20 }}
                    >
                      <Text style={[styles.statValue, { opacity: 0 }]}>
                        {points && isPurePremium(plan) ? points : "0"} kg
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                  {/* <Text style={styles.statValue}>
                    {points ? points : "0"} kg
                  </Text> */}
                </LinearGradient>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Info Modal */}
      <Modal
        transparent={true}
        visible={isInfoModalVisible}
        animationType="fade"
        onRequestClose={closeInfoModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeInfoModal}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Today's Workout Stats</Text>
              <TouchableOpacity
                onPress={closeInfoModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {/* Gym Time Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <Image
                    source={require("../../../../assets/images/clockbig.png")}
                    style={styles.modalIcon}
                  />
                  <Text style={styles.infoTitle}>Gym Time</Text>
                </View>
                <Text style={styles.infoDescription}>
                  This shows the total time you spent in the gym today. It's
                  calculated from the time you Punched in to the Gym and the
                  time you Punched out from the Gym.
                </Text>
              </View>

              {/* Calories Burnt Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <Image
                    source={require("../../../../assets/images/caloriesbig.png")}
                    style={styles.modalIconCalories}
                  />
                  <Text style={styles.infoTitle}>Calories Burnt</Text>
                </View>
                <Text style={styles.infoDescription}>
                  Total calories burnt today based on your workout logs and
                  exercises performed. This calculation takes into account the
                  intensity, duration, and type of exercises you completed
                  during your gym session.
                </Text>
              </View>

              {/* Total Volume Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <Image
                    source={require("../../../../assets/images/weightbig.png")}
                    style={styles.modalIcon}
                  />
                  <Text style={styles.infoTitle}>Total Volume</Text>
                </View>
                <Text style={styles.infoDescription}>
                  Total weight lifted today, calculated by multiplying the
                  weight by the number of sets for each exercise (Weight ×
                  Sets). This metric helps track your strength training progress
                  and overall workout intensity.
                </Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    paddingVertical: 10,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoContainer: {
    flex: 3,
    paddingRight: 10,
    justifyContent: "space-between",
  },
  actionContainer: {
    flex: 2,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  gradientContainer: {
    paddingVertical: 3,
    minWidth: 65,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  message: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 7,
    lineHeight: 20,
    fontStyle: "normal",
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    width: "33%",
    flexDirection: "column",
    gap: 25,
    alignItems: "center",
    marginRight: 7,
    marginBottom: 8,
    marginTop: 25,
  },
  icons: {
    width: 71,
    height: 73,
    resizeMode: "contain",
  },
  iconsCalories: {
    width: 58,
    height: 73,
  },
  durationIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  caloriesIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  pointsIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  statValue: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "500",
    textAlign: "center",
  },
  statValueMiddle: {
    fontSize: 12,
    color: "#919191",
    fontWeight: "400",
  },
  statsInside: {
    flexDirection: "column",
    gap: 5,
    alignItems: "center",
  },
  knowMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  knowMoreText: {
    color: "#0066FF",
    fontSize: 12,
    fontWeight: "500",
    marginRight: 4,
  },
  illustration: {
    width: 150,
    height: 170,
    position: "absolute",
    right: -18,
    bottom: -27,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  closeButton: {
    padding: 5,
  },
  infoSection: {
    marginBottom: 5,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  modalIcon: {
    width: 25,
    height: 25,
    marginRight: 14,
    resizeMode: "contain",
  },
  modalIconCalories: {
    width: 25,
    height: 30,
    marginRight: 12,
    resizeMode: "contain",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    marginLeft: 42,
  },
  noteSection: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#666666",
  },
});

export default WorkoutSummaryCard;
