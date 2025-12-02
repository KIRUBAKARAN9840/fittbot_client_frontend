import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Modal,
  TouchableWithoutFeedback,
  Text,
  TouchableOpacity,
} from "react-native";

import WorkoutCard from "../Workout/WorkoutCard";
import WorkoutSelectionModal from "../Workout/WorkoutSelectionModal";
import { isPureFreemium } from "../../../config/access";
import { useUser } from "../../../context/UserContext";
import PremiumBadge from "../Payment/premiumbadge";

const { width, height } = Dimensions.get("window");

const DietSelection = ({ gender }) => {
  const router = useRouter();
  const { plan } = useUser();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  const goalTypes = [
    {
      id: "weight_loss",
      title: "Weight Loss",
      subtitle: "Lose Fat & Get Lean",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/extreme.png")
          : require("../../../assets/images/workout/extreme_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goal",
      color: "#FF5757",
    },
    {
      id: "weight_gain",
      title: "Weight Gain",
      subtitle: "Build Muscle & Size",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/inter.png")
          : require("../../../assets/images/workout/inter_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goal",
      color: "#28A745",
    },
    {
      id: "body_recomposition",
      title: "Body Recomposition",
      subtitle: "Lose Fat & Gain Muscle",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/diet/def_char_3.png")
          : require("../../../assets/images/diet/def_char_3_f.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "goal",
      color: "#007BFF",
    },
  ];

  const weightLossIntensity = [
    {
      id: "mild",
      title: "Mild Cut",
      subtitle: "0.5-1kg/month",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/diet/mild_cut.png")
          : require("../../../assets/images/workout/ath_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "intensity",
      color: "#FFB84D",
    },
    {
      id: "moderate",
      title: "Moderate Cut",
      subtitle: "1-3kg/month",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/power.png")
          : require("../../../assets/images/workout/power_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "intensity",
      color: "#FF8C42",
    },
    {
      id: "aggressive",
      title: "Aggressive Cut",
      subtitle: "3-4kg/month",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/major.png")
          : require("../../../assets/images/workout/major_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "intensity",
      color: "#FF5757",
    },
  ];

  const weightGainIntensity = [
    {
      id: "lean_bulk",
      title: "Lean Bulk",
      subtitle: "0.5-1kg/month",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/exp.png")
          : require("../../../assets/images/workout/exp-female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "intensity",
      color: "#90EE90",
    },
    {
      id: "steady_bulk",
      title: "Steady Bulk",
      subtitle: "1-3kg/month",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/ath.png")
          : require("../../../assets/images/workout/ath_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "intensity",
      color: "#32CD32",
    },
    {
      id: "power_bulk",
      title: "Power Bulk",
      subtitle: "3-4kg/month",
      imagePath:
        gender?.toLowerCase() === "male"
          ? require("../../../assets/images/workout/inter.png")
          : require("../../../assets/images/workout/inter_female.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "intensity",
      color: "#228B22",
    },
  ];

  const foodCategory = [
    {
      id: "veg_south_indian",
      title: "Vegetarian Food",
      subtitle: "South Indian",
      imagePath: require("../../../assets/images/diet/veg_icon.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "food",
      color: "#28A745",
    },
    {
      id: "veg_north_indian",
      title: "Vegetarian Food",
      subtitle: "North Indian",
      imagePath: require("../../../assets/images/diet/veg_icon.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "food",
      color: "#28A745",
    },
    {
      id: "non_veg_south_indian",
      title: "Non-Vegetarian Food",
      subtitle: "South Indian",
      imagePath: require("../../../assets/images/diet/non_veg_icon.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "food",
      color: "#FF5757",
    },
    {
      id: "non_veg_north_indian",
      title: "Non-Vegetarian Food",
      subtitle: "North Indian",
      imagePath: require("../../../assets/images/diet/non_veg_icon.png"),
      backGroundPath: require("../../../assets/images/diet/bot_icon.png"),
      key: "food",
      color: "#FF5757",
    },
  ];

  // Modal visibility states
  const [showGoalTypeCard, setShowGoalTypeCard] = useState(false);
  const [showIntensityCard, setShowIntensityCard] = useState(false);
  const [showFoodCategory, setShowFoodCategory] = useState(false);

  const [selections, setSelections] = useState({
    goal_type: "",
    intensity: "",
    food_category: "",
  });

  const [step, setStep] = useState(1);

  const handleModalClick = (type) => {
    if (isPureFreemium(plan)) {
      if (Platform.OS === "ios") {
        setPremiumModalVisible(true);
      } else {
        router.push("/client/subscription");
      }
    } else {
      if (type === "kyraAI") {
        router.push("/client/myListedFoodLogs");
      } else if (type === "default") {
        setShowGoalTypeCard(!showGoalTypeCard);
      } else if (type === "personal") {
        router.push({
          pathname: "/client/personalTemplate",
          params: { method: "personal" },
        });
      }
    }
  };

  const handleSelection = async (type, value) => {
    // Step 1: Goal Type Selection
    if (showGoalTypeCard) {
      setShowGoalTypeCard(false);
      setSelections((prev) => ({ ...prev, goal_type: value }));

      // If body recomposition, skip intensity step and go directly to food category
      if (value === "body_recomposition") {
        setShowFoodCategory(true);
        setStep(3);
      } else {
        setShowIntensityCard(true);
        setStep(2);
      }
    }

    // Step 2: Intensity Selection (only for weight loss/gain)
    else if (showIntensityCard) {
      setShowIntensityCard(false);
      setShowFoodCategory(true);
      setSelections((prev) => ({ ...prev, intensity: value }));
      setStep(3);
    }

    // Step 3: Food Category Selection (Final Step)
    else if (showFoodCategory) {
      setShowFoodCategory(false);
      const finalSelections = {
        ...selections,
        food_category: value,
      };

      router.push({
        pathname: "/client/newDefaultTemplateLogFoodPage",
        params: finalSelections,
      });
    }
  };

  // Get intensity options based on goal type
  const getIntensityOptions = () => {
    if (selections.goal_type === "weight_loss") {
      return weightLossIntensity;
    } else if (selections.goal_type === "weight_gain") {
      return weightGainIntensity;
    }
    return [];
  };

  const renderSelectionButtons = () => {
    return (
      <ScrollView style={styles.selectionButtonsContainer}>
        {/* <WorkoutCard
          title={"Scan and Log with KyraAI"}
          subtitle={"Easily Scan, Track, and Log Your Meals with Smart KyraAI"}
          imagePath={
            gender.toLowerCase() == "male"
              ? require("../../../assets/images/diet/char_12.png")
              : require("../../../assets/images/diet/char_12.png")
          }
          buttonText="Scan Food"
          onPress={() => router.push("/client/foodscanner")}
          textColor={"#000000"}
          paraTextColor={"#00000081"}
          buttonTextColor={"#28A745"}
          bg1={"#fff"}
          bg2={"#28a74620"}
          border1={"#28a74629"}
          border2={"#297eb32f"}
          charWidth={110}
          charHeight={105}
          small
        /> */}
        <WorkoutCard
          title={"Log Food with Kyra AI"}
          subtitle={"Easily Scan , Chat and Log Your Meals with Smart KyraAI"}
          imagePath={
            gender.toLowerCase() == "male"
              ? require("../../../assets/images/diet/char_13.png")
              : require("../../../assets/images/diet/char_7.png")
          }
          buttonText="Add Food"
          onPress={() => handleModalClick("kyraAI")}
          textColor={"#000000"}
          paraTextColor={"#00000081"}
          buttonTextColor={"#28A745"}
          bg1={"#fff"}
          bg2={"#28a74620"}
          border1={"#28a74629"}
          border2={"#297eb32f"}
          charWidth={100}
        />

        <WorkoutCard
          title={"Fittbot Default Template"}
          subtitle={"Template designed for smart food logging"}
          imagePath={
            gender.toLowerCase() === "male"
              ? require("../../../assets/images/diet/char_14.png")
              : require("../../../assets/images/diet/char_14.png")
          }
          buttonText="Add Food"
          onPress={() => handleModalClick("default")}
          textColor={"#000000"}
          paraTextColor={"#00000081"}
          buttonTextColor={"#28A745"}
          bg1={"#fff"}
          bg2={"#28a74620"}
          border1={"#28a74629"}
          border2={"#297eb32f"}
          charWidth={125}
          charHeight={120}
        />

        <WorkoutCard
          title={"Create Your Own Template"}
          subtitle={
            "Easily create templates based on your food, fitness, and habits.."
          }
          imagePath={
            gender.toLowerCase() === "male"
              ? require("../../../assets/images/diet/char_15.png")
              : require("../../../assets/images/diet/char_8.png")
          }
          buttonText="Add Food"
          onPress={() => handleModalClick("personal")}
          textColor={"#000000"}
          paraTextColor={"#00000081"}
          buttonTextColor={"#28A745"}
          bg1={"#fff"}
          bg2={"#28a74620"}
          border1={"#28a74629"}
          border2={"#297eb32f"}
          charWidth={100}
          extra
        />
      </ScrollView>
    );
  };

  const handleKyraAIPress = () => {
    // Add haptic feedback if available
    if (Platform.OS === "ios") {
      // Add iOS haptic feedback if needed
    }

    //

    // Navigate to KyraAI page
    router.push("/client/(workout)/kyraAI");
  };

  return (
    <View style={styles.container}>
      {renderSelectionButtons()}
      {/* <KyraAIFloatingButton
        onPress={handleKyraAIPress}
        position="bottom-left" // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        size="small" // 'small', 'medium', 'large'
        showBadge={false}
        // badgeText="NEW"
        colors={["#D9D9D9", "#737373"]} // Custom gradient colors
        style={{ bottom: Platform.OS === "ios" ? 190 : 130 }} // Additional custom positioning
        message={"Hi, I'm KyraAI\nYour Personal Diet Coach"}
        boxColor={["#28A745", "#007BFF"]}
      /> */}

      {/* Step 1: Goal Type Modal */}
      <WorkoutSelectionModal
        visible={showGoalTypeCard}
        setCurrentModalType={setShowGoalTypeCard}
        items={goalTypes}
        handleSelection={handleSelection}
        colors={["#E6F2FE", "#E9F6ED"]}
        textColor={"#424242"}
        arrowColor={"#007bff7d"}
        height={125}
      />

      {/* Step 2: Intensity Modal (only for weight loss/gain) */}
      <WorkoutSelectionModal
        visible={showIntensityCard}
        setCurrentModalType={setShowIntensityCard}
        items={getIntensityOptions()}
        handleSelection={handleSelection}
        colors={["#E6F2FE", "#E9F6ED"]}
        textColor={"#424242"}
        arrowColor={"#007bff7d"}
        height={125}
      />

      {/* Step 3: Food Category Modal */}
      <WorkoutSelectionModal
        visible={showFoodCategory}
        setCurrentModalType={setShowFoodCategory}
        items={foodCategory}
        handleSelection={handleSelection}
        colors={["#E6F2FE", "#E9F6ED"]}
        textColor={"#424242"}
        arrowColor={"#007bff7d"}
        height={"25"}
        width={"25"}
        step={step}
        icon={step === 3}
        imageStyle={{
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

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
  sectionContainer: {
    flex: 1,
    padding: width * 0.04,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02,
    marginTop: height * 0.03,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  selectionButtonsContainer: {
    padding: width * 0.04,
    marginTop: 10,
  },
  selectionButton: {
    marginBottom: height * 0.02,
    borderRadius: 15,
    overflow: "hidden",
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
  dateSelector: {
    padding: width * 0.04,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: width * 0.04,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF5757",
  },
  currentTimeText: {
    color: "#666",
  },
  searchInput: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  mostCommon: {
    fontSize: 14,
    color: "#666",
    padding: 10,
    fontWeight: "700",
  },
  foodList: {
    flex: 1,
  },
  noResultsText: {
    textAlign: "center",
    fontSize: 14,
    width: "75%",
    alignSelf: "center",
    marginTop: 20,
    color: "#666",
  },
  foodItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedFoodItem: {
    borderColor: "#FF5757",
    backgroundColor: "#E3F2FD",
  },
  foodItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  foodTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  foodItemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  foodItemSubTitle: {
    fontSize: 11,
  },
  foodItemNutrition: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  nutritionText: {
    fontSize: 14,
    color: "#666",
  },
  quantityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 14,
    color: "#666",
  },
  individualQuantityInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 4,
    width: 50,
    textAlign: "center",
    marginLeft: 8,
    fontSize: 14,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  saveButtonContainer: {
    padding: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "white",
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  templateList: {
    padding: 10,
  },
  templateItem: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  templateHeader: {
    padding: 15,
  },
  templateTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: "600",
  },
  templateMacros: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  templateDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 15,
  },
  templateDishItem: {
    marginBottom: 15,
  },
  dishInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  dishName: {
    fontSize: 16,
  },
  dishMacros: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 20,
  },
  macroText: {
    fontSize: 14,
    color: "#666",
  },
  vegIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
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

export default DietSelection;
