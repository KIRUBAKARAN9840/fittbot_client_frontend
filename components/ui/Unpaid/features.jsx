import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
  Modal,
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { availFreeTrial } from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import * as SecureStore from "expo-secure-store";

const features = [
  {
    id: "1",
    title: "Smart Workout Tracking",
    description: "Data-driven routines with real-time analytics",
    icon: "analytics-outline",
    iconType: "Ionicons",
    color: "#FF5757",
  },
  {
    id: "2",
    title: "QR-Based Gym Integration",
    description: "Scan equipment for guided exercises and automatic tracking",
    icon: "qrcode",
    iconType: "FontAwesome5",
    color: "#4CAF50",
  },
  {
    id: "3",
    title: "Live Gym Data & Trends",
    description: "Monitor gym occupancy, muscle group trends, and peak hours",
    icon: "trending-up",
    iconType: "MaterialIcons",
    color: "#2196F3",
  },
  {
    id: "4",
    title: "On-Demand Nutritionist Support",
    description: "Personalized meal plans from certified experts",
    icon: "food-apple",
    iconType: "MaterialCommunityIcons",
    color: "#9C27B0",
  },
  {
    id: "5",
    title: "Gamification & Community Engagement",
    description: "Leaderboards, challenges, and milestone tracking",
    icon: "trophy",
    iconType: "FontAwesome5",
    color: "#FFC107",
  },
  {
    id: "6",
    title: "E-commerce Marketplace",
    description: "One-stop shop for fitness supplements, accessories, and gear",
    icon: "shopping-cart",
    iconType: "MaterialIcons",
    color: "#795548",
  },
  {
    id: "7",
    title: "Real-Time Performance Metrics",
    description: "Monitor intensity zones and optimize workouts",
    icon: "fitness-center",
    iconType: "MaterialIcons",
    color: "#673AB7",
  },
];

const renderIcon = (icon, type, color) => {
  switch (type) {
    case "MaterialIcons":
      return <MaterialIcons name={icon} size={32} color={color} />;
    case "Ionicons":
      return <Ionicons name={icon} size={32} color={color} />;
    case "FontAwesome5":
      return <FontAwesome5 name={icon} size={28} color={color} />;
    case "MaterialCommunityIcons":
      return <MaterialCommunityIcons name={icon} size={32} color={color} />;
    default:
      return <Ionicons name={icon} size={32} color={color} />;
  }
};

const FeaturesComponent = ({
  onViewPlans,
  joinedGym,
  freeTrail,
  gym_id,
  daysLeft,
}) => {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAvailPress = () => {
    setShowConfirmModal(true);
  };

  const onAvailPress = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      const client_id = await AsyncStorage.getItem("client_id");
      const payload = {
        client_id,
      };
      const response = await availFreeTrial(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Free Trial Availed Successfully...",
        });
        await AsyncStorage.setItem("gym_id", response?.data?.gym_id.toString());
        await AsyncStorage.setItem(
          "gym_name",
          response?.data?.gym_name.toString()
        );
        await AsyncStorage.setItem("gender", response?.data?.gender.toString());

        router.push({
          pathname: "/client/home",
          params: {
            tab: "My Progress",
          },
        });
      } else {
        alert(response?.detail || "Unable to avail free trial");
      }
    } catch (err) {
      alert("Unable to avail free trial. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  const ConfirmationModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showConfirmModal}
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color="#5B2B77" />
              <Text style={styles.modalTitle}>Confirm Free Trial</Text>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to avail the free trial? This will activate
              your trial period and you'll get access to all premium features.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={onAvailPress}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#5B2B77", "#FF3C7B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>
                    {isLoading ? "Processing..." : "Yes, Avail Trial"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const FeatureItem = ({ item, index }) => {
    const delay = index * 100;
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={delay}
        style={styles.featureCard}
        useNativeDriver
      >
        <View
          style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}
        >
          {renderIcon(item.icon, item.iconType, item.color)}
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureDescription}>{item.description}</Text>
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.contentContainer}>
      <ConfirmationModal />

      <FlatList
        data={features}
        renderItem={FeatureItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.featuresList}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={["#DED5EB", "#FFD8EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.weightGradient}
            >
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeTitle}>Welcome to Fittbot !!</Text>
                <Text style={styles.welcomeMessage}>
                  Your personal fitness companion for a smarter, more effective
                  fitness experience.
                </Text>
              </View>
            </LinearGradient>

            {freeTrail && Platform.OS !== "ios" && gym_id && (
              <LinearGradient
                colors={["#5B2B77", "#FF3C7B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.trialContainer}
              >
                <View style={styles.trialContent}>
                  <Text style={styles.trialTitle}>
                    {daysLeft > 0
                      ? `${daysLeft} Day${
                          daysLeft > 1 ? "s" : ""
                        } Left in Free Trial`
                      : "Free Trial Ended"}
                  </Text>
                  {daysLeft > 0 && (
                    <Text style={styles.trialSubtitle}>
                      Unlock full access to premium features!
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={handleAvailPress}
                    style={styles.trialButton}
                    disabled={isLoading}
                  >
                    <Text style={styles.trialButtonText}>
                      {isLoading
                        ? "Processing..."
                        : daysLeft > 0
                        ? "Avail Now"
                        : "View Plans"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            <Animatable.View
              animation="fadeIn"
              delay={300}
              style={styles.featureHeader}
              useNativeDriver
            >
              <Text style={styles.featureHeaderTitle}>
                Enhance Your Fitness Journey now with us
              </Text>
              {Platform.OS === "ios" ? (
                ""
              ) : (
                <Text style={styles.featureHeaderSubtitle}>
                  Subscribe to enjoy all the powerful features designed to
                  elevate your Fitness experience
                </Text>
              )}
            </Animatable.View>
          </>
        }
        ListFooterComponent={
          <Animatable.View
            animation="fadeInUp"
            style={styles.subscriptionCTA}
            useNativeDriver
          >
            <Text style={styles.subscriptionCTAText}>
              {Platform.OS === "ios"
                ? "Your Personal Fitness Companion"
                : "Ready to experience all these features?"}
            </Text>
            {Platform.OS === "ios" ? (
              ""
            ) : (
              <TouchableOpacity
                style={styles.subscribeCTAButton}
                activeOpacity={0.7}
                onPress={onViewPlans}
              >
                <LinearGradient
                  colors={["#5B2B77", "#FF3C7B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.innerContent}>
                    <MaskedView
                      maskElement={
                        <Text style={styles.maskedText}>SUBSCRIBE NOW</Text>
                      }
                    >
                      <LinearGradient
                        colors={["#5B2B77", "#FF3C7B"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={[styles.maskedText, { opacity: 0 }]}>
                          SUBSCRIBE NOW
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animatable.View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  featuresList: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  welcomeContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  welcomeContent: {
    flex: 3,
  },
  welcomeImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  welcomeHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9C4",
    padding: 10,
    borderRadius: 8,
  },
  welcomeHighlightText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    flex: 1,
  },
  featureHeader: {
    marginVertical: 20,
  },
  featureHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  featureHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  subscriptionCTA: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    alignItems: "center",
  },
  subscriptionCTAText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  viewPlansButton: {
    borderRadius: 25,
    marginBottom: 10,
    width: "100%",
    overflow: "hidden",
  },
  viewPlansGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  viewPlansButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  subscribeCTAButton: {
    borderRadius: 25,
    width: "100%",
    overflow: "hidden",
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 25,
  },
  innerContent: {
    backgroundColor: "#fff",
    borderRadius: 23,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  maskedText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  subscribeCTAButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  weightGradient: {
    borderRadius: 20,
    padding: 20,
  },
  trialContainer: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  trialContent: {
    alignItems: "center",
  },
  trialTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  trialSubtitle: {
    color: "#f9f9f9",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  trialButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  trialButtonText: {
    color: "#5B2B77",
    fontWeight: "600",
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButton: {
    overflow: "hidden",
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default FeaturesComponent;
