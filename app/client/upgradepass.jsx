import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList as RNFlatList,
  ScrollView,
  Image,
  Share,
  Animated,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaskedText } from "../../components/ui/MaskedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getOneGymStudio,
  getUpgradePassDetails,
} from "../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../utils/Toaster";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Dummy data for gym images
const defaultGymImages = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
];

// Gym Images Carousel Component with Infinite Loop and AutoPlay
const GymCarousel = ({ images, autoPlayInterval = 2000 }) => {
  // Create infinite loop data by duplicating first and last items
  const loopData = useMemo(() => {
    if (images.length <= 1) return images;
    return [images[images.length - 1], ...images, images[0]];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(1); // Start at index 1 (real first item)
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(screenWidth)).current; // Start at first real item
  const isScrolling = useRef(false);

  // Auto-play functionality
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      if (!isScrolling.current) {
        const nextIndex = activeIndex + 1;
        flatListRef.current?.scrollToIndex({
          animated: true,
          index: nextIndex,
        });
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [activeIndex, images.length, autoPlayInterval]);

  // Handle infinite loop transitions
  useEffect(() => {
    if (images.length <= 1) return;

    const listener = scrollX.addListener(({ value }) => {
      const index = Math.round(value / screenWidth);

      // If we're at the last duplicate (first real item copy)
      if (index === loopData.length - 1 && !isScrolling.current) {
        setTimeout(() => {
          isScrolling.current = true;
          flatListRef.current?.scrollToIndex({
            animated: false,
            index: 1, // Jump to real first item
          });
          setActiveIndex(1);
          setTimeout(() => {
            isScrolling.current = false;
          }, 50);
        }, 100);
      }
      // If we're at the first duplicate (last real item copy)
      else if (index === 0 && !isScrolling.current) {
        setTimeout(() => {
          isScrolling.current = true;
          flatListRef.current?.scrollToIndex({
            animated: false,
            index: loopData.length - 2, // Jump to real last item
          });
          setActiveIndex(loopData.length - 2);
          setTimeout(() => {
            isScrolling.current = false;
          }, 50);
        }, 100);
      }
    });

    return () => scrollX.removeListener(listener);
  }, [images.length, loopData.length]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        if (isScrolling.current) return;

        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / screenWidth
        );

        if (
          slideIndex !== activeIndex &&
          slideIndex >= 0 &&
          slideIndex < loopData.length
        ) {
          setActiveIndex(slideIndex);
        }
      },
    }
  );

  const onScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  const onScrollEndDrag = () => {
    setTimeout(() => {
      isScrolling.current = false;
    }, 100);
  };

  const renderImage = ({ item, index }) => {
    // Calculate the real index for different effects if needed
    let realIndex = index - 1;
    if (index === 0) realIndex = images.length - 1; // Last duplicate
    if (index === loopData.length - 1) realIndex = 0; // First duplicate

    return (
      <View style={styles.carouselSlide}>
        <Image source={{ uri: item }} style={styles.carouselImage} />
        <View style={styles.imageOverlay}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            style={styles.imageGradient}
          />
        </View>
      </View>
    );
  };

  const renderIndicators = () => {
    if (images.length <= 1) return null;

    return (
      <View style={styles.indicatorContainer}>
        {images.map((_, index) => {
          // Calculate which real item is currently active
          let realActiveIndex = activeIndex - 1;
          if (activeIndex === 0) realActiveIndex = images.length - 1; // Last duplicate shows last real item
          if (activeIndex === loopData.length - 1) realActiveIndex = 0; // First duplicate shows first real item

          const isActive = index === realActiveIndex;

          return (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  width: isActive ? 8 : 8,
                  opacity: isActive ? 1 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Initialize scroll position on mount
  useEffect(() => {
    if (images.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          animated: false,
          index: 1, // Start at first real item
        });
      }, 100);
    }
  }, [images.length]);

  return (
    <View style={styles.carouselContainer}>
      <RNFlatList
        ref={flatListRef}
        data={loopData}
        renderItem={renderImage}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      {renderIndicators()}
    </View>
  );
};

// Service Badge Component
const ServiceBadge = ({ service }) => (
  <View style={[styles.serviceBadge]}>
    <Text style={styles.serviceBadgeText}>{service}</Text>
  </View>
);

const UpgradePass = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    gymId,
    gymName,
    gymLocation,
    gymImage,
    gymServices,
    gymOpenTime,
    gymVerified,
    // Parameters from allpass for upgrade
    fromDate,
    toDate,
    currentAmount,
    currentGymName,
    availableDays,
    upgradeStartDate,
    daily_pass_price,
    pass_id,
  } = params;

  // State for gym data from API
  const [gymData, setGymData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for upgrade interface
  const [selectedDays, setSelectedDays] = useState(() => {
    return availableDays ? parseInt(availableDays) : 4;
  });
  const [startDate, setStartDate] = useState(() => {
    if (upgradeStartDate) {
      const [year, month, day] = upgradeStartDate.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const [expectedTime, setExpectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    if (upgradeStartDate) {
      const [year, month, day] = upgradeStartDate.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const [tempTime, setTempTime] = useState(new Date());
  const [details, setDetails] = useState(null);
  const upgradeDetails = async (gymId, passId, clientId) => {
    setLoading(true);

    try {
      const response = await getUpgradePassDetails(gymId, passId, clientId);

      if (response?.status === 200) {
        setDetails(response?.data);

        // Update state with API response data
        if (response?.data?.upgradeable_dates?.from) {
          const [year, month, day] = response.data.upgradeable_dates.from
            .split("-")
            .map(Number);
          setStartDate(new Date(year, month - 1, day));
        }

        if (response?.data?.selected_time) {
          // Parse selected_time (format: "11:51 am")
          const timeStr = response.data.selected_time;
          const today = new Date();
          const [time, period] = timeStr.split(" ");
          const [hours, minutes] = time.split(":").map(Number);
          let adjustedHours = hours;

          if (period?.toLowerCase() === "pm" && hours !== 12) {
            adjustedHours = hours + 12;
          } else if (period?.toLowerCase() === "am" && hours === 12) {
            adjustedHours = 0;
          }

          const expectedTimeFromAPI = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            adjustedHours,
            minutes
          );
          setExpectedTime(expectedTimeFromAPI);
        }

        if (response?.data?.upgradeable_days) {
          setSelectedDays(response.data.upgradeable_days);
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch gym details from API
  useEffect(() => {
    const fetchGymDetails = async () => {
      try {
        const client_id = await AsyncStorage.getItem("client_id");
        if (!client_id) {
          return;
        }
        setLoading(true);
        const response = await getOneGymStudio(gymId);

        if (response?.status === 200) {
          setGymData(response.data);
          await upgradeDetails(gymId, pass_id, client_id);
        } else {
          setError("Failed to fetch gym details");
        }
      } catch (err) {
        setError("Error fetching gym details");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (gymId) {
      fetchGymDetails();
    }
  }, [gymId]);

  // Get gym images for carousel
  const getGymImages = () => {
    if (!gymData?.photos || gymData.photos.length === 0) {
      return defaultGymImages;
    }
    return (gymData?.photos || []).map((photo) => photo.image_url);
  };

  // Format gym timings
  const formatGymTimings = (timings) => {
    if (!timings || !Array.isArray(timings) || timings.length === 0) {
      return "Timing not available";
    }

    return timings
      .map((timing) => {
        const startTime = new Date(timing.startTime).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        );
        const endTime = new Date(timing.endTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        const dayLabel = timing.day || timing.days || "Daily";
        return `${dayLabel}: ${startTime} - ${endTime}`;
      })
      .join(", ");
  };

  // Calculate upgrade eligibility (same logic as allpass edit)
  const calculateUpgradeEligibility = () => {
    if (!fromDate || !toDate) {
      return { canUpgrade: true }; // If no pass data, allow upgradel
    }

    const today = new Date();
    const passStartDate = new Date(fromDate);
    const passEndDate = new Date(toDate);

    today.setHours(0, 0, 0, 0);
    passStartDate.setHours(0, 0, 0, 0);
    passEndDate.setHours(0, 0, 0, 0);

    // If pass has expired
    if (today > passEndDate) {
      return { canUpgrade: false, isExpired: true };
    }

    // If today is the last day of pass
    if (today.getTime() === passEndDate.getTime()) {
      return { canUpgrade: false, isLastDay: true };
    }

    // If today is the pass start date and only 1 day available
    if (today.getTime() === passStartDate.getTime() && selectedDays <= 1) {
      return { canUpgrade: false, isLastDay: true };
    }

    return { canUpgrade: true };
  };

  const upgradeStatus = calculateUpgradeEligibility();

  // Pricing calculations for upgrade using API data
  const currentPerDayAmount =
    details?.old_price_per_day || (currentAmount ? parseInt(currentAmount) : 0);
  const newGymPerDayAmount =
    details?.new_price_per_day ||
    (daily_pass_price ? parseInt(daily_pass_price) : 0);

  const currentTotalAmount =
    details?.actual_paid || currentPerDayAmount * selectedDays;
  const newTotalAmount = details?.new_paid || newGymPerDayAmount * selectedDays;
  const amountToPay = details?.total_upgrade_cost || 0;

  const getEndDate = () => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + selectedDays - 1);
    return endDate;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      if (Platform.OS === "ios") {
        setTempDate(selectedDate);
      } else {
        setStartDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      if (Platform.OS === "ios") {
        setTempTime(selectedTime);
      } else {
        setExpectedTime(selectedTime);
      }
    }
  };

  const confirmDateSelection = () => {
    setStartDate(tempDate);
    setShowDatePicker(false);
  };

  const confirmTimeSelection = () => {
    setExpectedTime(tempTime);
    setShowTimePicker(false);
  };

  const cancelDateSelection = () => {
    setTempDate(startDate);
    setShowDatePicker(false);
  };

  const cancelTimeSelection = () => {
    setTempTime(expectedTime);
    setShowTimePicker(false);
  };

  const handleShare = async () => {
    try {
      const servicesList = gymData?.services?.join(", ") || "Various services";
      const verifiedText = gymData?.fittbot_verified
        ? "Fittbot Verified ✅"
        : "";
      const fullAddress = `${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}, ${gymData?.address?.state} ${gymData?.address?.pincode}`;

      const shareContent = `Check Out This Gym on Fittbot!
🏋️‍♂️ ${gymData?.gym_name} ${verifiedText}

📍 Location: ${fullAddress}

💪 Services: ${servicesList}

Find more gyms and book your fitness journey with Fittbot!

📱 Download Fittbot:
Android: https://play.google.com/store/apps/details?id=com.fittbot.fittbot_user&hl=en_IN
iOS: https://apps.apple.com/us/app/fittbot/id6747237294`;

      const result = await Share.share(
        {
          message: shareContent,
          title: `Check out ${gymData?.gym_name}`,
        },
        {
          dialogTitle: `Share ${gymData?.gym_name}`,
          excludedActivityTypes: [],
          subject: `Check out ${gymData?.gym_name} on Fittbot`,
        }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert(
        "Share Error",
        "Sorry, there was an issue sharing this gym. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const insets = useSafeAreaInsets();
  const handleUpgradePress = () => {
    if (upgradeStatus.canUpgrade) {
      router.push({
        pathname: "/client/passpay",
        params: {
          gymName: details?.new_gym_name || gymData?.gym_name || gymName,
          location:
            `${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}` ||
            "Location not specified",
          finalAmount: amountToPay,
          days: details?.upgradeable_days || selectedDays,
          basePrice: newGymPerDayAmount,
          startDate: details?.upgradeable_dates?.from
            ? new Date(details.upgradeable_dates.from).toLocaleDateString()
            : startDate.toLocaleDateString(),
          endDate: details?.upgradeable_dates?.to
            ? new Date(details.upgradeable_dates.to).toLocaleDateString()
            : getEndDate().toLocaleDateString(),
          expectedTime:
            details?.selected_time ||
            expectedTime.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          gymId: details?.new_gym_id || gymData?.gym_id,
          type: "upgrade",
          pass_id: details?.pass_id || pass_id,
          // Additional params from API response
          old_gym_id: details?.old_gym_id,
          old_gym_name: details?.old_gym_name,
          new_gym_id: details?.new_gym_id,
          new_gym_name: details?.new_gym_name,
          actual_paid: details?.actual_paid,
          new_paid: details?.new_paid,
          total_upgrade_cost: details?.total_upgrade_cost,
          price_difference_per_day: details?.price_difference_per_day,
          currency: details?.currency,
          can_upgrade: details?.can_upgrade,
          total_days: details?.total_days,
          old_price_per_day: details?.old_price_per_day,
          new_price_per_day: details?.new_price_per_day,
          original_dates_from: details?.original_dates?.from,
          original_dates_to: details?.original_dates?.to,
          upgradeable_dates_from: details?.upgradeable_dates?.from,
          upgradeable_dates_to: details?.upgradeable_dates?.to,
        },
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading gym details...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !gymData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error || "Gym not found"}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get processed data
  const gymImages = getGymImages();
  const formattedTimings = formatGymTimings(
    gymData.gym_timings || gymData.operating_hours
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <MaterialIcons name="share" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gym Images Carousel */}
        <GymCarousel images={gymImages} />

        {/* Gym Info */}
        <View style={styles.gymInfoSection}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <Text style={styles.gymName}>{gymData?.gym_name}</Text>
            {gymData?.fittbot_verified && (
              <Ionicons name="checkmark-circle" size={20} color="#007BFF" />
            )}
          </View>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.gymLocation}>
              {`${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}, ${gymData?.address?.state} ${gymData?.address?.pincode}`}
            </Text>
          </View>
          <View style={[styles.locationRow, { marginTop: 5 }]}>
            <MaterialIcons name="alarm" size={16} color="#666" />
            <Text style={styles.gymLocation}>{formattedTimings}</Text>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesScrollContainer}
          >
            {gymData?.services?.map((service, index) => (
              <ServiceBadge key={index} service={service} />
            ))}
          </ScrollView>
        </View>

        {/* Upgrade Interface Section */}
        <View style={styles.upgradeSection}>
          <LinearGradient
            colors={["#EBF5FF", "#FFFFFF"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaskedText
              bg2="#525252"
              bg1="#525252"
              text="Upgrade Your Pass"
              textStyle={styles.headerText}
            >
              Upgrade Your Pass
            </MaskedText>
          </LinearGradient>

          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.daySelector}>
              <Text style={styles.selectDaysLabel}>Available Days</Text>
              <View style={styles.dayInputContainer}>
                <TouchableOpacity
                  style={[styles.dayButton, styles.dayButtonDisabled]}
                  disabled={true}
                >
                  <MaterialIcons name="remove" size={18} color="#CCCCCC" />
                </TouchableOpacity>

                <View style={[styles.dayInputWrapper, styles.dayInputDisabled]}>
                  <TextInput
                    style={[styles.dayInput, styles.dayInputDisabledText]}
                    value={(
                      details?.upgradeable_days || selectedDays
                    ).toString()}
                    editable={false}
                    textAlign="center"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.dayButton, styles.dayButtonDisabled]}
                  disabled={true}
                >
                  <MaterialIcons name="add" size={18} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Gym Name Section */}
            <View style={styles.gymNameSelector}>
              <Text style={styles.selectDaysLabel}>Gym Name</Text>
              <View style={styles.gymNameInput}>
                <Text style={styles.gymNameText}>{gymData?.gym_name}</Text>
              </View>
            </View>

            {/* Date and Time Selector Row */}
            <View style={styles.dateTimeRow}>
              {/* Start Date Selector - Disabled */}
              <View style={styles.dateTimeSelector}>
                <Text style={styles.selectDaysLabelSelector}>Start Date</Text>
                <View
                  style={[styles.dateTimeInput, styles.dateTimeInputDisabled]}
                >
                  <Text
                    style={[styles.dateTimeText, styles.dateTimeTextDisabled]}
                  >
                    {details?.upgradeable_dates?.from
                      ? new Date(
                          details.upgradeable_dates.from
                        ).toLocaleDateString()
                      : startDate.toLocaleDateString()}
                  </Text>
                  <MaterialIcons
                    name="calendar-today"
                    size={20}
                    color="#CCCCCC"
                  />
                </View>
              </View>

              {/* Expected Time Selector - Disabled */}
              <View style={styles.dateTimeSelector}>
                <Text style={styles.selectDaysLabelSelector}>
                  Expected Time
                </Text>
                <View
                  style={[styles.dateTimeInput, styles.dateTimeInputDisabled]}
                >
                  <Text
                    style={[styles.dateTimeText, styles.dateTimeTextDisabled]}
                  >
                    {details?.selected_time ||
                      expectedTime.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </Text>
                  <MaterialIcons name="schedule" size={20} color="#CCCCCC" />
                </View>
              </View>
            </View>

            {/* Pass Summary */}
            <View style={styles.passSummary}>
              <View style={styles.passInfoLeft}>
                <MaterialIcons
                  name="calendar-today"
                  size={14}
                  color="#007BFF"
                />
                <Text style={styles.passSummaryText}>
                  {details?.upgradeable_days || selectedDays} Day Pass (
                  {details?.upgradeable_dates?.from
                    ? new Date(
                        details.upgradeable_dates.from
                      ).toLocaleDateString()
                    : startDate.toLocaleDateString()}{" "}
                  to{" "}
                  {details?.upgradeable_dates?.to
                    ? new Date(
                        details.upgradeable_dates.to
                      ).toLocaleDateString()
                    : getEndDate().toLocaleDateString()}
                  )
                </Text>
              </View>
            </View>

            {/* Pricing Breakdown */}
            <View style={styles.pricingBreakdown}>
              <Text style={styles.pricingTitle}>Pricing Breakdown</Text>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Current Pass Total:</Text>
                <Text style={styles.pricingValue}>₹{currentTotalAmount}</Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  New Gym Total ({details?.upgradeable_days || selectedDays}{" "}
                  days × ₹{newGymPerDayAmount}):
                </Text>
                <Text style={styles.pricingValue}>₹{newTotalAmount}</Text>
              </View>

              <View style={styles.pricingRowDivider} />

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabelBold}>Amount to Pay:</Text>
                <Text style={styles.pricingValueBold}>
                  {amountToPay > 0
                    ? `₹${amountToPay}`
                    : "₹0 (No additional charge)"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Note Section */}
      <View style={styles.noteSection}>
        <MaterialIcons name="info" size={12} color="#666" />
        <Text style={styles.noteText}>
          {upgradeStatus.isLastDay
            ? "Cannot upgrade on last day of pass"
            : upgradeStatus.isExpired
            ? "Cannot upgrade expired pass"
            : "Upgrade your pass 1 day in advance for smooth transition"}
        </Text>
      </View>

      {/* Upgrade Pass Button - Fixed at bottom */}
      <View style={[styles.upgradeContainer, { bottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.upgradeButton,
            !upgradeStatus.canUpgrade && styles.upgradeButtonDisabled,
          ]}
          disabled={!upgradeStatus.canUpgrade}
          onPress={handleUpgradePress}
        >
          <LinearGradient
            colors={
              !upgradeStatus.canUpgrade
                ? ["#CCCCCC", "#AAAAAA"]
                : ["#007BFF", "#FF8C00"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeGradient}
          >
            <Text
              style={[
                styles.upgradeText,
                !upgradeStatus.canUpgrade && styles.upgradeTextDisabled,
              ]}
            >
              Upgrade Pass
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={cancelDateSelection}
        >
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={cancelDateSelection}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Start Date</Text>
                <TouchableOpacity onPress={confirmDateSelection}>
                  <Text style={styles.pickerConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                themeVariant="light"
                textColor="#000000"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.iosPickerStyle}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker Modal */}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTimePicker}
          onRequestClose={cancelTimeSelection}
        >
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={cancelTimeSelection}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Expected Time</Text>
                <TouchableOpacity onPress={confirmTimeSelection}>
                  <Text style={styles.pickerConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                themeVariant="light"
                textColor="#000000"
                onChange={handleTimeChange}
                is24Hour={true}
                style={styles.iosPickerStyle}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={expectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },

  // Carousel Styles
  carouselContainer: {
    height: 240,
    position: "relative",
  },
  carouselSlide: {
    width: screenWidth,
    height: 200,
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  imageGradient: {
    flex: 1,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#FFF",
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A4A4A",
    marginHorizontal: 3,
  },

  // Gym Info Styles
  gymInfoSection: {
    backgroundColor: "#FFF",
    padding: 20,
    paddingVertical: 5,
    marginBottom: 10,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
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
    lineHeight: 20,
  },

  // Services Styles
  servicesSection: {
    backgroundColor: "#FFF",
    padding: 20,
    paddingVertical: 0,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7B7B7B",
    marginBottom: 15,
    textDecorationLine: "underline",
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  serviceBadgeText: {
    color: "#7C7C7C",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Upgrade Interface Styles
  upgradeSection: {
    paddingVertical: 12,
    paddingTop: 6,
  },
  gradient: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#525252",
    marginLeft: 20,
  },
  daySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12,
  },
  gymNameSelector: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12,
  },
  gymNameInput: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  gymNameText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectDaysLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  selectDaysLabelSelector: {
    fontSize: 12,
    color: "#333",
    marginLeft: 5,
    marginBottom: 5,
  },
  dayInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007BFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dayButtonDisabled: {
    backgroundColor: "#E0E0E0",
    elevation: 0,
    shadowOpacity: 0,
  },
  dayInputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#007BFF",
    minWidth: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dayInput: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
    width: "100%",
    padding: 0,
    margin: 0,
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 16,
    paddingTop: 0,
    gap: 12,
  },
  dateTimeSelector: {
    flex: 1,
  },
  dateTimeInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#007BFF",
    minHeight: 35,
  },
  dateTimeInputDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCCCCC",
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007BFF",
    flex: 1,
  },
  dateTimeTextDisabled: {
    color: "#999",
  },
  passSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 10,
  },
  passInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  passSummaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  passSummaryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  // Pricing Breakdown Styles
  pricingBreakdown: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 10,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textDecorationLine: "underline",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  pricingRowDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
  pricingLabel: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  pricingValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  pricingLabelBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    flex: 1,
  },
  pricingValueBold: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "bold",
  },

  // Additional disabled styles
  dayInputDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCCCCC",
  },
  dayInputDisabledText: {
    color: "#999",
  },
  servicesScrollContainer: {
    paddingHorizontal: 0,
    gap: 8,
  },

  // Loading and Error Styles
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    marginTop: 16,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#FF5252",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Note Section
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },

  // Upgrade Button Styles
  upgradeContainer: {
    position: "absolute",

    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 10 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  upgradeButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  upgradeGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  upgradeTextDisabled: {
    color: "#FFFFFF",
    opacity: 0.7,
  },

  // Picker Styles
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
});

export default UpgradePass;
