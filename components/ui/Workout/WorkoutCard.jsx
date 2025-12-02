import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const WorkoutCard = ({
  title,
  subtitle,
  imagePath,
  onPress,
  buttonText = "",
  variant = "workout",
  textColor = "#297DB3",
  paraTextColor = "#00000075",
  buttonTextColor = "#000",
  bg1 = "#28A745",
  bg2 = "#297DB3",
  border1,
  border2,
  charWidth = 140,
  charHeight = 140,
  childComponent = null,
  extra,
  small = false,
  pt = false,
}) => {
  const isMealCard = variant === "meal";

  return (
    <TouchableOpacity
      style={[styles.card, extra && { marginBottom: 25 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[{ width: "100%", padding: 1, position: "relative" }]}>
        <LinearGradient
          colors={[bg1, bg2]}
          start={{ x: 0.2, y: 0.3 }}
          end={{ x: 0.25, y: 1.3 }}
          style={styles.contentContainer}
        >
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                isMealCard && styles.mealTitle,
                { color: textColor },
                pt && { marginBottom: 8 },
              ]}
            >
              {title}
            </Text>

            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  isMealCard && styles.mealSubtitle,
                  { color: paraTextColor },
                  small && { width: "95%" },
                ]}
              >
                {subtitle}
              </Text>
            )}

            {childComponent && childComponent}

            {buttonText && (
              <View style={styles.button}>
                <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                  {buttonText}
                </Text>
                <Ionicons
                  name={"arrow-forward"}
                  size={12}
                  color={buttonTextColor}
                  style={styles.icon}
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Image positioned outside to ensure visibility */}
      {imagePath && (
        <View style={styles.imageContainer}>
          <Image
            source={imagePath}
            style={[
              styles.workoutImage,
              { width: charWidth, height: charHeight },
            ]}
            resizeMode="contain"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width >= 768 ? width - 60 : width - 32,
    height: 150,
    borderRadius: 16,
    overflow: "visible",
    paddingTop: 25,
    position: "relative",
    marginBottom: 5, // Add space for overflowing image
    margin: "auto",
  },
  mealCard: {
    height: 100,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#fff",
    // iOS Shadow properties
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Android Shadow
    elevation: 8,
  },
  textContainer: {
    height: "100%",
    maxWidth: "70%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    color: "#000",
    marginTop: 4,
    width: "100%",
  },
  mealTitle: {
    fontSize: 16,
    color: "",
  },
  mealSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  imageContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  workoutImage: {
    // Image styling
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  icon: {
    marginLeft: 4,
  },
});

export default WorkoutCard;
