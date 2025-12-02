import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendFeedbackAPI } from "../../services/clientApi";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");

const CATEGORIES = [
  { id: "Product", icon: "cube-outline" },
  { id: "Service", icon: "call-outline" },
  { id: "Gym", icon: "business-outline" },
  { id: "Equipment", icon: "barbell-outline" },
  { id: "Trainer", icon: "person-circle-outline" },
  { id: "Other", icon: "help-circle-outline" },
];

const ClientFeedback = ({ navigation }) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [successMsg, setSuccessMsg] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <FontAwesome
              name={star <= rating ? "star" : "star-o"}
              size={26}
              color={star <= rating ? "#FFD700" : "#ddd"}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const sendFeedback = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId || !gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        client_id: clientId,
        tag: selectedCategory,
        ratings: rating,
        feedback,
      };

      const response = await sendFeedbackAPI(payload);
      if (response?.status === 200) {
        setSuccessMsg("Feedback Submitted Successfully");
        setSelectedCategory("");
        setFeedback("");
        setRating(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => setSuccessMsg(null));
          }, 1000);
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
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <View style={[styles.header]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/client/home")}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Feedback</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Title */}

          <Text style={styles.subtitle}>
            Help your gym to improve your experience
          </Text>

          {/* Categories */}
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={category.icon} size={20} color="#007BFF" />
                </View>
                <Text style={styles.categoryText}>{category.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>Rate your experience</Text>
            {renderStars()}
          </View>

          <View style={styles.feedbackContainer}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us more about your experience (optional)"
              placeholderTextColor="#aaa"
              multiline={true}
              numberOfLines={4}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || !rating) && styles.submitButtonDisabled,
            ]}
            onPress={sendFeedback}
            disabled={!selectedCategory || !rating}
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
          {successMsg && (
            <Modal transparent animationType="fade" visible={true}>
              <View style={styles.modalBackground}>
                <Animated.View
                  style={[styles.successContainer, { opacity: fadeAnim }]}
                >
                  <Text style={styles.successText}>{successMsg}</Text>
                </Animated.View>
              </View>
            </Modal>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ClientFeedback;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 5,
    minHeight: height - 100,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryCard: {
    width: (width - 60) / 2,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedCategory: {
    borderColor: "#007BFF",
    borderWidth: 2,
    backgroundColor: "#F0F8FF",
  },
  iconContainer: {
    marginBottom: 8,
  },
  categoryText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "400",
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  star: {
    marginHorizontal: 2,
  },
  feedbackContainer: {
    marginBottom: 25,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    minHeight: 110,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#B0D5FF",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  successContainer: {
    backgroundColor: "#007BFF",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  successText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 30,
  },
});
