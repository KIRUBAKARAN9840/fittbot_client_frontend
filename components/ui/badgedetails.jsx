import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Image,
  Dimensions,
  Easing,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BADGE_HIERARCHY = [
  {
    name: "BEGINNER",
    image: require("../../assets/images/BEGINNER.png"),
    pointRange: "0-499 XP",
    ranges: {
      Silver: "500-1000 XP",
      Gold: "1000-1500 XP",
      Platinum: "1500-2000 XP",
    },
  },
  {
    name: "ROOKIE",
    image: require("../../assets/images/rookie.png"),
    pointRange: "500-1999 XP",
    ranges: {
      Silver: "500-999 XP",
      Gold: "1000-1499 XP",
      Platinum: "1500-1999 XP",
    },
  },
  {
    name: "STRIVER",
    image: require("../../assets/images/STRIVER.png"),
    pointRange: "2000-3999 XP",
    ranges: {
      Silver: "2000-2499 XP",
      Gold: "2500-2999 XP",
      Platinum: "3000-3999 XP",
    },
  },
  {
    name: "WARRIOR",
    image: require("../../assets/images/WARRIOR.png"),
    pointRange: "4000-5999 XP",
    ranges: {
      Silver: "4000-4499 XP",
      Gold: "4500-4999 XP",
      Platinum: "5000-5999 XP",
    },
  },
  {
    name: "MAVERICK",
    image: require("../../assets/images/MAVERICK.png"),
    pointRange: "6000-7999 XP",
    ranges: {
      Silver: "6000-6499 XP",
      Gold: "6500-6999 XP",
      Platinum: "7000-7999 XP",
    },
  },
  {
    name: "BEAST",
    image: require("../../assets/images/BEAST.png"),
    pointRange: "8000-9999 XP",
    ranges: {
      Silver: "8000-8499 XP",
      Gold: "8500-8999 XP",
      Platinum: "9000-9999 XP",
    },
  },
  {
    name: "TITAN",
    image: require("../../assets/images/TITAN.png"),
    pointRange: "10000-19999 XP",
    ranges: {
      Silver: "10000-10999 XP",
      Gold: "11000-13999 XP",
      Platinum: "14000-19999 XP",
    },
  },
  {
    name: "CHAMPION",
    image: require("../../assets/images/CHAMPION.png"),
    pointRange: "20000-49999 XP",
    ranges: {
      Silver: "20000-24999 XP",
      Gold: "25000-34999 XP",
      Platinum: "35000-49999 XP",
    },
  },
  {
    name: "LEGEND",
    image: require("../../assets/images/LEGEND.png"),
    pointRange: "50000-99999 XP",
    ranges: {
      Silver: "50000-59999 XP",
      Gold: "60000-69999 XP",
      Platinum: "70000-99999 XP",
    },
  },
  {
    name: "GLADIATOR",
    image: require("../../assets/images/GLADIATOR.png"),
    pointRange: "100000-199999 XP",
    ranges: {
      Silver: "100000-119999 XP",
      Gold: "120000-139999 XP",
      Platinum: "140000-199999 XP",
    },
  },
  {
    name: "CONQUEROR",
    image: require("../../assets/images/CONQUEROR.png"),
    pointRange: "200000-500000 XP",
    ranges: {
      Silver: "200000-249999 XP",
      Gold: "250000-299999 XP",
      Platinum: "300000-500000 XP",
    },
  },
];

const Star = ({ startPosition, speed, size, delay, opacity, twinkleSpeed }) => {
  const positionY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const twinkle = useRef(new Animated.Value(0.5)).current; // Increased starting brightness from 0.3 to 0.5

  // Setup twinkling animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: twinkleSpeed,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0.7, // Higher minimum brightness
          duration: twinkleSpeed,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Setup rising animation
  useEffect(() => {
    positionY.setValue(SCREEN_HEIGHT);

    // Reduce delay to maximum of 1000ms (1 second) instead of 5000ms
    const timeout = setTimeout(() => {
      Animated.timing(positionY, {
        toValue: -500,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }, Math.min(delay, 1000)); // Cap the delay at 1 second

    return () => clearTimeout(timeout);
  }, [startPosition]);

  // Interpolate opacity for enhanced brightness during movement
  // Make stars brighter as they rise up
  const brightness = positionY.interpolate({
    inputRange: [0, SCREEN_HEIGHT / 2, SCREEN_HEIGHT],
    outputRange: [1.5, 1.2, 1], // Stars get brighter as they move up (multiplier)
  });

  // Combine the twinkling effect with the movement-based brightness
  const starOpacity = Animated.multiply(twinkle, brightness).interpolate({
    inputRange: [0.7, 1.5],
    outputRange: [opacity * 0.8, Math.min(opacity * 1.5, 1)], // Ensure we don't exceed 1.0
  });

  // Add subtle horizontal drift
  const positionX = positionY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [startPosition, startPosition + (Math.random() * 40 - 20)],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(255, 215, 0, 0.95)",
        top: 0,
        transform: [{ translateX: positionX }, { translateY: positionY }],
        opacity: starOpacity,
        // Enhanced glow effect
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95, // Increased from 0.9 to 0.95
        shadowRadius: 10, // Increased from 8 to 10 for more glow
      }}
    />
  );
};

// Modified StarField component with reduced initial delay
const StarField = ({ visible }) => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    if (visible) {
      // Generate stars with varied properties
      const starCount = 30;
      const newStars = [];

      for (let i = 0; i < starCount; i++) {
        // Vary star properties by type
        let starProps;
        const randType = Math.random();

        if (randType < 0.6) {
          // Small stars (60%)
          starProps = {
            size: 1.5 + Math.random() * 2,
            opacity: 0.4 + Math.random() * 0.3, // Increased base opacity
            speed: 8000 + Math.random() * 7000,
          };
        } else if (randType < 0.9) {
          // Medium stars (30%)
          starProps = {
            size: 3 + Math.random() * 2,
            opacity: 0.6 + Math.random() * 0.3, // Increased base opacity
            speed: 6000 + Math.random() * 4000,
          };
        } else {
          // Large stars (10%)
          starProps = {
            size: 4 + Math.random() * 3,
            opacity: 0.8 + Math.random() * 0.2, // Increased base opacity
            speed: 5000 + Math.random() * 3000,
          };
        }

        newStars.push({
          id: i,
          startPosition: Math.random() * SCREEN_WIDTH,
          speed: starProps.speed,
          size: starProps.size,
          delay: 0,
          opacity: starProps.opacity,
          twinkleSpeed: 800 + Math.random() * 1500,
        });
      }

      setStars(newStars);

      // Periodically refresh some stars for continuous animation
      let highestId = starCount - 1;

      const interval = setInterval(() => {
        setStars((prevStars) => {
          const updatedStars = [...prevStars];
          // Replace ~15% of stars randomly to maintain continuous flow
          const replacementCount = Math.floor(starCount * 0.15);

          for (let i = 0; i < replacementCount; i++) {
            const replaceIndex = Math.floor(Math.random() * prevStars.length);
            highestId++;

            updatedStars[replaceIndex] = {
              ...updatedStars[replaceIndex],
              id: highestId,
              startPosition: Math.random() * SCREEN_WIDTH,
              delay: 0, // No delay for replacements
            };
          }

          return updatedStars;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: "transparent",
      }}
    >
      {stars.map((star) => (
        <Star
          key={star.id}
          startPosition={star.startPosition}
          speed={star.speed}
          size={star.size}
          delay={star.delay}
          opacity={star.opacity}
          twinkleSpeed={star.twinkleSpeed}
        />
      ))}
    </View>
  );
};

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.8;

export const BadgeSummaryModal = ({
  visible,
  onClose,
  userXP = 0,
  currentBadge = null,
  onMoreDetails,
  color,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            summaryStyles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <StarField visible={visible} />
          <View style={summaryStyles.header}>
            <Text style={summaryStyles.title}>League Levels</Text>
            <TouchableOpacity
              onPress={onClose}
              style={summaryStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={summaryStyles.badgesContainer}>
              {BADGE_HIERARCHY.map((badge, index) => {
                const isCurrentBadge = currentBadge
                  ? badge.name.toLowerCase() === currentBadge.toLowerCase()
                  : false;

                const verticalOffset = index * 20;

                return (
                  <View
                    key={index}
                    style={[
                      summaryStyles.badgeColumn,
                      isCurrentBadge && summaryStyles.currentBadgeColumn,
                      { marginTop: -verticalOffset },
                    ]}
                  >
                    <View style={summaryStyles.badgeIconContainer}>
                      <Image
                        source={badge.image}
                        style={[summaryStyles.badgeIcon]}
                      />
                    </View>
                    <Text style={summaryStyles.badgeName}>{badge.name}</Text>
                    <Text style={summaryStyles.badgePoints}>
                      {badge.pointRange}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={summaryStyles.footer}>
            <TouchableOpacity
              style={summaryStyles.moreDetailsButton}
              onPress={onMoreDetails}
            >
              <Text style={summaryStyles.moreDetailsText}>MORE DETAILS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Detailed Badge Modal Component
export const BadgeDetailsModal = ({
  visible,
  onClose,
  currentBadge,
  currentLevel,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [selectedBadge, setSelectedBadge] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (currentBadge) {
      const index = BADGE_HIERARCHY.findIndex(
        (badge) => badge.name.toLowerCase() === currentBadge.toLowerCase()
      );
      if (index !== -1) setSelectedBadge(index);
    }
  }, [currentBadge, visible]);

  useEffect(() => {
    if (flatListRef.current && visible) {
      flatListRef.current.scrollToIndex({
        index: selectedBadge,
        animated: false,
      });
    }
  }, [selectedBadge, visible]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const getLevelColor = (level) => {
    switch (level) {
      case "Silver":
        return "#C0C0C0";
      case "Gold":
        return "#FFD700";
      case "Platinum":
        return "#E5E4E2";
      default:
        return "#C0C0C0";
    }
  };

  const renderBadgeItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.badgeItemContainer}>
        <Animated.View
          style={[styles.badgeWrapper, { transform: [{ scale }], opacity }]}
        >
          <Image source={item.image} style={styles.badgeImage} />
          <Text style={styles.badgeName}>{item.name}</Text>
        </Animated.View>
      </View>
    );
  };

  const currentBadgeData = BADGE_HIERARCHY[selectedBadge];

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Badge Progression</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Unlock new badges as you earn XP through workouts and challenges
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressIndicator}>
              {BADGE_HIERARCHY.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    selectedBadge === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>

          <Animated.FlatList
            ref={flatListRef}
            data={BADGE_HIERARCHY}
            keyExtractor={(item) => item.name}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / ITEM_WIDTH
              );
              setSelectedBadge(index);
            }}
            initialScrollIndex={selectedBadge}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            renderItem={renderBadgeItem}
            style={styles.badgesList}
            contentContainerStyle={styles.badgesListContent}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            snapToAlignment="center"
          />

          {/* Fixed level container that doesn't scroll */}
          {currentBadgeData?.name !== "BEGINNER" ? (
            <View style={styles.levelContainer}>
              {["Silver", "Gold", "Platinum"].map((level, levelIndex) => (
                <View
                  key={levelIndex}
                  style={[
                    styles.levelItem,
                    { borderColor: getLevelColor(level) },
                  ]}
                >
                  <Text
                    style={[styles.levelTitle, { color: getLevelColor(level) }]}
                  >
                    {level}
                  </Text>
                  <Text style={styles.levelRange}>
                    {currentBadgeData?.ranges[level] || "0-0 XP"}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            ""
          )}
          {currentBadgeData?.name === "BEGINNER" ? (
            <View>
              <Text
                style={{ fontWeight: "600", textAlign: "center", fontSize: 20 }}
              >
                0-499XP
              </Text>
            </View>
          ) : (
            ""
          )}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                selectedBadge === 0 && styles.disabledButton,
              ]}
              onPress={() => {
                if (selectedBadge > 0) {
                  setSelectedBadge(selectedBadge - 1);
                }
              }}
              disabled={selectedBadge === 0}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={selectedBadge === 0 ? "#ccc" : "#FF5757"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                selectedBadge === BADGE_HIERARCHY.length - 1 &&
                  styles.disabledButton,
              ]}
              onPress={() => {
                if (selectedBadge < BADGE_HIERARCHY.length - 1) {
                  setSelectedBadge(selectedBadge + 1);
                }
              }}
              disabled={selectedBadge === BADGE_HIERARCHY.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  selectedBadge === BADGE_HIERARCHY.length - 1
                    ? "#ccc"
                    : "#FF5757"
                }
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#0154A0",
    width: 10,
    height: 10,
  },
  badgesList: {
    height: 160,
  },
  badgesListContent: {
    alignItems: "center",
  },
  badgeItemContainer: {
    width: ITEM_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrapper: {
    alignItems: "center",
    marginBottom: 15,
  },
  badgeImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  levelContainer: {
    width: "100%",
    marginTop: 10,
  },
  levelItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "#F8F8F8",
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  levelRange: {
    fontSize: 12,
    color: "#666",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  disabledButton: {
    opacity: 0.5,
  },
  keepTrainingButton: {
    backgroundColor: "#0154A0",
    borderRadius: 25,
    padding: 12,
    alignItems: "center",
    marginTop: 15,
  },
  keepTrainingText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

// Summary modal styles
const summaryStyles = StyleSheet.create({
  modalContent: {
    backgroundColor: "#303030",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
    // overflow: "hidden",
  },
  header: {
    padding: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 5,
  },
  badgesContainer: {
    flexDirection: "row",
    padding: 10,
    paddingVertical: 20,
    marginTop: 180,
  },
  badgeColumn: {
    width: 110,
    alignItems: "center",
    marginHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  currentBadgeColumn: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  badgeIconContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeIcon: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  lockedBadge: {
    opacity: 0.4,
    tintColor: "#888",
  },
  badgeName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginVertical: 4,
  },
  badgePoints: {
    color: "#FFD700",
    fontSize: 11,
  },
  footer: {
    padding: 15,
    alignItems: "center",
  },
  moreDetailsButton: {
    backgroundColor: "#0154A0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7,
  },
  moreDetailsText: {
    color: "white",
    fontWeight: "bold",
  },
});
