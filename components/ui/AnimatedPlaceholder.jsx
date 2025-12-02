import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TextInput,
  Animated,
  Easing,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

const AnimatedPlaceholder = ({
  style,
  onChangeText,
  value,
  placeholderTextColor,
  onFocus,
  onBlur,
  autoFocus,
  ...rest
}) => {
  const foods = [
    "chicken",
    "mutton",
    "broccoli",
    "rice",
    "salmon",
    "tofu",
    "eggs",
    "avocado",
    "quinoa",
    "almonds",
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState(foods[0]);
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const foodIndex = useRef(0);
  const textInputRef = useRef(null);
  const intervalRef = useRef(null);
  const animationRef = useRef(null);

  // Memoize the animation function to prevent recreating on every render
  const animateToNextFood = useCallback(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Fade out current text
    animationRef.current = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    });

    animationRef.current.start((finished) => {
      if (finished) {
        // Update to next food only after animation completes
        requestAnimationFrame(() => {
          foodIndex.current = (foodIndex.current + 1) % foods.length;
          setCurrentPlaceholder(foods[foodIndex.current]);

          // Fade in new text
          animationRef.current = Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          });

          animationRef.current.start();
        });
      }
    });
  }, [fadeAnim, foods]);

  useEffect(() => {
    // Only start animation if input is not focused and has no value
    if (!isFocused && !value) {
      intervalRef.current = setInterval(animateToNextFood, 2000);
    } else {
      // Clear interval when focused or has value
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [isFocused, value, animateToNextFood]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus && onFocus();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur && onBlur();
  }, [onBlur]);

  const handleContainerPress = useCallback(() => {
    textInputRef.current?.focus();
  }, []);

  const handleChangeText = useCallback(
    (text) => {
      onChangeText && onChangeText(text);
    },
    [onChangeText]
  );

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      onPress={handleContainerPress}
      activeOpacity={1}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        <TextInput
          ref={textInputRef}
          style={[
            style,
            {
              position: "absolute",
              width: "100%",
              opacity: value || isFocused ? 1 : 0.01,
              zIndex: 2,
              fontSize: 14,
            },
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          autoFocus={autoFocus}
          {...rest}
        />

        {!value && !isFocused && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: placeholderTextColor || "#999",
              }}
            >
              Search for
            </Text>
            <Animated.Text
              style={{
                fontSize: 16,
                color: placeholderTextColor || "#999",
                opacity: fadeAnim,
                marginLeft: 4,
              }}
            >
              "{currentPlaceholder}"
            </Animated.Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AnimatedPlaceholder;
