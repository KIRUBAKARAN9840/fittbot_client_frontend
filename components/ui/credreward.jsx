import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";

const { width, height } = Dimensions.get("window");

// Define confetti colors
const CONFETTI_COLORS = [
  "#3DD6D0",
  "#EF476F",
  "#FFC43D",
  "#1B9AAA",
  "#06D6A0",
  "#FF9F1C",
];
const CONFETTI_COUNT = 80;

// Confetti piece component
const ConfettiPiece = ({ style }) => {
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 10,
          height: 10,
          backgroundColor:
            CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          borderRadius: Math.random() > 0.5 ? 5 : 0,
        },
        style,
      ]}
    />
  );
};

// Confetti container component - modified to launch from two rockets
const Confetti = () => {
  const confettiRefs = useRef([]);

  useEffect(() => {
    // Animate each confetti piece
    confettiRefs.current.forEach((confetti, index) => {
      if (confetti) {
        // Determine which rocket this confetti comes from
        const fromLeftRocket = index % 2 === 0;
        const startX = fromLeftRocket ? width * 0.15 : width * 0.85;

        // Two-phase animation: blast UP first, then fall DOWN
        Animated.sequence([
          Animated.delay(Math.random() * 300),
          // Phase 1: BLAST UP from rocket position
          Animated.parallel([
            Animated.timing(confetti.translateY, {
              toValue: -Math.random() * height * 0.4 - 30, // Go upward
              duration: 600 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.translateX, {
              toValue: startX + (Math.random() - 0.5) * width * 0.3,
              duration: 600 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.rotate, {
              toValue: Math.random() * 2 - 1,
              duration: 600 + Math.random() * 400,
              useNativeDriver: true,
            }),
          ]),
          // Phase 2: FALL DOWN
          Animated.parallel([
            Animated.timing(confetti.translateY, {
              toValue: height * 0.8,
              duration: 2000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.translateX, {
              toValue: (Math.random() - 0.5) * width * 1.5 + width / 2,
              duration: 2000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.rotate, {
              toValue: Math.random() * 10 - 5,
              duration: 2000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.opacity, {
              toValue: 0,
              duration: 2000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }
    });
  }, []);

  // Create confetti pieces
  const pieces = Array(CONFETTI_COUNT)
    .fill()
    .map((_, i) => {
      // Determine which rocket this confetti comes from
      const fromLeftRocket = i % 2 === 0;
      const startX = fromLeftRocket ? width * 0.15 : width * 0.85;

      confettiRefs.current[i] = {
        translateY: new Animated.Value(height * 0.7), // Start from rocket position
        translateX: new Animated.Value(startX),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
      };

      const pieceStyle = {
        transform: [
          { translateY: confettiRefs.current[i].translateY },
          { translateX: confettiRefs.current[i].translateX },
          {
            rotate: confettiRefs.current[i].rotate.interpolate({
              inputRange: [-5, 5],
              outputRange: ["-180deg", "180deg"],
            }),
          },
        ],
        opacity: confettiRefs.current[i].opacity,
      };

      return <ConfettiPiece key={i} style={pieceStyle} />;
    });

  return <View style={StyleSheet.absoluteFillObject}>{pieces}</View>;
};

// Rocket component
const Rocket = ({ position }) => {
  return (
    <View
      style={[
        styles.rocket,
        {
          left: position === "left" ? width * 0.15 - 15 : width * 0.85 - 15,
        },
      ]}
    >
      <Text style={styles.rocketEmoji}>🚀</Text>
    </View>
  );
};

// Main component
const CREDCashbackScreen = () => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // State for coin counter
  const [coinCount, setCoinCount] = useState(57657);
  const [giftCount, setGiftCount] = useState(90);

  // Flying coins refs
  const flyingCoins = useRef([]);
  const [showFlyingCoins, setShowFlyingCoins] = useState(false);

  // Main animation sequence
  useEffect(() => {
    // First animate the card
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // After card appears, start flying coins animation with delay
      setTimeout(() => {
        setShowFlyingCoins(true);
        animateFlyingCoins();
      }, 1000);
    });
  }, []);

  // Function to animate flying coins
  const animateFlyingCoins = () => {
    // Create 10 coins that will fly to the gift
    const newCoins = [];
    for (let i = 0; i < 15; i++) {
      // Alternate between left and right rocket
      const fromLeftRocket = i % 2 === 0;
      const startX = fromLeftRocket ? width * 0.15 : width * 0.85;

      const coin = {
        translateX: new Animated.Value(startX),
        translateY: new Animated.Value(height * 0.7), // Start from rocket position
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1),
      };

      newCoins.push(coin);

      // Animate each coin with delay between them
      setTimeout(() => {
        Animated.sequence([
          // First move upward from rocket
          Animated.parallel([
            Animated.timing(coin.translateY, {
              toValue: height * 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(coin.translateX, {
              toValue: startX + (Math.random() - 0.5) * 80,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          // Then fly to the gift icon
          Animated.parallel([
            Animated.timing(coin.translateX, {
              toValue: width * 0.25, // Adjusted for gift icon position
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(coin.translateY, {
              toValue: 30, // Adjusted for stats bar position
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(coin.scale, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(coin.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Increment coin and gift counts when coin reaches gift
          setCoinCount((prev) => prev + 5);
          setGiftCount((prev) => prev + 1);
        });
      }, i * 200); // Stagger the animation start times
    }

    flyingCoins.current = newCoins;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Controls */}
      <View style={styles.headerControls}>
        <View style={styles.controlsLeft}>
          <View style={styles.iconButton}>
            <Text style={styles.controlIcon}>▶</Text>
          </View>
          <View style={styles.iconButton}>
            <Text style={styles.controlIcon}>←</Text>
          </View>
          <View style={styles.iconButton}>
            <Text style={styles.controlIcon}>🔊</Text>
          </View>
        </View>
        <View style={styles.controlsRight}>
          <View style={styles.iconButton}>
            <Text style={styles.controlIcon}>□</Text>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={styles.statValue}>{coinCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🎁</Text>
          <Animatable.Text
            animation={giftCount > 90 ? "pulse" : ""}
            iterationCount={giftCount > 90 ? "infinite" : 1}
            style={styles.statValue}
          >
            {giftCount}
          </Animatable.Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>💎</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🔰</Text>
          <Text style={styles.statValue}>3</Text>
        </View>
      </View>

      {/* Rockets at bottom left and right */}
      <Rocket position="left" />
      <Rocket position="right" />

      {/* Confetti Animation */}
      <Confetti />

      {/* Flying Coins Animation */}
      {showFlyingCoins &&
        flyingCoins.current.map((coin, index) => (
          <Animated.View
            key={`flying-coin-${index}`}
            style={{
              position: "absolute",
              width: 20,
              height: 20,
              backgroundColor: "#FFD700",
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              transform: [
                { translateX: coin.translateX },
                { translateY: coin.translateY },
                { scale: coin.scale },
              ],
              opacity: coin.opacity,
              zIndex: 100,
            }}
          >
            <Text>💰</Text>
          </Animated.View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 20,
  },
  headerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  controlsLeft: {
    flexDirection: "row",
  },
  controlsRight: {
    flexDirection: "row",
  },
  iconButton: {
    marginRight: 15,
  },
  controlIcon: {
    color: "white",
    fontSize: 18,
  },
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 10,
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  statValue: {
    color: "white",
    fontSize: 14,
  },
  rocket: {
    position: "absolute",
    bottom: 50,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  rocketEmoji: {
    fontSize: 24,
    transform: [{ rotate: "-90deg" }],
  },
});

export default CREDCashbackScreen;
