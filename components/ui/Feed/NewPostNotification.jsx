import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardScreenWidth = 392;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const NewPostNotification = ({ visible, onPress }) => {
  const [expanded, setExpanded] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(40)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const hasInitialized = useRef(false);

  // Reset animation values
  const resetAnimations = () => {
    opacity.setValue(0);
    widthAnim.setValue(40);
    textOpacity.setValue(0);
    setExpanded(false);
    setShowText(false);
    isClosing.current = false;
  };

  // Opening sequence
  const openSequence = () => {
    setIsAnimating(true);
    // 1. Fade in the circular button
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // 2. Expand to rectangle
      setExpanded(true);
      Animated.timing(widthAnim, {
        toValue: responsiveWidth(40),
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        // 3. Fade in text
        setShowText(true);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setIsAnimating(false);
        });
      });
    });
  };

  // Closing sequence
  const closeSequence = (callback) => {
    if (isClosing.current) return;
    isClosing.current = true;
    setIsAnimating(true);

    // 1. Fade out text
    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setShowText(false);
      // 2. Shrink to circle
      Animated.timing(widthAnim, {
        toValue: 56,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setExpanded(false);
        // 3. Fade out circle
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setIsAnimating(false);
          isClosing.current = false;
          hasInitialized.current = false;
          resetAnimations();
          if (callback) callback();
        });
      });
    });
  };

  useEffect(() => {
    // Handle visibility changes
    if (
      visible &&
      !isAnimating &&
      !isClosing.current &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;
      resetAnimations(); // Reset animation values to ensure clean state
      openSequence();
    } else if (!visible && !isClosing.current && hasInitialized.current) {
      closeSequence();
    }
  }, [visible]);

  const handlePress = () => {
    // Start close sequence and then call onPress callback with delay
    closeSequence(() => {
      // Call onPress (getAllPosts) after animation completes
      if (onPress) {
        onPress();
      }
    });
  };

  // Don't render if not visible and not animating
  if (!visible && !isAnimating) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: opacity,
            width: widthAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <MaterialIcons name="post-add" size={18} color="#FFF" />

          {showText && (
            <Animated.Text
              style={[styles.buttonText, { opacity: textOpacity }]}
            >
              New post available
            </Animated.Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: responsiveHeight(3),
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  buttonContainer: {
    // height: 30,
    paddingVertical: 12,

    borderRadius: 28,
    backgroundColor: "#02396D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: responsiveFontSize(12),
    marginLeft: 12,
  },
});

export default NewPostNotification;
