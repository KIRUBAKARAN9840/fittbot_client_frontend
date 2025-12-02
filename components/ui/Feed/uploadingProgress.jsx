import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const UploadingButton = ({ isUploading, uploadStatus }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isUploading) {
      // Entrance animation
      Animated.spring(fadeAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Continuous subtle bounce effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Dots animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnimation, {
            toValue: 3,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(dotsAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      // Exit animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Stop animations
      bounceAnim.stopAnimation();
      dotsAnimation.stopAnimation();
      bounceAnim.setValue(1);
      dotsAnimation.setValue(0);
    }

    return () => {
      fadeAnim.stopAnimation();
      bounceAnim.stopAnimation();
      dotsAnimation.stopAnimation();
    };
  }, [isUploading]);

  if (!isUploading) return null;

  // Render dots based on the animated value
  const renderDots = () => {
    const dotValue = Math.floor(dotsAnimation._value || 0);
    if (dotValue === 1) return ".";
    if (dotValue === 2) return "..";
    if (dotValue === 3) return "...";
    return "";
  };

  return (
    <Animated.View
      style={[
        styles.uploadingButtonContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
            { scale: bounceAnim },
          ],
        },
      ]}
    >
      <View style={styles.uploadingButton}>
        <MaterialIcons name="cloud-upload" size={20} color="white" />
        <Text style={styles.uploadingText}>
          {uploadStatus}
          <Text>{renderDots()}</Text>
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  uploadingButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? responsiveHeight(6) : responsiveHeight(3),
    alignSelf: "center",
    zIndex: 1000,
    maxWidth: responsiveWidth(70),
  },
  uploadingButton: {
    backgroundColor: "#02396D",
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  uploadingText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
    marginLeft: responsiveWidth(2),
  },
});

export default UploadingButton;
