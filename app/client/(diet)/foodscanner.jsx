import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Camera } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { addClientDietAIAPI, scanFoodAPI } from "../../../services/clientApi";
import { toIndianISOString } from "../../../utils/basicUtilFunctions";
import { MaskedText } from "../../../components/ui/MaskedText";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import GrainConfettiAnimation from "../../../components/ui/ConfettiAnimation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isPureFreemium } from "../../../config/access";
import { useUser } from "../../../context/UserContext";
import PremiumBadge from "../../../components/ui/Payment/premiumbadge";

const { width, height } = Dimensions.get("window");

const SimpleFoodScanner = () => {
  const router = useRouter();
  const { selectedMeal, template, food_scan } = useLocalSearchParams();
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [dietTemplate, setDietTemplate] = useState([]);
  const [selectedMealData, setSelectedMealData] = useState(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  // Animation values
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);

  // Animation references for cleanup
  const animationRefs = useRef([]);
  const insets = useSafeAreaInsets();
  const { plan } = useUser();

  // Initialize template data from params
  useEffect(() => {
    if (selectedMeal) {
      try {
        const mealData = JSON.parse(selectedMeal);
        setSelectedMealData(mealData);
      } catch (error) {}
    }

    if (template) {
      try {
        const templateData = JSON.parse(template);
        setDietTemplate(templateData);
      } catch (error) {}
    }
  }, [selectedMeal, template]);

  // Request camera permission and launch camera on component mount
  useEffect(() => {
    const initializeCamera = async () => {
      await requestCameraPermission();
      // Auto-launch camera after permission is granted
      if (hasPermission === true) {
        setTimeout(() => {
          takePicture();
        }, 500); // Small delay to ensure state is set
      }
    };

    initializeCamera();
  }, [hasPermission]);

  // Start animations when scanning begins
  useEffect(() => {
    if (isScanning) {
      startScanAnimation();
    } else {
      // Stop all animations when not scanning
      stopAllAnimations();
    }

    // Cleanup on unmount
    return () => {
      stopAllAnimations();
    };
  }, [isScanning]);

  // Fade in animation for UI elements
  useEffect(() => {
    const fadeAnim = Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });
    fadeAnim.start();

    return () => {
      fadeAnim.stop();
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    } catch (error) {
      Alert.alert("Error", "Failed to request camera permission");
    }
  };

  const goTo = () => {
    if (Platform.OS === "ios") {
      setPremiumModalVisible(true);
    } else {
      router.push("/client/subscription");
    }
  };

  const stopAllAnimations = () => {
    // Stop all running animations
    animationRefs.current.forEach((anim) => {
      if (anim && anim.stop) {
        anim.stop();
      }
    });
    animationRefs.current = [];

    // Reset animation values
    scanLineAnimation.setValue(0);
  };

  const startScanAnimation = () => {
    // Clear any existing animations
    stopAllAnimations();

    // Scanner line animation (same for both iOS and Android)
    const scanLineAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    animationRefs.current = [scanLineAnim];
    scanLineAnim.start();
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        if (imageUri) {
          const imageData = { uri: imageUri };

          setCapturedImage(imageData);

          setIsScanning(true);

          // Pass the image data directly to avoid state timing issues
          setTimeout(() => {
            analyzeFood(imageData);
          }, 3000);
        } else {
          Alert.alert("Error", "Failed to get image. Please try again.");
        }
      } else {
        // User canceled, go back to previous screen
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture. Please try again.", [
        {
          text: "Try Again",
          onPress: () => takePicture(),
        },
        {
          text: "Cancel",
          onPress: () => router.back(),
          style: "cancel",
        },
      ]);
    }
  };

  const analyzeFood = async (imageData = capturedImage) => {
    try {
      if (!imageData?.uri) {
        setIsScanning(false);
        return;
      }
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        Alert.alert("Error", "Failed to analyze food. Please try again.");
      }
      const formData = new FormData();

      const imageFile = {
        uri: imageData.uri,
        type: "image/jpeg",
        name: "food_image.jpg",
      };

      formData.append("files", imageFile);
      if (food_scan === "true") {
        formData.append("food_scan", true);
        formData.append("client_id", clientId);
      }

      const response = await scanFoodAPI(formData);

      if (response?.status === 200) {
        setScanResults(response.data);
      } else {
        Alert.alert("Error", "Failed to analyze food. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to analyze food. Please try again.");
    } finally {
      // Stop animations properly

      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    // Stop all animations first
    stopAllAnimations();

    setCapturedImage(null);
    setScanResults(null);
    setIsScanning(false);

    // Auto-launch camera again
    setTimeout(() => {
      takePicture();
    }, 300);
  };

  const logFood = async () => {
    try {
      if (scanResults?.totals?.calories === 0) {
        showToast({
          type: "error",
          title: "No Food Detected",
          desc: "Please capture food images to log.",
        });
        return;
      }

      if (!selectedMealData) {
        showToast({
          type: "error",
          title: "No Meal Selected",
          desc: "Please select a meal category.",
        });
        return;
      }

      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error adding diet",
        });
        return;
      }

      const today = new Date();
      const todaySQL = toIndianISOString(today).split("T")[0]; // YYYY-MM-DD format
      const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

      // Create food item from scan results
      const newFood = {
        id: `${Date.now()}`,
        fat: scanResults.totals.fat_g || 0,
        name: scanResults.items?.join("+") || "Scanned Food",
        carbs: scanResults.totals.carbs_g || 0,
        fiber: scanResults.totals.fibre_g || 0,
        sugar: scanResults.totals.sugar_g || 0,
        protein: scanResults.totals.protein_g || 0,
        calories: scanResults.totals.calories || 0,
        quantity: "1 serving",
        image_url: "",
        calcium: scanResults.micro_nutrients?.calcium_mg || 0,
        magnesium: scanResults.micro_nutrients?.magnesium_mg || 0,
        sodium: scanResults.micro_nutrients?.sodium_mg || 0,
        potassium: scanResults.micro_nutrients?.potassium_mg || 0,
        iron: scanResults.micro_nutrients?.iron_mg || 0,
      };

      // Update the template with the new food
      const updatedTemplate = dietTemplate.map((meal) => {
        if (meal.id === selectedMealData.id) {
          return {
            ...meal,
            foodList: [...meal.foodList, newFood],
            itemsCount: meal.itemsCount + 1,
          };
        }
        return meal;
      });

      const payload = {
        client_id: clientId,
        date: todaySQL,
        scanner_data: scanResults,
        gym_id: gymId ? gymId : null,
        type: "scanner",
        meal_category: selectedMealData.title,
        // template_data: updatedTemplate
      };

      const response = await addClientDietAIAPI(payload);

      if (response?.status === 200) {
        const earnedXp = response?.reward_point || 0;
        const showFeedbackModal = response?.feedback || false;
        const showTargetModal = response?.target || false;

        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
        } else {
          setXpRewardVisible(false);
        }

        if (!earnedXp) {
          showToast({
            type: "success",
            title: "Success",
            desc: `Food added to ${selectedMealData.title} successfully.`,
          });
          router.push({
            pathname: "/client/(diet)/myListedFoodLogs",
            params: {
              showTarget: showTargetModal ? "true" : "false",
              showFeedback:
                !showTargetModal && showFeedbackModal ? "true" : "false",
            },
          });

          setXpRewardVisible(false);
        } else {
          setTimeout(() => {
            router.push({
              pathname: "/client/(diet)/myListedFoodLogs",
              params: {
                showTarget: showTargetModal ? "true" : "false",
                showFeedback:
                  !showTargetModal && showFeedbackModal ? "true" : "false",
              },
            });

            setXpRewardVisible(false);
          }, 3000);
        }

        return response;
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error adding diet",
        });
      }
    } catch (error) {}
  };

  // Permission loading state
  if (hasPermission === null) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
        ]}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.gradientContainer}
        >
          <Animated.View
            style={[styles.centerContainer, { opacity: fadeAnimation }]}
          >
            <View style={styles.loadingIcon}>
              <Ionicons name="camera" size={64} color="#fff" />
            </View>
            <Text style={styles.permissionText}>
              Requesting camera permission...
            </Text>
            <View style={styles.loadingDots}>
              {[...Array(3)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.loadingDot,
                    {
                      opacity: fadeAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
        ]}
      >
        <LinearGradient
          colors={["#ff6b6b", "#ee5a24"]}
          style={styles.gradientContainer}
        >
          <Animated.View
            style={[styles.centerContainer, { opacity: fadeAnimation }]}
          >
            <View style={styles.errorIcon}>
              <Ionicons name="camera" size={64} color="#fff" />
            </View>
            <Text style={styles.permissionText}>Camera access denied</Text>
            <Text style={styles.permissionSubText}>
              Please enable camera permissions in your device settings to scan
              food
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={requestCameraPermission}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                style={styles.buttonGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Camera launching state (no image captured yet)
  if (!capturedImage) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
        ]}
      >
        <LinearGradient
          colors={["#1F9D6C", "#0B87CD"]}
          style={styles.gradientContainer}
        >
          <Animated.View
            style={[styles.centerContainer, { opacity: fadeAnimation }]}
          >
            <View style={styles.cameraIcon}>
              <Image
                source={require("../../../assets/images/diet/cam.png")}
                style={{ width: 80, height: 80 }}
              />
            </View>
            <Text style={styles.launchingText}>Launching Camera...</Text>
            <Text style={styles.launchingSubText}>
              Get ready to capture your delicious meal!
            </Text>

            {/* Manual capture button as fallback */}
            <TouchableOpacity
              style={styles.manualCaptureButton}
              onPress={takePicture}
            >
              <LinearGradient
                colors={["#FFFFFF", "#FFFFFF"]}
                style={styles.buttonGradient}
              >
                <Ionicons name="camera" size={18} color="#28A745" />
                <Text style={styles.manualCaptureText}>Take a Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Scanning view - Same for both iOS and Android
  if (isScanning) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.scanningContainer}>
          <Image source={{ uri: capturedImage.uri }} style={styles.fullImage} />

          <View style={styles.scanningOverlay}>
            {/* Scanner line that moves up and down */}
            <Animated.View
              style={[
                styles.scannerLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-height * 0.35, height * 0.35],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* Text container */}
            <View style={styles.scanTextContainer}>
              {/* Static sparkle near KyraAI */}
              <View style={styles.kyraAISparkle}>
                <Ionicons name="sparkles" size={20} color="#0C91FE" />
              </View>

              <MaskedText
                bg1="#1EBAF8"
                bg2="#006DFF"
                text={"KyraAI"}
                textStyle={styles.kyraAIText}
              >
                KyraAI
              </MaskedText>

              <Text style={styles.analyzingText}>
                is analyzing the food . . .
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Results view - Add comprehensive null checks
  if (!scanResults) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
        ]}
      >
        <LinearGradient
          colors={["#ff7675", "#fd79a8"]}
          style={styles.gradientContainer}
        >
          <View style={styles.centerContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={64} color="#fff" />
            </View>
            <Text style={styles.permissionText}>No scan results available</Text>
            <Text style={styles.permissionSubText}>
              Something went wrong during the analysis
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={resetScanner}>
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                style={styles.buttonGradient}
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      {xpRewardVisible ? (
        <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
      ) : (
        ""
      )}
      <View style={styles.resultsHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/client/home")}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaskedText
            bg2="#28A745"
            bg1="#007BFF"
            text={"KyraAI's Snap Results"}
          >
            KyraAI's Snap Results
          </MaskedText>
          {selectedMealData && (
            <Text style={styles.mealCategoryText}>
              Adding to: {selectedMealData.title}
            </Text>
          )}
        </View>
        {isPureFreemium(plan) ? (
          ""
        ) : (
          <TouchableOpacity style={styles.headerButton} onPress={resetScanner}>
            <Image
              source={require("../../../assets/images/diet/aicamera.png")}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.resultsContainer}>
        {/* Image preview */}
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: capturedImage?.uri }}
            style={styles.previewImage}
          />
        </View>

        {/* Detected foods */}
        {scanResults?.items && Array.isArray(scanResults.items) && (
          <View style={styles.detectedFoodsSection}>
            <View>
              <LinearGradient
                colors={["rgba(0, 123, 255, 0.05)", "rgba(40, 167, 69, 0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.sectionHeader,
                  {
                    backgroundColor: "rgba(0, 123, 255, 0.05)",
                    paddingTop: 10,
                    paddingBottom: 6,
                  },
                ]}
              >
                <Image
                  source={require("../../../assets/images/diet/detected.png")}
                  style={styles.sectionIcon}
                />
                <MaskedText
                  bg2="#28A745"
                  bg1="#007BFF"
                  text="Detected Foods"
                  textStyle={{ marginBottom: 6 }}
                >
                  Detected Foods
                </MaskedText>
              </LinearGradient>
            </View>
            <View style={styles.foodTagsContainer}>
              {scanResults.items?.map((item, index) => (
                <View key={index} style={styles.foodTagWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(0, 123, 255, 0.05)",
                      "rgba(40, 167, 69, 0.05)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.foodTag}
                  >
                    <Image
                      source={require("../../../assets/images/diet/tick.png")}
                      style={styles.tickIcon}
                    />
                    <Text style={styles.foodTagText}>{item}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Macro Nutrients */}
        {scanResults?.totals && (
          <View style={styles.macroNutrientsSection}>
            <LinearGradient
              colors={["rgba(0, 123, 255, 0.05)", "rgba(40, 167, 69, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionGradientBackground}
            >
              <View style={styles.macroSectionHeader}>
                <Image
                  source={require("../../../assets/images/diet/macro.png")}
                  style={[styles.sectionIcon, { width: 26, height: 26 }]}
                />
                <MaskedText
                  bg2="#28A745"
                  bg1="#007BFF"
                  text="Macro Nutrients"
                  textStyle={{ marginBottom: 6 }}
                >
                  Macro Nutrients
                </MaskedText>
              </View>

              {/* Calories Card */}
              <LinearGradient
                colors={["#28A745", "#007BFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.caloriesCard}
              >
                <View style={styles.caloriesContent}>
                  <Image
                    source={require("../../../assets/images/diet/calorie.png")}
                    style={styles.calorieIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.caloriesNumber}>
                    {scanResults.totals.calories || 0}
                  </Text>
                </View>
                <Text style={styles.caloriesLabel}>kcal</Text>
              </LinearGradient>

              {/* Macro Items Row */}
              <View style={styles.macroItemsRow}>
                <MacroNutrientItem
                  icon={require("../../../assets/images/diet/protein.png")}
                  value={`${scanResults.totals.protein_g || 0}g`}
                  label="Protein"
                />
                <MacroNutrientItem
                  icon={require("../../../assets/images/diet/carb.png")}
                  value={`${scanResults.totals.carbs_g || 0}g`}
                  label="Carbs"
                />
                <MacroNutrientItem
                  icon={require("../../../assets/images/diet/fat.png")}
                  value={`${scanResults.totals.fat_g || 0}g`}
                  label="Fat"
                />
                <MacroNutrientItem
                  icon={require("../../../assets/images/diet/fiber.png")}
                  value={`${scanResults.totals.fibre_g || 0}g`}
                  label="Fiber"
                />
                <MacroNutrientItem
                  icon={require("../../../assets/images/diet/sugar.png")}
                  value={`${scanResults.totals.sugar_g || 0}g`}
                  label="Sugar"
                />
              </View>

              {/* Micronutrients Section */}
              <View style={styles.micronutrientsSection}>
                <View style={styles.micronutrientsHeader}>
                  <MaskedText
                    bg2="#28A745"
                    bg1="#007BFF"
                    text="Micro Nutrients"
                    textStyle={{ fontSize: 14, fontWeight: "600" }}
                  >
                    Micro Nutrients
                  </MaskedText>
                  <View style={styles.micronutrientsDivider} />
                </View>
                <View style={styles.micronutrientsRow}>
                  <View style={styles.microItem}>
                    <View style={styles.microValueContainer}>
                      <Text style={styles.microValue}>
                        {Math.round(
                          scanResults.micro_nutrients?.calcium_mg || 0
                        )}
                      </Text>
                      <Text style={styles.microUnit}>mg</Text>
                    </View>
                    <Text style={styles.microLabel}>Calcium</Text>
                  </View>
                  <View style={styles.microItem}>
                    <View style={styles.microValueContainer}>
                      <Text style={styles.microValue}>
                        {Math.round(
                          scanResults.micro_nutrients?.magnesium_mg || 0
                        )}
                      </Text>
                      <Text style={styles.microUnit}>mg</Text>
                    </View>
                    <Text style={styles.microLabel}>Magnesium</Text>
                  </View>
                  <View style={styles.microItem}>
                    <View style={styles.microValueContainer}>
                      <Text style={styles.microValue}>
                        {Math.round(
                          scanResults.micro_nutrients?.sodium_mg || 0
                        )}
                      </Text>
                      <Text style={styles.microUnit}>mg</Text>
                    </View>
                    <Text style={styles.microLabel}>Sodium</Text>
                  </View>
                  <View style={styles.microItem}>
                    <View style={styles.microValueContainer}>
                      <Text style={styles.microValue}>
                        {Math.round(
                          scanResults.micro_nutrients?.potassium_mg || 0
                        )}
                      </Text>
                      <Text style={styles.microUnit}>mg</Text>
                    </View>
                    <Text style={styles.microLabel}>Potassium</Text>
                  </View>
                  <View style={styles.microItem}>
                    <View style={styles.microValueContainer}>
                      <Text style={styles.microValue}>
                        {Math.round(scanResults.micro_nutrients?.iron_mg || 0)}
                      </Text>
                      <Text style={styles.microUnit}>mg</Text>
                    </View>
                    <Text style={styles.microLabel}>Iron</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Insights Section */}
        {scanResults?.insights && (
          <View style={styles.insightsSection}>
            <View>
              <LinearGradient
                colors={["rgba(0, 123, 255, 0.05)", "rgba(40, 167, 69, 0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.sectionHeader,
                  {
                    backgroundColor: "rgba(0, 123, 255, 0.05)",
                    paddingTop: 10,
                    paddingBottom: 6,
                  },
                ]}
              >
                <Image
                  source={require("../../../assets/images/diet/detected.png")}
                  style={styles.sectionIcon}
                />
                <MaskedText
                  bg2="#28A745"
                  bg1="#007BFF"
                  text="Insights"
                  textStyle={{ marginBottom: 6 }}
                >
                  Insights
                </MaskedText>
              </LinearGradient>
            </View>
            <LinearGradient
              colors={["rgba(0, 123, 255, 0.05)", "rgba(40, 167, 69, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.insightsSectionGradient}
            >
              <View style={styles.insightsContent}>
                {scanResults.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Log Food Button */}
        <TouchableOpacity onPress={isPureFreemium(plan) ? goTo : logFood}>
          <LinearGradient
            colors={["rgba(0, 123, 255, 0.1)", "rgba(40, 167, 69, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logFoodButton}
          >
            <MaskedText
              bg2="#28A745"
              bg1="#007BFF"
              text="Log Food"
              textStyle={{ fontSize: 16, fontWeight: "bold" }}
            >
              Log Food
            </MaskedText>

            <Image
              source={require("../../../assets/images/diet/arrow.png")}
              style={styles.arrowIcon}
              contentFit="contain"
            />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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

// Helper component for macro nutrients
const MacroNutrientItem = ({ icon, value, label }) => (
  <View style={styles.macroNutrientItem}>
    <Image
      source={icon}
      style={[styles.macroIcon, label === "Sugar" && styles.extraLarge]}
      contentFit="contain"
    />
    <Text style={styles.macroValue}>{value}</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradientContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  cameraIcon: {
    width: 150,
    height: 150,
    borderRadius: 70,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
    marginBottom: 12,
  },
  permissionSubText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  launchingText: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
    marginBottom: 12,
  },
  launchingSubText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 10,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  manualCaptureButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  manualCaptureText: {
    color: "#28A745",
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingDots: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  scanningContainer: {
    flex: 1,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannerLine: {
    position: "absolute",
    width: width * 0.85,
    height: 3,
    backgroundColor: "#00FF00",
    shadowColor: "#00FF00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  scanTextContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: height * 0.5,
    position: "relative",
  },
  kyraAISparkle: {
    position: "absolute",
    top: -15,
    right: width * 0.05,
    zIndex: 2,
  },
  kyraAIText: {
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
  },
  analyzingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    opacity: 0.9,
    fontWeight: "500",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  mealCategoryText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  imagePreview: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: "100%",
    height: width >= 786 ? 350 : 200,
  },
  detectedFoodsSection: {
    marginBottom: 16,
    marginTop: 8,
  },
  macroNutrientsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionGradientBackground: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  macroSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  foodTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  foodTagWrapper: {
    borderRadius: 8,
    overflow: "hidden",
  },
  foodTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tickIcon: {
    width: 12,
    height: 12,
    marginRight: 6,
  },
  foodTagText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  caloriesCard: {
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  caloriesContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  calorieIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  caloriesNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  caloriesLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  macroItemsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroNutrientItem: {
    alignItems: "center",
    flex: 1,
  },
  macroIcon: {
    width: 24,
    height: 24,
    marginBottom: 6,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: "#666",
  },
  // Micronutrients styles
  micronutrientsSection: {
    marginTop: 16,
  },
  micronutrientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  micronutrientsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginLeft: 12,
  },
  micronutrientsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  microItem: {
    alignItems: "center",
    flex: 1,
  },
  microValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  microValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  microUnit: {
    fontSize: 10,
    color: "#666",
    marginLeft: 2,
  },
  microLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  // Insights Section Styles
  insightsSection: {
    marginHorizontal: 0,
    marginTop: 16,
    marginBottom: 16,
  },
  insightsSectionGradient: {
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  insightIcon: {
    width: 24,
    height: 24,
  },
  insightsContent: {
    gap: 12,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  insightBullet: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  logFoodButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logFoodText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "600",
  },
  extraLarge: {
    width: 32,
  },
  // iOS Premium Animation Styles
  iosPremiumOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  iosScannerLine: {
    position: "absolute",
    width: width * 0.8,
    height: 2,
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    borderRadius: 1,
  },
  iosBreathingCard: {
    backgroundColor: "rgba(20,20,30,0.95)",
    paddingHorizontal: 50,
    paddingVertical: 40,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.3)",
    overflow: "hidden",
  },
  iosShimmerOverlay: {
    position: "absolute",
    top: 0,
    left: -50,
    width: 100,
    height: "100%",
    backgroundColor: "rgba(0,122,255,0.2)",
    transform: [{ skewX: "-20deg" }],
  },
  iosTitleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  iosPremiumTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0,122,255,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  iosGlowLine: {
    width: 60,
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 2,
    marginTop: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  iosPremiumSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "500",
  },
  iosSequentialDots: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 25,
  },
  iosSequentialDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  iosProgressContainer: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(0,122,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  iosProgressBar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  // iOS-specific simple scanning styles (keeping for backup)
  iosSimpleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  iosLoadingContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iosAnalyzingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 8,
  },
  iosAnalyzingSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  iosLoadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  iosStaticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#28A745",
    opacity: 0.8,
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

export default SimpleFoodScanner;
