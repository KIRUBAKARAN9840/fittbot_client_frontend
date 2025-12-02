import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useRef, act } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import {
  clientWaterTrackerAPI,
  ClientWeightUpdateNewAPI,
} from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import { Ionicons } from "@expo/vector-icons";
import GradientButton3 from "../GradientButton3";
import { Image } from "expo-image";
import { MaskedText } from "../MaskedText";
import SkeletonHome from "./skeletonHome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");
const MAX_WATER_GOAL_ML = 5000;

const WaterTracker = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [fillAnimation] = useState(new Animated.Value(0));
  const [waveAnimation] = useState(new Animated.Value(0));
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0);
  const [targetWater, setTargetWater] = useState(null);
  const [remainingWater, setRemainingWater] = useState(null);
  const [newGoalML, setNewGoalML] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [inputError, setInputError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  // New states for remove button functionality
  const [removeButtonStates, setRemoveButtonStates] = useState({});
  const [progressAnimations, setProgressAnimations] = useState({});
  const timeoutRefs = useRef({});

  // Carousel states
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(1);
  const carouselFlatListRef = useRef(null);
  const carouselScrollX = useRef(new Animated.Value(width)).current;
  const isCarouselScrolling = useRef(false);
  const carouselAutoScrollTimer = useRef(null);
  const carouselTransitionTimers = useRef([]);

  const updateWater = async (payload) => {
    try {
      const response = await ClientWeightUpdateNewAPI(payload);

      if (response?.status === 200) {
        loadData();
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

  const handleAddWater = async (water, type) => {
    if (type === "remove" && currentWaterIntake - water < 0) {
      showToast({
        type: "error",
        title: "Invalid Amount",
        desc: "Cannot remove more water than consumed",
      });
      return;
    }

    let actualWaterToAdd = water;
    let targetAchieved = false;

    if (type === "add" && currentWaterIntake + water > targetWater) {
      // Calculate remaining water needed to reach target
      const remaining = targetWater - currentWaterIntake;
      if (remaining <= 0) {
        showToast({
          type: "error",
          title: "Goal Already Achieved",
          desc: "You've already reached your daily water goal!",
        });
        return;
      }
      // Only add the remaining amount to reach the target
      actualWaterToAdd = remaining;
      targetAchieved = true;
    } else if (
      type === "add" &&
      currentWaterIntake < targetWater &&
      currentWaterIntake + water >= targetWater
    ) {
      // Normal achievement - reaching target exactly or crossing threshold
      targetAchieved = true;
    }

    let newValue = 0;

    if (type === "add") {
      newValue = ((currentWaterIntake + actualWaterToAdd) / 1000).toFixed(2);
    } else {
      newValue = ((currentWaterIntake - water) / 1000).toFixed(2);
    }

    setCurrentWaterIntake(newValue * 1000);

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      const payload = {
        client_id: clientId,
        gym_id: gymId,
        type: "water",
        actual_water: newValue,
      };

      await updateWater(payload);

      showToast({
        type: "success",
        title: type === "add" ? "Water Added" : "Water Removed",
        desc:
          type === "add"
            ? `Added ${actualWaterToAdd} ml to your intake`
            : `Removed ${water} ml from your intake`,
      });

      // Show achievement modal if target is reached
      if (targetAchieved) {
        setAchievementModalVisible(true);
        setTimeout(() => {
          setAchievementModalVisible(false);
        }, 3000);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const handleIntakePress = (amount, index) => {
    // Add water
    handleAddWater(amount, "add");

    // Show remove button with progress bar
    const progressAnim = new Animated.Value(0);

    setRemoveButtonStates((prev) => ({
      ...prev,
      [index]: true,
    }));

    setProgressAnimations((prev) => ({
      ...prev,
      [index]: progressAnim,
    }));

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    // Clear existing timeout if any
    if (timeoutRefs.current[index]) {
      clearTimeout(timeoutRefs.current[index]);
    }

    // Set timeout to revert back to intake button
    timeoutRefs.current[index] = setTimeout(() => {
      setRemoveButtonStates((prev) => ({
        ...prev,
        [index]: false,
      }));
      setProgressAnimations((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }, 4000);
  };

  const handleRemovePress = (amount, index) => {
    // Remove water
    handleAddWater(amount, "remove");

    // Clear timeout and immediately revert to intake button
    if (timeoutRefs.current[index]) {
      clearTimeout(timeoutRefs.current[index]);
    }

    setRemoveButtonStates((prev) => ({
      ...prev,
      [index]: false,
    }));
    setProgressAnimations((prev) => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const loadData = async () => {
    // setLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error Loading Page",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        client_id: clientId,
      };

      const response = await clientWaterTrackerAPI(payload);

      const { actual, target } = response?.data?.target_actual.water_intake;

      if (response?.status === 200) {
        setCurrentWaterIntake(actual * 1000);
        setTargetWater(target * 1000);

        const remaining = Math.max(0, (target - actual) * 1000);
        setRemainingWater(remaining.toFixed(2));
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
    } finally {
      setLoading(false);
    }
  };

  // Carousel data - both images for all users
  const carouselData = React.useMemo(() => {
    return [
      require("../../../assets/images/water_male.png"),
      require("../../../assets/images/water_female.png"),
    ];
  }, []);

  // Create infinite loop data for carousel
  const loopCarouselData = React.useMemo(() => {
    if (carouselData.length <= 1) return carouselData;
    return [
      carouselData[carouselData.length - 1],
      ...carouselData,
      carouselData[0],
    ];
  }, [carouselData]);

  // Carousel auto-play
  useEffect(() => {
    if (carouselData.length <= 1) return;

    carouselAutoScrollTimer.current = setInterval(() => {
      if (!isCarouselScrolling.current && carouselFlatListRef.current) {
        const nextIndex = carouselActiveIndex + 1;
        if (nextIndex < loopCarouselData.length) {
          try {
            carouselFlatListRef.current.scrollToIndex({
              animated: true,
              index: nextIndex,
            });
          } catch (error) {
            // Ignore scroll errors
          }
        }
      }
    }, 3000);

    return () => {
      if (carouselAutoScrollTimer.current) {
        clearInterval(carouselAutoScrollTimer.current);
        carouselAutoScrollTimer.current = null;
      }
    };
  }, [carouselActiveIndex, carouselData.length, loopCarouselData.length]);

  // Carousel infinite loop transitions
  useEffect(() => {
    if (carouselData.length <= 1 || loopCarouselData.length <= 1) return;

    const listener = carouselScrollX.addListener(({ value }) => {
      const index = Math.round(value / width);

      if (
        index === loopCarouselData.length - 1 &&
        !isCarouselScrolling.current
      ) {
        const timer = setTimeout(() => {
          isCarouselScrolling.current = true;
          if (carouselFlatListRef.current) {
            try {
              carouselFlatListRef.current.scrollToIndex({
                animated: false,
                index: 1,
              });
              setCarouselActiveIndex(1);
              const innerTimer = setTimeout(() => {
                isCarouselScrolling.current = false;
              }, 50);
              carouselTransitionTimers.current.push(innerTimer);
            } catch (error) {
              isCarouselScrolling.current = false;
            }
          }
        }, 100);
        carouselTransitionTimers.current.push(timer);
      } else if (index === 0 && !isCarouselScrolling.current) {
        const timer = setTimeout(() => {
          isCarouselScrolling.current = true;
          if (carouselFlatListRef.current) {
            const targetIndex = loopCarouselData.length - 2;
            if (targetIndex >= 0 && targetIndex < loopCarouselData.length) {
              try {
                carouselFlatListRef.current.scrollToIndex({
                  animated: false,
                  index: targetIndex,
                });
                setCarouselActiveIndex(targetIndex);
                const innerTimer = setTimeout(() => {
                  isCarouselScrolling.current = false;
                }, 50);
                carouselTransitionTimers.current.push(innerTimer);
              } catch (error) {
                isCarouselScrolling.current = false;
              }
            }
          }
        }, 100);
        carouselTransitionTimers.current.push(timer);
      }
    });

    return () => {
      carouselScrollX.removeListener(listener);
      carouselTransitionTimers.current.forEach((timer) => clearTimeout(timer));
      carouselTransitionTimers.current = [];
    };
  }, [carouselData.length, loopCarouselData.length]);

  const handleCarouselScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: carouselScrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        if (isCarouselScrolling.current || !event?.nativeEvent) return;

        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / width
        );

        if (
          slideIndex !== carouselActiveIndex &&
          slideIndex >= 0 &&
          slideIndex < loopCarouselData.length
        ) {
          setCarouselActiveIndex(slideIndex);
        }
      },
    }
  );

  const onCarouselScrollBeginDrag = () => {
    isCarouselScrolling.current = true;
  };

  const onCarouselScrollEndDrag = () => {
    setTimeout(() => {
      isCarouselScrolling.current = false;
    }, 100);
  };

  const renderCarouselItem = ({ item, index }) => {
    return (
      <View style={styles.carouselSlideOuter}>
        <View style={styles.carouselSlide}>
          <Image
            source={item}
            style={styles.carouselImage}
            contentFit="cover"
          />
        </View>
      </View>
    );
  };

  const renderCarouselIndicators = () => {
    if (carouselData.length <= 1) return null;

    return (
      <View style={styles.carouselIndicatorContainer}>
        {carouselData.map((_, index) => {
          let realActiveIndex = carouselActiveIndex - 1;
          if (carouselActiveIndex === 0)
            realActiveIndex = carouselData.length - 1;
          if (carouselActiveIndex === loopCarouselData.length - 1)
            realActiveIndex = 0;

          const isActive = index === realActiveIndex;

          return (
            <View
              key={index}
              style={[
                styles.carouselIndicator,
                {
                  width: isActive ? 30 : 10,
                  opacity: isActive ? 1 : 0.5,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    loadData();

    // Start enhanced wave animation
    const startWaveAnimation = () => {
      Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ).start();
    };

    startWaveAnimation();

    // Initialize carousel scroll position
    let initTimer = null;
    if (carouselData.length > 1 && loopCarouselData.length > 1) {
      initTimer = setTimeout(() => {
        if (carouselFlatListRef.current) {
          try {
            carouselFlatListRef.current.scrollToIndex({
              animated: false,
              index: 1,
            });
          } catch (error) {
            // Ignore scroll errors on initial mount
          }
        }
      }, 100);
    }

    // Cleanup timeouts on unmount
    return () => {
      Object.values(timeoutRefs.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
      if (initTimer) clearTimeout(initTimer);
      if (carouselAutoScrollTimer.current) {
        clearInterval(carouselAutoScrollTimer.current);
        carouselAutoScrollTimer.current = null;
      }
      carouselTransitionTimers.current.forEach((timer) => clearTimeout(timer));
      carouselTransitionTimers.current = [];
    };
  }, []);

  useEffect(() => {
    if (currentWaterIntake !== null && targetWater !== null) {
      const fillPercentage = Math.min(currentWaterIntake / targetWater, 1);

      Animated.timing(fillAnimation, {
        toValue: fillPercentage,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();

      const remaining = Math.max(0, targetWater - currentWaterIntake);
      setRemainingWater(remaining.toFixed(2));
    }
  }, [currentWaterIntake, targetWater]);

  const updateWaterGoal = async () => {
    if (!newGoalML || isNaN(parseInt(newGoalML))) {
      setInputError("Please enter a valid number");
      return;
    }

    const value = parseInt(newGoalML);
    if (value > MAX_WATER_GOAL_ML) {
      alert(`Maximum goal is ${MAX_WATER_GOAL_ML}ml`);
      return;
    }

    if (value <= 0) {
      alert(`Goal must be greater than 0`);
      return;
    }

    setSubmitting(true);

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        alert("Error Setting Water Goal");
        return;
      }

      const floatValue = (newGoalML / 1000).toFixed(2);
      const type = "water";

      const payload = {
        client_id: clientId,
        gym_id: gymId,
        type: type,
        target_water: floatValue,
      };

      await updateWater(payload);
      setTargetWater(newGoalML);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setSubmitting(false);
      setNewGoalML("");
      setInputError("");
      setSelectedPreset(null);
    }
  };

  const validateGoalInput = (text) => {
    setNewGoalML(text);

    if (!text) {
      setInputError("");
      return;
    }

    const value = parseInt(text);
    if (isNaN(value)) {
      setInputError("Please enter a valid number");
    } else if (value > MAX_WATER_GOAL_ML) {
      setInputError(`Maximum goal is ${MAX_WATER_GOAL_ML}ml`);
    } else if (value <= 0) {
      setInputError("Goal must be greater than 0");
    } else {
      setInputError("");
    }
  };

  const handlePresetSelect = (value) => {
    setSelectedPreset(value);
    validateGoalInput(value.toString());
  };

  const isGoalInputValid =
    newGoalML &&
    !isNaN(parseInt(newGoalML)) &&
    parseInt(newGoalML) <= MAX_WATER_GOAL_ML &&
    parseInt(newGoalML) > 0;

  const presetValues = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

  // Updated water options with 500ml added
  const waterOptions = [
    { amount: 150, label: "1/2 Glass" },
    { amount: 250, label: "1 Glass" },
    { amount: 350, label: "1.5 Glass" },
    { amount: 500, label: "2 Glass" },
  ];

  // Function to render glass images based on amount
  const renderGlassImages = (amount) => {
    const glassImages = [];

    if (amount === 150) {
      // Half glass
      glassImages.push(
        <Image
          key="half"
          source={require("../../../assets/images/water/half_glass.png")}
          style={styles.glassImage}
        />
      );
    } else if (amount === 250) {
      // One full glass
      glassImages.push(
        <Image
          key="full"
          source={require("../../../assets/images/water/full_glass.png")}
          style={styles.glassImage}
        />
      );
    } else if (amount === 350) {
      // 1.5 glasses - one full + one half
      glassImages.push(
        <Image
          key="full-1"
          source={require("../../../assets/images/water/full_glass.png")}
          style={styles.glassImage}
        />
      );
      glassImages.push(
        <Image
          key="half-1"
          source={require("../../../assets/images/water/half_glass.png")}
          style={styles.glassImage}
        />
      );
    } else if (amount === 500) {
      // 2 full glasses
      glassImages.push(
        <Image
          key="full-1"
          source={require("../../../assets/images/water/full_glass.png")}
          style={styles.glassImage}
        />
      );
      glassImages.push(
        <Image
          key="full-2"
          source={require("../../../assets/images/water/full_glass.png")}
          style={styles.glassImage}
        />
      );
    }

    return glassImages;
  };

  if (loading) {
    return <SkeletonHome type="water" header={false} />;
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselFlatListRef}
            data={loopCarouselData}
            renderItem={renderCarouselItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            onScrollBeginDrag={onCarouselScrollBeginDrag}
            onScrollEndDrag={onCarouselScrollEndDrag}
            scrollEventThrottle={16}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={styles.carouselFlatlistContent}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
          {/* {renderCarouselIndicators()} */}
        </View>

        {/* Water Wave Background */}
        <View style={styles.waveContainer}>
          <View style={styles.wave1} />
          <View style={styles.wave2} />
        </View>

        {/* Main Round Beaker Container */}
        <View style={styles.beakerContainer}>
          <View style={styles.roundBeaker}>
            {/* Water fill */}
            <Animated.View
              style={[
                styles.waterFill,
                {
                  height: fillAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            ></Animated.View>

            {/* Volume text overlay */}
            <View style={styles.volumeTextContainer}>
              <Text style={styles.volumeText}>{currentWaterIntake}ml</Text>
            </View>
          </View>
        </View>

        {/* Goal and Remaining Section */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 20,
            paddingHorizontal: 10,
          }}
        >
          <GradientButton3
            title={"Daily Goal"}
            span={`${targetWater} ml`}
            mainContainerStyle={{ width: "48%" }}
            colors={["#23C6D3", "#129BC0", "#006FAD"]}
            edit
            onPress={() => setModalVisible(true)}
          />
          <GradientButton3
            title={"Remaining"}
            span={`${remainingWater} ml`}
            mainContainerStyle={{ width: "48%" }}
            colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
            textStyle={{
              color: "#006FAD",
            }}
            spanStyle={{
              color: "#006FAD",
            }}
            borderStyle={{
              borderColor: "#006FAD",
              borderWidth: 1,
              borderRadius: 8,
            }}
          />
        </View>

        {/* Water Intake Options */}
        <View style={styles.intakeContainer}>
          {waterOptions.map((option, index) => (
            <View key={index} style={styles.intakeRow}>
              <View style={styles.intakeInfo}>
                {/* <Text style={styles.intakeAmount}>{option.amount}ml</Text> */}
                <MaskedText bg1="#23C6D3" bg2="#006FAD" text={option.amount}>
                  {option.amount}
                </MaskedText>
                <Text>ml</Text>
              </View>

              <View style={styles.glassInfo}>
                <View style={styles.glassImagesContainer}>
                  {renderGlassImages(option.amount)}
                </View>
                <Text style={styles.glassLabel}>{option.label}</Text>
              </View>

              <View style={styles.actionButtons}>
                {removeButtonStates[index] ? (
                  <View style={styles.removeButtonContainer}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width:
                            progressAnimations[index]?.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            }) || "0%",
                        },
                      ]}
                    />
                    <TouchableOpacity
                      style={styles.removeButtonWithProgress}
                      onPress={() => handleRemovePress(option.amount, index)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <LinearGradient
                    colors={["#23C6D3", "#006FAD"]}
                    style={styles.intakeButton}
                  >
                    <TouchableOpacity
                      onPress={() => handleIntakePress(option.amount, index)}
                    >
                      <Text style={styles.intakeButtonText}>Intake</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Goal Setting Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setNewGoalML("");
            setInputError("");
            setSelectedPreset(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.glassIcon}>🥤</Text>
                  <Text style={styles.modalTitle}>Set Daily Water Goal</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setModalVisible(false);
                    setNewGoalML("");
                    setInputError("");
                    setSelectedPreset(null);
                  }}
                >
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Enter target amount in milliliters (ml)
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.modalInput,
                    inputError ? styles.inputError : null,
                  ]}
                  keyboardType="numeric"
                  placeholder=""
                  value={newGoalML}
                  onChangeText={(text) => {
                    validateGoalInput(text);
                    setSelectedPreset(null);
                  }}
                />
                <Text style={styles.inputUnit}>ml</Text>
              </View>

              <Text style={styles.modalLimit}>
                Maximum: {MAX_WATER_GOAL_ML}ml
              </Text>

              {inputError ? (
                <Text style={styles.errorText}>{inputError}</Text>
              ) : null}

              <View style={styles.presetSection}>
                <Text style={styles.presetLabel}>Quick Select:</Text>
                <View style={styles.presetGrid}>
                  {presetValues?.map((value) => (
                    <TouchableOpacity
                      key={`preset-${value}`}
                      style={[
                        styles.presetButton,
                        (selectedPreset === value ||
                          parseInt(newGoalML) === value) &&
                          styles.presetButtonActive,
                      ]}
                      onPress={() => handlePresetSelect(value)}
                    >
                      {selectedPreset === value ||
                      parseInt(newGoalML) === value ? (
                        <LinearGradient
                          colors={["#23C6D3", "#006FAD"]}
                          style={styles.presetButtonGradient}
                        >
                          <Text style={styles.presetButtonTextActive}>
                            {value} ml
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.presetButtonText}>{value} ml</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  (!isGoalInputValid || submitting) &&
                    styles.modalSubmitButtonDisabled,
                ]}
                onPress={updateWaterGoal}
                disabled={!isGoalInputValid || submitting}
              >
                {isGoalInputValid && !submitting ? (
                  <LinearGradient
                    colors={["#23C6D3", "#006FAD"]}
                    style={styles.submitButtonGradient}
                  >
                    <Text style={styles.modalSubmitButtonText}>Set Goal</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.modalSubmitButtonTextDisabled}>
                    {submitting ? "Updating..." : "Set Goal"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Achievement Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={achievementModalVisible}
          onRequestClose={() => setAchievementModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.achievementOverlay}
            activeOpacity={1}
            onPress={() => setAchievementModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.achievementContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Image
                source={require("../../../assets/images/modal/water.png")}
                style={styles.achievementImage}
                contentFit="contain"
              />
              <Text style={styles.achievementTitle}>Hydration achieved!</Text>
              <View style={styles.achievementTextContainer}>
                <Image
                  source={require("../../../assets/images/water/full_glass.png")}
                  style={styles.achievementDropIcon}
                />
                <Text style={styles.achievementText}>
                  Today you've drunk{" "}
                  <Text style={styles.achievementAmount}>{targetWater}</Text> ml
                  of water.
                </Text>
              </View>
              <Text style={styles.achievementSubtext}>
                Stay hydrated and feel amazing!
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  // Wave Background
  waveContainer: {
    position: "relative",
    height: 80,
    overflow: "hidden",
  },
  wave1: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#97CBD6",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  wave2: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#97CBD6",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // Round Beaker Styles
  beakerContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  roundBeaker: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#F8F8F8",
    borderWidth: 4,
    borderColor: "#E0E0E0",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  waterFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#7EB2C1",
    borderBottomLeftRadius: 90,
    borderBottomRightRadius: 90,
    overflow: "hidden",
  },
  waveContainer: {
    position: "absolute",
    top: -5,
    left: -60,
    right: -60,
    height: 15,
    overflow: "hidden",
  },
  volumeTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  volumeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },

  // Intake Container
  intakeContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  intakeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  intakeInfo: {
    flex: 1,
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 2,
  },
  intakeAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  glassInfo: {
    flex: 2,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  glassImagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 4,
  },
  glassImage: {
    width: 16,
    height: 16,
  },
  glassLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  actionButtons: {
    flex: 1,
    alignItems: "flex-end",
  },
  intakeButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
    minWidth: 70,
  },
  intakeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  removeButtonContainer: {
    position: "relative",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#FF6B6B",
    minWidth: 70,
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "#FF4444",
    zIndex: 1,
  },
  removeButtonWithProgress: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    zIndex: 2,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Modal Styles (keeping existing modal styles)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  glassIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
  },
  inputUnit: {
    position: "absolute",
    right: 15,
    top: 12,
    color: "#999",
    fontSize: 16,
  },
  modalLimit: {
    fontSize: 10,
    color: "#006FAD",
    marginBottom: 10,
  },
  inputError: {
    borderColor: "#FF5757",
  },
  errorText: {
    color: "#FF5757",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  presetSection: {
    marginBottom: 24,
  },
  presetLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    fontWeight: "500",
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  presetButton: {
    width: "48%",
    height: 35,
    marginBottom: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  presetButtonActive: {
    backgroundColor: "transparent",
  },
  presetButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  presetButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  presetButtonTextActive: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  modalSubmitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  submitButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubmitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSubmitButtonTextDisabled: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },

  // Achievement Modal Styles
  achievementOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  achievementContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  achievementImage: {
    width: 210,
    height: 210,
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007BFF",
    marginBottom: 8,
    textAlign: "center",
  },
  achievementTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  achievementDropIcon: {
    width: 14,
    height: 14,
  },
  achievementText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  achievementAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007BFF",
  },
  achievementSubtext: {
    fontSize: 12,
    color: "#868686",
    marginTop: 5,
    marginBottom: 25,
    textAlign: "center",
  },
  achievementButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    overflow: "hidden",
  },
  achievementButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  // Carousel Styles
  carouselContainer: {
    position: "relative",
    height: 65,
    overflow: "hidden",
    // marginBottom: 10,
  },
  carouselFlatlistContent: {
    alignItems: "center",
  },
  carouselSlideOuter: {
    width: width,
    height: 65,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselSlide: {
    width: width,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  carouselIndicatorContainer: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  carouselIndicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#23C6D3",
    marginHorizontal: 4,
  },
});

export default WaterTracker;
