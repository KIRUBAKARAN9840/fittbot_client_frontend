import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  Linking,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaskedText } from "../../components/ui/MaskedText";
import SubscriptionComparison from "../../components/ui/Payment/SubscriptionComparison";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGymMembershipCheckout } from "../../hooks/useGymMembershipCheckout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../utils/Toaster";
import { rewardApplyAPI } from "../../services/clientApi";
import { safeParseJSON } from "../../utils/safeHelpers";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "@react-navigation/native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Manual date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const GymPay = () => {
  const router = useRouter();
  const {
    gymName,
    location,
    selectedPlanId,
    selectedPlanPrice,
    selectedPlanType,
    selectedPlanDuration,
    gymPlans,
    gym_id,
    passPrice,
    discountPrice,
    discount,
  } = useLocalSearchParams();
  const { start, busy } = useGymMembershipCheckout();
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(selectedPlanId);
  const [selectedFittbotPlan, setSelectedFittbotPlan] = useState("1");
  const [rewardsApplied, setRewardsApplied] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [availableRewards, setAvailableRewards] = useState(0);
  const [paymentModal, setPaymentModal] = useState({
    visible: false,
    success: false,
    data: null,
    loading: false,
  });
  const intervalRef = useRef(null);

  // Parse gym plans from params or use default
  const parsedGymPlans = safeParseJSON(gymPlans, []);

  // Fittbot plan data
  const fittbotPlanData = {
    1: {
      name: "Gold Plan",
      duration: "1 Month",
      mrp: 398,
      discountedPrice: 199,
      savePercentage: 50,
      dailyRate: 6.6,
    },
    12: {
      name: "Diamond Plan",
      duration: "12 Months",
      mrp: 398,
      discountedPrice: 159,
      savePercentage: 60,
      dailyRate: 5.2,
    },
    6: {
      name: "Platinum Plan",
      duration: "6 Months",
      mrp: 398,
      discountedPrice: 179,
      savePercentage: 55,
      dailyRate: 5.9,
    },
  };

  // Get selected gym plan details
  const getSelectedGymPlan = () => {
    return (
      parsedGymPlans.find((plan) => plan.id.toString() === selectedPlan) ||
      parsedGymPlans[0]
    );
  };

  // Calculate eligibility based on fittbot_plan_offer data
  const calculateFittbotPlanEligibility = () => {
    const selectedGymPlan = getSelectedGymPlan();

    // Check if this plan has fittbot_plan_offer
    if (selectedGymPlan?.fittbot_plan_offer?.can_offer_fittbot_plan) {
      const fittbotOffer = selectedGymPlan.fittbot_plan_offer.fittbot_plan;
      return {
        isEligible: true,
        freeMonths: fittbotOffer.duration,
        needsPurchase: false,
        fittbotPlanData: fittbotOffer,
      };
    } else {
      // // Fallback to original calculation if no fittbot_plan_offer
      // const gymPlanPrice = selectedGymPlan.price;
      // const tenPercent = gymPlanPrice * 0.1;
      // if (tenPercent < 199) {
      //   return { isEligible: false, freeMonths: 0, needsPurchase: true };
      // } else if (tenPercent >= 1908) {
      //   return { isEligible: true, freeMonths: 12, needsPurchase: false };
      // } else if (tenPercent >= 1074) {
      //   return { isEligible: true, freeMonths: 6, needsPurchase: false };
      // } else if (tenPercent >= 597) {
      //   return { isEligible: true, freeMonths: 3, needsPurchase: false };
      // } else {
      //   return { isEligible: true, freeMonths: 1, needsPurchase: false };
      // }
    }
  };

  const eligibility = calculateFittbotPlanEligibility();

  // Get Fittbot subscription cost
  const getFittbotSubscriptionCost = () => {
    if (eligibility.needsPurchase) {
      const plan = fittbotPlanData[selectedFittbotPlan];
      switch (selectedFittbotPlan) {
        case "1":
          return plan.discountedPrice; // ₹199 for 1 month
        case "6":
          return plan.discountedPrice * 6; // ₹179 * 6 = ₹1074
        case "12":
          return plan.discountedPrice * 12; // ₹159 * 12 = ₹1908
        default:
          return plan.discountedPrice;
      }
    }
    return 0; // Free
  };

  // Get plan styles for selection
  const getPlanStyles = (planId, isGymPlan = false) => {
    const isSelected = isGymPlan
      ? selectedPlan === planId
      : selectedFittbotPlan === planId;

    if (isGymPlan) {
      return {
        borderColor: isSelected ? "#007BFF" : "#eee",
        borderWidth: isSelected ? 2 : 1,
        transform: isSelected ? [{ scale: 1.02 }] : [{ scale: 1 }],
        elevation: isSelected ? 12 : 8,
      };
    } else {
      switch (planId) {
        case "1":
          return {
            backgroundColor: isSelected ? "#FFFBF0" : "#FFF",
            borderColor: "#FFD700",
            borderWidth: isSelected ? 2 : 0,
          };
        case "12":
          return {
            backgroundColor: isSelected ? "#FFF0F5" : "#FFF",
            borderColor: "#E91E63",
            borderWidth: isSelected ? 2 : 0,
          };
        case "6":
          return {
            backgroundColor: isSelected ? "#F8FAFF" : "#FFF",
            borderColor: "#1565C0",
            borderWidth: isSelected ? 2 : 0,
          };
        default:
          return {
            backgroundColor: "#FFF",
            borderWidth: 0,
          };
      }
    }
  };

  // Calculate totals
  const gymPlanCost = getSelectedGymPlan()?.price || 0;
  const fittbotSubscriptionCost = getFittbotSubscriptionCost();
  const rewardDiscount = availableRewards;
  const finalPayment = rewardsApplied
    ? gymPlanCost + fittbotSubscriptionCost - rewardDiscount
    : gymPlanCost + fittbotSubscriptionCost;

  const handleBack = useCallback(() => {
    router.push({
      pathname: "/client/gymdetails",
      params: {
        gym_id: gym_id,
        passPrice: passPrice,
        discountPrice: discountPrice,
        discount: discount,
      },
    });
  }, [router, gym_id, passPrice, discountPrice, discount]);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [handleBack])
  );

  const handleApplyRewards = () => {
    if (availableRewards > 0) {
      setRewardsApplied(true);
    }
  };

  const handleRemoveRewards = () => {
    setRewardsApplied(false);
  };

  // Fetch available rewards
  const fetchRewards = async () => {
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) return;

      const selectedGymPlan = getSelectedGymPlan();
      if (!selectedGymPlan?.price) return;

      const actualAmount = selectedGymPlan.price;

      const response = await rewardApplyAPI({
        client_id,
        amount: actualAmount,
      });

      if (response?.status === 200) {
        setAvailableRewards(response?.rewards || 0);
      } else {
        setAvailableRewards(0);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      setAvailableRewards(0);
    }
  };

  const handlePayNow = async () => {
    try {
      // Show loading
      setPaymentModal({
        visible: true,
        success: false,
        data: null,
        loading: true,
      });

      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        setPaymentModal({
          visible: true,
          success: false,
          data: null,
          loading: false,
        });
        return;
      }

      const selectedGymPlanData = getSelectedGymPlan();
      const fittbotPlanId = selectedGymPlanData?.fittbot_plan_offer?.fittbot_plan?.id;

      const res = await start({
        gym_id,
        selectedPlan,
        client_id,
        themeColor: "#0ea5e9",
        description: "Secure checkout via Razorpay",
        selectedPlanPrice: fittbotPlanId,
        reward: rewardsApplied,
      });

      setTimeout(() => {
        if (res?.ok) {
          setPaymentModal({
            visible: true,
            success: true,
            data: res?.data,
            loading: false,
          });
        } else {
          setPaymentModal({
            visible: true,
            success: false,
            data: res,
            loading: false,
          });
        }
      }, 0);
    } catch (e) {
      console.error("Payment error:", e);
      setTimeout(() => {
        setPaymentModal({
          visible: true,
          success: false,
          data: null,
          loading: false,
        });
      }, 0);
    }
  };

  const handleClose = () => {
    setPaymentModal({
      visible: false,
      success: false,
      data: null,
      loading: false,
    });
  };

  const handleCopyOrderId = async () => {
    try {
      await Clipboard.setStringAsync(paymentModal.data?.orderId || "");
      showToast({
        type: "success",
        title: "Copied",
        desc: "Order ID copied to clipboard",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to copy Order ID",
      });
    }
  };

  const handleEmailPress = () => {
    const email = "support@fittbot.com";
    const subject = paymentModal.data?.orderId
      ? `Payment Issue - Order ID: ${paymentModal.data.orderId}`
      : "Payment Issue";
    const body = paymentModal.data?.orderId
      ? `Hi,\n\nI'm facing an issue with my gym membership payment.\n\nOrder ID: ${paymentModal.data.orderId}\n\nPlease help me resolve this.\n\nThank you.`
      : "Hi,\n\nI'm facing an issue with my gym membership payment.\n\nPlease help me resolve this.\n\nThank you.";

    const mailto = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto).catch(() => {
      showToast({
        type: "error",
        title: "Error",
        desc: "Could not open email app",
      });
    });
  };

  const handleGoToActivation = () => {
    setPaymentModal({
      visible: false,
      success: false,
      data: null,
      loading: false,
    });
    router.replace("/unpaid/activateaccount");
  };

  // Auto-redirect countdown effect
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (paymentModal.visible && paymentModal.success && !paymentModal.loading) {
      // Reset countdown
      setCountdown(5);

      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Clear interval before navigation
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Navigate after countdown
            setTimeout(() => {
              handleGoToActivation();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paymentModal.visible, paymentModal.success, paymentModal.loading]);

  const btnDisabled = busy;

  const insets = useSafeAreaInsets();
  // Scroll to selected plan on mount and when selection changes
  const scrollViewRef = useRef(null);

  const scrollToSelectedPlan = (planId) => {
    const planIndex = parsedGymPlans.findIndex(
      (plan) => plan.id.toString() === planId
    );
    if (planIndex !== -1 && scrollViewRef.current) {
      const cardWidth = 260; // Current card width
      const cardMargin = 15; // Margin between cards
      const totalCardWidth = cardWidth + cardMargin;
      const scrollOffset = planIndex * totalCardWidth;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: scrollOffset,
          animated: true,
        });
      }, 100);
    }
  };

  // Scroll to initially selected plan on mount
  useEffect(() => {
    if (selectedPlanId) {
      scrollToSelectedPlan(selectedPlanId);
    }
  }, [selectedPlanId]);

  // Scroll to selected plan when selection changes
  useEffect(() => {
    if (selectedPlan) {
      scrollToSelectedPlan(selectedPlan);
    }
  }, [selectedPlan]);

  // Fetch rewards on mount
  useEffect(() => {
    fetchRewards();
  }, []);

  // Fetch rewards when plan changes
  useEffect(() => {
    if (selectedPlan) {
      fetchRewards();
      // Reset rewards applied when plan changes
      setRewardsApplied(false);
    }
  }, [selectedPlan]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Gym Info Section */}
        <View style={styles.gymInfoSection}>
          <Text style={styles.gymName}>{gymName || ""}</Text>
        </View>

        {/* Gym Plans Slider */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>
            Chose Your Gym Membership & Get{"  "}
            <Text style={{ color: "#FF5757", fontSize: 14 }}>FREE *</Text>{" "}
            Fittbot Subscription
          </Text>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalPlansList}
          >
            {parsedGymPlans.map((plan, index) => {
              // Helper functions for plan card
              const getBonusText = () => {
                if (!plan.bonus || plan.bonus === 0) return null;
                const count = plan.bonus;
                const type = plan.bonusType;
                if (type === "month") {
                  return count === 1 ? "1 Month Free" : `${count} Months Free`;
                } else if (type === "day") {
                  return count === 1 ? "1 Day Free" : `${count} Days Free`;
                }
                return null;
              };

              const getBelowBonusText = () => {
                if (!plan.bonus || plan.bonus === 0) return null;
                const count = plan.bonus;
                const type = plan.bonusType;
                if (type === "month") {
                  return count === 1 ? "1 Month" : `${count} Months`;
                } else if (type === "day") {
                  return count === 1 ? "1 Day" : `${count} Days`;
                }
                return null;
              };

              const getPauseText = () => {
                if (!plan.pause || plan.pause === 0) return null;
                const count = plan.pause;
                const type = plan.pauseType;
                if (type === "month") {
                  return count === 1 ? "1 Month" : `${count} Months`;
                } else if (type === "day") {
                  return count === 1 ? "1 Day" : `${count} Days`;
                }
                return null;
              };

              const getDiscountPercentage = () => {
                if (!plan.originalPrice || plan.originalPrice === plan.price)
                  return null;
                const discount = Math.round(
                  ((plan.originalPrice - plan.price) / plan.originalPrice) * 100
                );
                return discount > 0 ? discount : null;
              };

              const getDurationText = () => {
                if (typeof plan.duration === "string") return plan.duration;
                const months = plan.duration;
                return months === 1 ? "1 Month" : `${months} Months`;
              };

              const bonusText = getBonusText();
              const belowBonusText = getBelowBonusText();
              const pauseText = getPauseText();
              const discountPercentage = getDiscountPercentage();
              const hasOriginalPrice =
                plan.originalPrice && plan.originalPrice !== plan.price;

              return (
                <View key={plan.id} style={styles.planWrapper}>
                  <View style={styles.planCardWrapper}>
                    {/* Discount Badge */}
                    {discountPercentage && (
                      <View style={styles.offerBadgeContainer}>
                        <View style={styles.offerBadgeRight}>
                          <Text style={styles.offerBadgeRightText}>
                            {discountPercentage}% OFF
                          </Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.gymPlanCard,
                        getPlanStyles(plan.id.toString(), true),
                      ]}
                      onPress={() => setSelectedPlan(plan.id.toString())}
                    >
                      <View style={styles.planHeader}>
                        {/* Duration with inline bonus */}
                        <View style={styles.durationRow}>
                          <Text style={styles.planType}>
                            {getDurationText()}
                          </Text>
                          {bonusText && (
                            <View style={styles.bonusBadge}>
                              <Text style={styles.bonusBadgeText}>
                                +{bonusText}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Pricing Section - Compact */}
                        {hasOriginalPrice ? (
                          <View style={styles.priceRow}>
                            <View style={styles.currentPriceBox}>
                              <Text style={styles.currency}>₹</Text>
                              <Text style={styles.price}>{plan.price}</Text>
                            </View>
                            <View style={styles.originalPriceBox}>
                              <Text style={styles.originalPriceText}>
                                ₹{plan.originalPrice}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.singlePriceRow}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.price}>{plan.price}</Text>
                          </View>
                        )}
                      </View>

                      {/* Fittbot Plan Offer */}
                      {plan?.fittbot_plan_offer?.can_offer_fittbot_plan && (
                        <View
                          style={[
                            styles.summaryRowCard,
                            { position: "relative" },
                          ]}
                        >
                          <LinearGradient
                            colors={["#22C55E", "#22C55E"]}
                            style={styles.complementaryBadge}
                          >
                            <Text style={styles.complementaryBadgeText}>
                              FREE
                            </Text>
                          </LinearGradient>
                          <View style={styles.summaryLeftCard}>
                            <Image
                              source={require("../../assets/images/free_logo_gym.png")}
                              style={styles.iconImageCard}
                            />
                            <Text style={styles.summaryTextCard}>
                              Fittbot{" "}
                              <Text style={{ color: "#FF5757" }}>
                                {plan.fittbot_plan_offer.fittbot_plan.duration}M
                                Subscription
                              </Text>
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.summaryAmountCard,
                              styles.freeAmountCard,
                            ]}
                          >
                            ₹
                            {plan.fittbot_plan_offer.fittbot_plan.price_rupees?.toString()}
                          </Text>
                        </View>
                      )}

                      {/* Bonus and Pause Cards */}
                      <View style={styles.benefitsCardsContainer}>
                        {/* Duration + Bonus Card - Always reserve space */}
                        {belowBonusText ? (
                          <View style={styles.benefitCard}>
                            <MaterialIcons
                              name="check"
                              size={18}
                              color="#4CAF50"
                            />
                            <Text style={styles.benefitCardText}>
                              {getDurationText()} +{belowBonusText}{" "}
                              <Text style={styles.benefitCardBonusText}>
                                Bonus
                              </Text>
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.benefitCardEmpty} />
                        )}

                        {/* Pause Card - Always reserve space */}
                        {pauseText ? (
                          <View style={styles.benefitCard}>
                            <MaterialIcons
                              name="check"
                              size={18}
                              color="#4CAF50"
                            />
                            <Text style={styles.benefitCardText}>
                              {pauseText}{" "}
                              <Text style={styles.benefitCardBonusText}>
                                Pause
                              </Text>{" "}
                              Available
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.benefitCardEmpty} />
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setSelectedPlan(plan.id.toString())}
                      >
                        <LinearGradient
                          colors={
                            selectedPlan === plan.id.toString()
                              ? ["#4CAF50", "#45A049"]
                              : ["#007BFF", "#0056b3"]
                          }
                          style={styles.selectButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.selectButtonText}>
                            {selectedPlan === plan.id.toString()
                              ? "Selected"
                              : "Select Now"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <View style={styles.featuresContainer}>
                        {[0, 1, 2].map((idx) => {
                          const feature = plan.features[idx];
                          return feature ? (
                            <View key={idx} style={styles.featureRow}>
                              <MaterialIcons
                                name="check"
                                size={16}
                                color="#4CAF50"
                              />
                              <Text
                                style={styles.featureText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {feature.trim()}
                              </Text>
                              {idx === 2 &&
                                plan.allServices &&
                                plan.allServices.length > 3 && (
                                  <Text style={styles.moreServicesInlineText}>
                                    +{plan.allServices.length - 3} more
                                  </Text>
                                )}
                            </View>
                          ) : (
                            <View key={idx} style={styles.featureRowEmpty} />
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* <Text style={styles.headFit}>Fittbot Plans</Text> */}

        {/* Subscription Comparison */}
        {/* <SubscriptionComparison /> */}

        {/* Fittbot Plan Selection - Show based on eligibility */}
        {eligibility.needsPurchase ? (
          <View style={styles.fittbotPlanSection}>
            <View style={styles.plansRow}>
              {/* 1 Month Plan */}
              <View style={styles.planColumn}>
                <TouchableOpacity
                  style={[styles.fittbotPlanCard, getPlanStyles("1")]}
                  onPress={() => setSelectedFittbotPlan("1")}
                >
                  <View style={styles.planContent}>
                    <Text style={styles.planTitle}>1 Month</Text>
                    <Text style={styles.saveText}>Save 50%</Text>
                    <Text style={styles.originalPrice}>₹398</Text>
                    <Text style={styles.currentPrice}>₹199</Text>
                    <Text style={styles.perMonthText}>Per Month</Text>
                    <Text style={styles.inclGst}>*incl gst</Text>
                  </View>
                  {selectedFittbotPlan === "1" ? (
                    <View style={styles.checkMark}>
                      <MaterialIcons name="check" size={16} color="#FFF" />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </TouchableOpacity>
                <Text style={styles.dailyRate}>
                  Start Now at{" "}
                  <Text style={{ color: "#4CAF50", fontSize: 12 }}>₹6.6</Text>{" "}
                  day
                </Text>
              </View>

              <View style={styles.planColumn}>
                <TouchableOpacity
                  style={[styles.fittbotPlanCard, getPlanStyles("12")]}
                  onPress={() => setSelectedFittbotPlan("12")}
                >
                  <View style={styles.powerPackBadge}>
                    <Text style={styles.powerPackText}>Power Pack</Text>
                  </View>
                  <View style={styles.planContent}>
                    <Text style={styles.planTitle}>12 Months</Text>
                    <Text style={styles.saveText}>Save 60%</Text>
                    <Text style={styles.originalPrice}>₹398</Text>
                    <Text style={styles.currentPrice}>₹159</Text>
                    <Text style={styles.perMonthText}>Per Month</Text>
                    <Text style={styles.inclGst}>*incl gst</Text>
                  </View>
                  {selectedFittbotPlan === "12" ? (
                    <View style={styles.checkMark}>
                      <MaterialIcons name="check" size={16} color="#FFF" />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </TouchableOpacity>
                <Text style={styles.dailyRate}>
                  Get Strong at{" "}
                  <Text style={{ color: "#4CAF50", fontSize: 12 }}>₹5.2</Text>{" "}
                  day
                </Text>
              </View>

              {/* 6 Month Plan */}
              <View style={styles.planColumn}>
                <TouchableOpacity
                  style={[styles.fittbotPlanCard, getPlanStyles("6")]}
                  onPress={() => setSelectedFittbotPlan("6")}
                >
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                  <View style={styles.planContent}>
                    <Text style={styles.planTitle}>6 Months</Text>
                    <Text style={styles.saveText}>Save 55%</Text>
                    <Text style={styles.originalPrice}>₹398</Text>
                    <Text style={styles.currentPrice}>₹179</Text>
                    <Text style={styles.perMonthText}>Per Month</Text>
                    <Text style={styles.inclGst}>*incl gst</Text>
                  </View>
                  {selectedFittbotPlan === "6" ? (
                    <View style={styles.checkMark}>
                      <MaterialIcons name="check" size={16} color="#FFF" />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </TouchableOpacity>
                <Text style={styles.dailyRate}>
                  Stay Fit Under{" "}
                  <Text style={{ color: "#4CAF50", fontSize: 12 }}>₹5.9</Text>{" "}
                  day
                </Text>
              </View>

              {/* 12 Month Plan */}
            </View>
          </View>
        ) : (
          /* Free Fittbot Plan */
          <View style={styles.freePlanSection}>
            <View style={styles.freePlanCard}>
              <View style={styles.freeTag}>
                <Text style={styles.freeTagText}>Save 100%</Text>
              </View>
              <Text style={styles.freePlanTitle}>
                Fittbot {eligibility.freeMonths} Month Subscription FREE
              </Text>
              <Text style={styles.originalFreePrice}>
                ₹{eligibility.fittbotPlanData.price_rupees}
              </Text>
              {/* <Text style={styles.freePlanPrice}>FREE</Text> */}
              <Image
                source={require("../../assets/images/FREE.png")}
                style={styles.iconImageFree}
              />
              <Text style={styles.freePlanDuration}>
                {eligibility.freeMonths} Month
              </Text>
            </View>
          </View>
        )}

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsLeft}>
              <MaterialCommunityIcons name="gift" size={20} color="#FF5757" />
              <View style={styles.rewardsTextContainer}>
                <Text style={styles.rewardsHeading}>Rewards</Text>
                <Text style={styles.rewardsText}>
                  You can use ₹{rewardDiscount} Fittbot Cash
                </Text>
              </View>
            </View>
            {!rewardsApplied ? (
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  availableRewards === 0 && styles.applyButtonDisabled,
                ]}
                onPress={handleApplyRewards}
                disabled={availableRewards === 0}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.removeBadge}
                onPress={handleRemoveRewards}
              >
                <Text style={styles.removeText}>Remove</Text>
                <MaterialIcons name="close" size={16} color="#FF5757" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.summarySection}>
          <LinearGradient
            colors={["#FF5757", "#FFFFFF"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaskedText
              bg2="#FFFFFF"
              bg1="#FFFFFF"
              text="Final Payment"
              textStyle={styles.sectionHeaderText}
            >
              Final Payment
            </MaskedText>
          </LinearGradient>

          <View style={styles.summaryCard}>
            {/* Gym Membership Cost */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <MaterialIcons
                  name="fitness-center"
                  size={20}
                  color="#FF5757"
                />
                <Text style={styles.summaryText}>
                  {getSelectedGymPlan().duration} Month{" "}
                  {selectedPlanType || "Gym Membership"}
                </Text>
              </View>
              <Text style={styles.summaryAmount}>₹{gymPlanCost}</Text>
            </View>

            {/* Fittbot Subscription Cost */}
            {eligibility.needsPurchase ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.iconImage}
                  />
                  <Text style={styles.summaryText}>
                    Fittbot {fittbotPlanData[selectedFittbotPlan]?.duration}{" "}
                    Subscription
                  </Text>
                </View>
                <Text style={styles.summaryAmount}>
                  ₹{fittbotSubscriptionCost}
                </Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.iconImage}
                  />
                  <Text style={styles.summaryText}>
                    Fittbot {eligibility.freeMonths}M Subscription
                  </Text>
                </View>
                <View style={styles.freeAmountContainer}>
                  <Text style={[styles.summaryAmount, styles.freeAmount]}>
                    ₹{eligibility.fittbotPlanData?.price_rupees || 398}
                  </Text>
                  <Text style={styles.freeBadgeSmall}>FREE</Text>
                </View>
              </View>
            )}

            {/* Rewards Redemption */}
            {rewardsApplied && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <MaterialCommunityIcons
                    name="gift"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.summaryText}>Rewards Redemption</Text>
                </View>
                <Text style={[styles.summaryAmount, styles.discountAmount]}>
                  ₹{rewardDiscount}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Final Payment */}
            <View style={styles.finalPaymentRow}>
              <View style={styles.summaryLeft}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={20}
                  color="#007BFF"
                />
                <Text style={styles.finalPaymentText}>Final Payment</Text>
              </View>
              <Text style={styles.finalPaymentAmount}>₹{finalPayment}</Text>
            </View>
          </View>
        </View>

        {/* Buy Now Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.payNowButton}
            onPress={handlePayNow}
            disabled={btnDisabled}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#007BFF", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payNowGradient}
            >
              <Text style={styles.payNowText}>Buy Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Result Modal */}
      <Modal
        visible={paymentModal.visible}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {paymentModal.loading ? (
              // Loading state
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Processing Payment...</Text>
              </View>
            ) : paymentModal.success ? (
              // Success state
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <View style={styles.successIcon}>
                    <MaterialIcons name="check" size={40} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successMessage}>
                  Your gym membership has been activated{"\n"}successfully
                </Text>

                {/* Compact Payment Details */}
                <View style={styles.compactDetailsContainer}>
                  <View style={styles.compactDetailRow}>
                    <Text style={styles.compactLabel}>Purchased at:</Text>
                    <Text style={styles.compactValue}>
                      {formatDate(paymentModal.data?.purchased_at)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.compactViewPassesButton}
                  onPress={handleGoToActivation}
                >
                  <Text style={styles.compactViewPassesButtonText}>
                    View Membership {countdown > 0 && `(${countdown})`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Failure state
              <View style={styles.failureContainer}>
                <View style={styles.failureIconContainer}>
                  <MaterialIcons name="error" size={60} color="#FF5757" />
                </View>
                <Text style={styles.failureTitle}>Payment Failed</Text>
                <Text style={styles.failureMessage}>
                  {
                    "Payment not received. Please try again or contact support if the issue persists."
                  }
                </Text>

                {paymentModal.data?.orderId && (
                  <View style={styles.failureDetailsContainer}>
                    <Text style={styles.failureOrderIdLabel}>Order ID:</Text>
                    <TouchableOpacity
                      style={styles.orderIdCopyRow}
                      onPress={handleCopyOrderId}
                    >
                      <Text style={styles.failureOrderId}>
                        {paymentModal.data.orderId}
                      </Text>
                      <Ionicons
                        name="copy-outline"
                        size={18}
                        color="#007BFF"
                        style={styles.copyIcon}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.supportContainer}>
                  <Text style={styles.supportText}>
                    Please contact support with Order ID at{" "}
                    <Text
                      style={styles.supportEmail}
                      onPress={handleEmailPress}
                    >
                      support@fittbot.com -Click here to proceed
                    </Text>
                  </Text>
                </View>

                <View style={styles.failureButtonsContainer}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GymPay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 5,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: Platform.OS === "ios" ? 0 : 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  gymInfoSection: {
    backgroundColor: "#FEFEFE",
    paddingVertical: 5,
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
    backgroundColor: "#faf6f68f",
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "rgba(0,0,0,0.5)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  gymLocation: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
    flex: 1,
    lineHeight: 12,
  },
  plansSection: {
    backgroundColor: "#FFF",
    paddingTop: 20,
    paddingBottom: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7B7B7B",
    marginBottom: 15,
    paddingLeft: 20,
    paddingRight: 10,
  },
  horizontalPlansList: {
    paddingHorizontal: 20,
  },
  planWrapper: {
    marginRight: 15,
  },
  planCardWrapper: {
    width: 260,
    position: "relative",
    marginVertical: 10,
  },
  gymPlanCard: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 0,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  offerBadgeContainer: {
    position: "absolute",
    top: 0,
    right: 1,
    flexDirection: "row",
    zIndex: 10,
    borderRadius: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: "hidden",
  },
  offerBadgeRight: {
    backgroundColor: "rgba(255,87,87,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  offerBadgeRightText: {
    color: "#FF5757",
    fontSize: 11,
    fontWeight: "700",
  },
  planContent: {
    flex: 1,
  },
  planHeader: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#F8F8F8",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 5,
    flexWrap: "wrap",
  },
  planType: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8E8E8E",
    letterSpacing: -0.3,
  },
  bonusBadge: {
    backgroundColor: "#F8F8F8",
  },
  bonusBadgeText: {
    color: "#8E8E8E",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  originalPriceBox: {
    justifyContent: "center",
  },
  originalPriceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    textDecorationLine: "line-through",
    letterSpacing: -0.2,
  },
  currentPriceBox: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  singlePriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    fontSize: 22,
    fontWeight: "800",
    color: "#007BFF",
    marginRight: 2,
  },
  price: {
    fontSize: 26,
    fontWeight: "900",
    color: "#007BFF",
    letterSpacing: -0.8,
  },
  selectButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  selectButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#F8F8F8",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featureRowEmpty: {
    height: 16,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  moreServicesInlineText: {
    color: "#007BFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 8,
  },
  fittbotPlanSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  sectionHeaderWithX: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  closeButton: {
    padding: 5,
  },
  headFit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    paddingLeft: 16,
  },
  plansRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  planColumn: {
    alignItems: "center",
    width: (screenWidth - 40) / 3,
  },
  fittbotPlanCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
    width: "100%",
    minHeight: 180,
    alignItems: "center",
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
    textAlign: "center",
  },
  saveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 3,
    textAlign: "center",
  },
  originalPrice: {
    fontSize: 10,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 2,
    textAlign: "center",
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
    textAlign: "center",
  },
  perMonthText: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
    textAlign: "center",
  },
  inclGst: {
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
  dailyRate: {
    fontSize: 9,
    color: "#666",
    textAlign: "center",
  },
  powerPackBadge: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    backgroundColor: "#FF5757",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  powerPackText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
  popularBadge: {
    position: "absolute",
    top: -9,
    alignSelf: "center",
    backgroundColor: "#FF8C00",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 9,
    color: "#FFF",
    fontWeight: "600",
  },
  checkMark: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCircle: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  freePlanSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  freePlanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    position: "relative",
  },
  freeTag: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeTagText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  freePlanTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
    marginBottom: 5,
    textAlign: "center",
  },
  originalFreePrice: {
    fontSize: 18,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 5,
  },
  iconImageFree: {
    width: 130,
    height: 55,
    resizeMode: "contain",
    marginBottom: 5,
  },
  freePlanPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
  },
  freePlanDuration: {
    fontSize: 12,
    color: "#666",
  },
  rewardsSection: {
    marginTop: 0,
  },
  rewardsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginHorizontal: 16,
  },
  rewardsLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  rewardsTextContainer: {
    marginLeft: 12,
    justifyContent: "center",
  },
  rewardsHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  rewardsText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  applyButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  removeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeText: {
    color: "#FF5757",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  summarySection: {
    marginTop: 8,
    marginBottom: 20,
  },
  gradient: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#525252",
    marginLeft: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  summaryText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  freeAmount: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  freeAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  freeBadgeSmall: {
    backgroundColor: "#4CAF50",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textAlign: "center",
  },
  discountAmount: {
    color: "#FF5757",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  finalPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  finalPaymentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  finalPaymentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007BFF",
  },
  buttonContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  payNowButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  payNowGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  payNowText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // Popular Badge Styles
  popularBadge: {
    position: "absolute",
    top: -8,
    left: "50%",
    transform: [{ translateX: -50 }],
    backgroundColor: "#FF5757",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // FREE Badge Styles
  freeBadgeContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  freeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  freeBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // Benefit Cards Styles
  benefitsCardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216,225,238,0.4)",
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  benefitCardEmpty: {
    height: 25,
  },
  benefitCardText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  benefitCardBonusText: {
    color: "#007BFF",
    fontWeight: "700",
  },

  // Summary Row Styles
  summaryRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 12,
    position: "relative",
  },
  complementaryBadge: {
    position: "absolute",
    top: -8,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  complementaryBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  summaryLeftCard: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  summaryTextCard: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
    fontWeight: "500",
  },
  summaryAmountCard: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007BFF",
  },
  freeAmountCard: {
    textDecorationLine: "line-through",
    color: "#999",
  },

  // Features Title
  featuresTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },

  // Check Icon Container
  checkIconContainer: {
    backgroundColor: "#E8F5E8",
    borderRadius: 10,
    padding: 2,
    marginRight: 8,
  },

  iconImage: {
    width: 20,
    height: 20,
  },
  iconImageCard: {
    width: 18,
    height: 22,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: screenWidth - 60,
    maxHeight: screenHeight * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // Loading styles
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    fontWeight: "500",
  },

  // Success styles
  successContainer: {
    alignItems: "center",
    width: "100%",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22C55E",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  // Compact success styles
  compactDetailsContainer: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  compactDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  compactLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
  },
  compactValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  compactViewPassesButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  compactViewPassesButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Failure styles
  failureContainer: {
    alignItems: "center",
    width: "100%",
  },
  failureIconContainer: {
    marginBottom: 16,
  },
  failureTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 8,
    textAlign: "center",
  },
  failureMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  failureDetailsContainer: {
    backgroundColor: "#FFF8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  failureOrderIdLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  orderIdCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  failureOrderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  copyIcon: {
    marginLeft: 4,
  },
  supportContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: "100%",
  },
  supportText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  supportEmail: {
    fontWeight: "600",
    color: "#007BFF",
  },
  failureButtonsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
