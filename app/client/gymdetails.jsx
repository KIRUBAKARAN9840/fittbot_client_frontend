import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
  StatusBar,
  Alert,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import GrainConfettiAnimation from "../../components/ui/ConfettiAnimation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getOneGymStudio } from "../../services/clientApi";
import { Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import ImageView from "react-native-image-viewing";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Gym Images/Video Carousel Component with Full Screen Support
const GymCarousel = ({ media, autoPlayInterval = 3000, playerRef }) => {
  // Separate video and images
  const { videoUrl, images } = useMemo(() => {
    if (!media || media.length === 0) return { videoUrl: null, images: [] };

    const video = media.find(
      (item) =>
        item.toLowerCase().includes(".mp4") ||
        item.toLowerCase().includes(".mov") ||
        item.toLowerCase().includes("video")
    );
    const imgs = media.filter((item) => item !== video);

    // Video should be first, then images
    return { videoUrl: video || null, images: imgs };
  }, [media]);

  // Combine for carousel (video first if exists)
  const carouselData = useMemo(() => {
    const data = [];
    if (videoUrl) data.push({ type: "video", uri: videoUrl });
    images.forEach((img) => data.push({ type: "image", uri: img }));
    return data;
  }, [videoUrl, images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [imageViewIndex, setImageViewIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isScrolling = useRef(false);

  // Video player for the video item
  const player = useVideoPlayer(videoUrl || "", (player) => {
    player.loop = false;
    player.muted = true; // Start muted for autoplay
  });

  // Expose player to parent component via ref
  useEffect(() => {
    if (playerRef) {
      playerRef.current = player;
    }
  }, [player, playerRef]);

  // Listen to video status changes
  useEffect(() => {
    if (!player || !videoUrl) return;

    const interval = setInterval(() => {
      // Check if video has ended (currentTime is at duration and not playing)
      if (
        player.status === "idle" ||
        (player.currentTime >= player.duration - 0.1 && !player.playing)
      ) {
        setIsPlaying(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player, videoUrl]);

  // Stop video when swiping away from it
  useEffect(() => {
    if (videoUrl && activeIndex !== 0) {
      player.pause();
      setIsPlaying(false);
    }
  }, [activeIndex, videoUrl]);

  // Auto-play functionality (pause when video is visible)

  useEffect(() => {
    if (carouselData.length <= 1) return;

    const timer = setInterval(() => {
      if (!isScrolling.current && activeIndex !== 0) {
        // Don't auto-scroll away from video
        const nextIndex = (activeIndex + 1) % carouselData.length;
        flatListRef.current?.scrollToIndex({
          animated: true,
          index: nextIndex,
        });
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [activeIndex, carouselData.length, autoPlayInterval]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / screenWidth
        );
        if (
          slideIndex !== activeIndex &&
          slideIndex >= 0 &&
          slideIndex < carouselData.length
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

  const handleVideoPress = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      // If video has ended, replay from start
      if (player.currentTime >= player.duration - 0.1) {
        player.currentTime = 0;
      }
      player.muted = false;
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, player]);

  const handleMediaPress = useCallback(
    (index) => {
      const item = carouselData[index];
      if (item.type === "image") {
        // Calculate image index (excluding video)
        const imageIndex = videoUrl ? index - 1 : index;
        setImageViewIndex(imageIndex);
        setIsImageViewVisible(true);
      }
    },
    [carouselData, videoUrl]
  );

  const renderMedia = useCallback(
    ({ item, index }) => {
      if (item.type === "video") {
        return (
          <View style={styles.carouselSlide}>
            <VideoView
              style={styles.carouselImage}
              player={player}
              contentFit="cover"
              nativeControls={false}
            />
            {/* Play button overlay - only show when not playing */}
            {!isPlaying && (
              <View style={styles.videoOverlay} pointerEvents="none">
                <View style={styles.playButton}>
                  <MaterialIcons name="play-arrow" size={48} color="#FFF" />
                </View>
              </View>
            )}
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={handleVideoPress}
            />
          </View>
        );
      }

      return (
        <TouchableOpacity
          style={styles.carouselSlide}
          activeOpacity={0.9}
          onPress={() => handleMediaPress(index)}
        >
          <Image source={{ uri: item.uri }} style={styles.carouselImage} />
          <View style={styles.imageOverlay} pointerEvents="none">
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)"]}
              style={styles.imageGradient}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [isPlaying, handleVideoPress, handleMediaPress, player]
  );

  const renderIndicators = () => {
    if (carouselData.length <= 1) return null;

    return (
      <View style={styles.indicatorContainer}>
        {carouselData.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  width: isActive ? 8 : 8,
                  opacity: isActive ? 1 : 0.4,
                  backgroundColor:
                    item.type === "video" ? "#FF5757" : "#4A4A4A",
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.carouselContainer}>
      <RNFlatList
        ref={flatListRef}
        data={carouselData}
        renderItem={renderMedia}
        keyExtractor={(item, index) => `${item.type}-${index}`}
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

      {/* Full-screen image viewer */}
      <ImageView
        images={images.map((uri) => ({ uri }))}
        imageIndex={imageViewIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
      />
    </View>
  );
};

// Service Badge Component
const ServiceBadge = ({ service }) => (
  <View style={[styles.serviceBadge]}>
    <Text style={styles.serviceBadgeText}>{service}</Text>
  </View>
);

// Plan Card Component for Horizontal Scrolling
const PlanCard = ({
  plan,
  type = "gym",
  router,
  gymName,
  location,
  allPlans,
  gymId,
  sectionTitle,
  passPrice,
  discountPrice,
  discount,
}) => {
  const [showServicesModal, setShowServicesModal] = useState(false);

  const handleJoinNow = () => {
    router.push({
      pathname: "/client/gympay",
      params: {
        gymName: gymName,
        location: location,
        selectedPlanId: plan.id.toString(),
        selectedPlanPrice: plan.price.toString(),
        selectedPlanType: sectionTitle,
        selectedPlanDuration: `${plan.duration} month${
          plan.duration > 1 ? "s" : ""
        }`,
        gymPlans: JSON.stringify(allPlans),
        gym_id: gymId,
        passPrice: passPrice,
        discountPrice: discountPrice,
        discount: discount,
      },
    });
  };

  const visibleFeatures = plan.features.slice(0, 3);
  const remainingFeaturesCount = plan.allServices
    ? plan.allServices.length - 3
    : 0;

  // Format bonus text
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

  // Format pause text
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

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (!plan.originalPrice || plan.originalPrice === plan.price) return null;
    const discount = Math.round(
      ((plan.originalPrice - plan.price) / plan.originalPrice) * 100
    );
    return discount > 0 ? discount : null;
  };

  // Format duration text
  const getDurationText = () => {
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

      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          {/* Duration with inline bonus */}
          <View style={styles.durationRow}>
            <Text style={styles.planDuration}>{getDurationText()}</Text>
            {bonusText && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>+{bonusText}</Text>
              </View>
            )}
          </View>

          {/* Pricing Section - Compact */}
          {hasOriginalPrice ? (
            <View style={styles.priceRow}>
              <View style={styles.currentPriceBox}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.currentPrice}>{plan.price}</Text>
              </View>
              <View style={styles.originalPriceBox}>
                <Text style={styles.originalPriceText}>
                  ₹{plan.originalPrice}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.singlePriceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.currentPrice}>{plan.price}</Text>
            </View>
          )}
        </View>

        {/* Fittbot Plan Offer */}
        {plan?.fittbot_plan_offer?.can_offer_fittbot_plan && (
          <View style={[styles.summaryRow, { position: "relative" }]}>
            <LinearGradient
              colors={["#22C55E", "#22C55E"]}
              style={styles.complementaryBadge}
            >
              <Text style={styles.complementaryBadgeText}>FREE</Text>
            </LinearGradient>
            <View style={styles.summaryLeft}>
              <Image
                source={require("../../assets/images/free_logo_gym.png")}
                style={styles.iconImage}
              />
              <Text style={styles.summaryText}>
                Fittbot{" "}
                <Text style={{ color: "#FF5757" }}>
                  {plan.fittbot_plan_offer.fittbot_plan.duration}M Subscription
                </Text>
              </Text>
            </View>
            <Text style={[styles.summaryAmount, styles.freeAmount]}>
              ₹{plan.fittbot_plan_offer.fittbot_plan.price_rupees?.toString()}
            </Text>
          </View>
        )}

        {/* Bonus and Pause Cards */}
        <View style={styles.benefitsCardsContainer}>
          {/* Duration + Bonus Card - Always reserve space */}
          {belowBonusText ? (
            <View style={styles.benefitCard}>
              <MaterialIcons name="check" size={18} color="#4CAF50" />
              <Text style={styles.benefitCardText}>
                {getDurationText()} +{belowBonusText}{" "}
                <Text style={styles.benefitCardBonusText}>Bonus</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.benefitCardEmpty} />
          )}

          {/* Pause Card - Always reserve space */}
          {pauseText ? (
            <View style={styles.benefitCard}>
              <MaterialIcons name="check" size={18} color="#4CAF50" />
              <Text style={styles.benefitCardText}>
                {pauseText}{" "}
                <Text style={styles.benefitCardBonusText}>Pause</Text> Available
              </Text>
            </View>
          ) : (
            <View style={styles.benefitCardEmpty} />
          )}
        </View>

        <TouchableOpacity style={styles.joinButton} onPress={handleJoinNow}>
          <LinearGradient
            colors={["#007BFF", "#007BFF"]}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.joinButtonText}>Join Now</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          {[0, 1, 2].map((index) => {
            const feature = visibleFeatures[index];
            return feature ? (
              <View key={index} style={styles.featureRow}>
                <MaterialIcons name="check" size={16} color="#4CAF50" />
                <Text
                  style={styles.featureText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {feature.trim()}
                </Text>
                {index === 2 && remainingFeaturesCount > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowServicesModal(true)}
                    style={styles.moreServicesInline}
                  >
                    <Text style={styles.moreServicesInlineText}>
                      +{remainingFeaturesCount} more
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View key={index} style={styles.featureRowEmpty} />
            );
          })}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showServicesModal}
          onRequestClose={() => setShowServicesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {plan.type} - All Services
                </Text>
                <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalServicesContainer}>
                  {(plan?.allServices || []).map((service, index) => (
                    <View key={index} style={styles.serviceRow}>
                      <MaterialIcons name="check" size={16} color="#4CAF50" />
                      <Text style={styles.serviceText}>{service.trim()}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

// Tab Component
const TabSelector = ({ activeTab, setActiveTab, dailyPass }) => {
  const shimmerAnimation = useRef(new Animated.Value(-1)).current;
  const borderShimmerAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const flowAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dailyPass && activeTab === "monthly") {
      // Inner content shimmer
      Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        })
      ).start();

      // Main border flow - continuous left-to-right, then right-to-left
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderShimmerAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(borderShimmerAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Breathing glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Diagonal flow effect
      Animated.loop(
        Animated.timing(flowAnimation, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: false,
        })
      ).start();

      // Sparkle particles effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.delay(400),
          Animated.timing(sparkleAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.delay(1200),
        ])
      ).start();

      // Wave ripple effect
      Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        })
      ).start();

      // Slow rotation accent
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
        })
      ).start();
    } else {
      borderShimmerAnimation.setValue(0);
      pulseAnimation.setValue(0);
      flowAnimation.setValue(0);
      sparkleAnimation.setValue(0);
      waveAnimation.setValue(0);
      rotateAnimation.setValue(0);
    }
  }, [dailyPass, activeTab]);

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: [-100, 200],
  });

  const flowOffset = flowAnimation;

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "monthly" && styles.activeTab]}
        onPress={() => setActiveTab("monthly")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "monthly" && styles.activeTabText,
          ]}
        >
          Monthly Pass
        </Text>
      </TouchableOpacity>

      {dailyPass && (
        <View style={styles.dailyTabWrapper}>
          {/* Google AI style animated border shimmer */}
          {activeTab === "monthly" && (
            <>
              <Animated.View style={styles.shimmerBorderContainer}>
                <Animated.View
                  style={[
                    styles.shimmerBorder,
                    {
                      transform: [
                        {
                          translateX: borderShimmerAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 100],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      // "transparent",
                      "rgba(79, 172, 254, 0.6)",

                      "rgba(79, 172, 254, 0.4)",
                      "rgba(0, 123, 255, 0.8)",
                      "rgba(79, 172, 254, 0.4)",
                      // "transparent",
                      "rgba(79, 172, 254, 0.6)",
                    ]}
                    locations={[0, 0.2, 0.5, 0.8, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </Animated.View>
            </>
          )}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "daily" && styles.activeTab,
              activeTab === "monthly" && styles.inactiveTab,
              activeTab === "monthly" && styles.shimmerTab,
            ]}
            onPress={() => setActiveTab("daily")}
          >
            {activeTab === "monthly" && (
              <View style={styles.shimmerContainer}>
                <Animated.View
                  style={[
                    // styles.shimmerOverlay,
                    {
                      transform: [
                        { translateX: shimmerTranslateX },
                        { rotateZ: "50deg" },
                      ],
                    },
                  ]}
                />
              </View>
            )}
            <Text
              style={[
                styles.tabText,
                activeTab === "daily" && styles.activeTabText,
              ]}
            >
              Daily Gym Pass
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Daily Pass Component
const DailyPassSection = ({ onDaysChange }) => {
  const [selectedDays, setSelectedDays] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleDaysChange = (newDays) => {
    setSelectedDays(newDays);
    onDaysChange?.(newDays);

    if (newDays > 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const incrementDays = () => {
    if (selectedDays < 30) {
      handleDaysChange(selectedDays + 1);
    }
  };

  const decrementDays = () => {
    if (selectedDays > 1) {
      handleDaysChange(selectedDays - 1);
    }
  };

  const handleTextChange = (text) => {
    const numValue = parseInt(text) || 1;
    if (numValue >= 1 && numValue <= 30) {
      handleDaysChange(numValue);
    }
  };

  const discount = selectedDays >= 3 ? 10 : 0;

  return (
    <View style={styles.dailyPassWrapper}>
      <View style={styles.dailyPassCard}>
        <View style={styles.dailyPassHeader}>
          <Text style={styles.dailyPassName}>Daily Pass</Text>
          <Text style={styles.dailyPassPrice}>₹ 50</Text>
        </View>

        <View style={styles.daySelector}>
          <Text style={styles.selectDaysLabel}>Select Days</Text>
          <View style={styles.dayInputContainer}>
            <TouchableOpacity
              style={[
                styles.dayButton,
                selectedDays === 1 && styles.dayButtonDisabled,
              ]}
              onPress={decrementDays}
              disabled={selectedDays === 1}
            >
              <MaterialIcons
                name="remove"
                size={18}
                color={selectedDays === 1 ? "#FFFFFF" : "#FFFFFF"}
              />
            </TouchableOpacity>

            <View style={styles.dayInputWrapper}>
              <TextInput
                style={styles.dayInput}
                value={selectedDays.toString()}
                onChangeText={handleTextChange}
                keyboardType="numeric"
                textAlign="center"
                maxLength={2}
              />
            </View>

            <TouchableOpacity style={styles.dayButton} onPress={incrementDays}>
              <MaterialIcons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {selectedDays < 4 && (
          <Text style={styles.discountText}>
            <Text style={{ fontSize: 14, color: "#FF5757" }}>Get 10% Off</Text>{" "}
            When You Book 3+ Days
          </Text>
        )}
        {selectedDays > 3 && (
          <Text style={styles.discountText}>
            Congratulations You Got 10% discount!!
          </Text>
        )}

        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {showConfetti && (
        <GrainConfettiAnimation numberOfGrains={150} xpPoints={0} />
      )}
    </View>
  );
};

// Horizontal Plans List Component
const HorizontalPlansList = ({
  plans,
  title,
  router,
  gymName,
  location,
  allPlans,
  gymId,
  passPrice,
  discountPrice,
  discount,
}) => {
  const renderPlanItem = ({ item }) => (
    <PlanCard
      plan={item}
      router={router}
      gymName={gymName}
      location={location}
      allPlans={allPlans}
      gymId={gymId}
      sectionTitle={title}
      passPrice={passPrice}
      discountPrice={discountPrice}
      discount={discount}
    />
  );

  return (
    <View style={styles.plansSection}>
      <View
        style={{
          borderBottomWidth: 1,
          marginBottom: 15,
          paddingVertical: 10,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text style={[styles.sectionTitle, { paddingLeft: 20 }]}>{title}</Text>
      </View>
      <RNFlatList
        data={plans}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalPlansList}
        ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
      />
    </View>
  );
};

const GymDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("monthly");
  const [selectedDays, setSelectedDays] = useState(1);
  const { gym_id, passPrice, discountPrice, discount } = useLocalSearchParams();

  const [gymData, setGymData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoPlayerRef = useRef(null);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push({
      pathname: "/client/home",
      params: { tab: "Gym Studios" },
    });
  }, [router]);

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

  // Stop video when component unmounts or loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: stop video when leaving screen
        if (videoPlayerRef.current) {
          videoPlayerRef.current.pause();
          videoPlayerRef.current.currentTime = 0;
        }
      };
    }, [])
  );

  // Fetch gym details
  useEffect(() => {
    const fetchGymDetails = async () => {
      try {
        setLoading(true);
        const response = await getOneGymStudio(gym_id);

        if (response?.status === 200) {
          setGymData(response.data);
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

    if (gym_id) {
      fetchGymDetails();
    }
  }, [gym_id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading gym details...</Text>
      </View>
    );
  }

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

  // Format gym timings
  const formatGymTimings = (timings) => {
    if (!timings || !Array.isArray(timings) || timings.length === 0) {
      return "Timing not available";
    }

    return timings
      .filter((timing) => timing?.startTime && timing?.endTime)
      .map((timing) => {
        try {
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
          const dayLabel = timing?.day || timing?.days || "Daily";
          const formattedDay = dayLabel && typeof dayLabel === 'string' && dayLabel.length > 0
            ? dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1).toLowerCase()
            : "Daily";
          return `${formattedDay}: ${startTime} - ${endTime}`;
        } catch (error) {
          console.error("Error formatting timing:", error);
          return null;
        }
      })
      .filter(Boolean)
      .join(", ");
  };

  // Process plans data
  const processPlansData = () => {
    if (!gymData?.plans)
      return {
        regularPlans: [],
        personalTrainingPlans: [],
        coupleMembershipPlans: [],
        couplePTPlans: [],
      };

    const regularPlans = [];
    const personalTrainingPlans = [];
    const coupleMembershipPlans = [];
    const couplePTPlans = [];

    gymData.plans.forEach((plan) => {
      // Handle services - it can be either array or string
      let servicesArray = [];
      if (Array.isArray(plan.services)) {
        servicesArray = plan.services;
      } else if (typeof plan.services === "string") {
        servicesArray = plan.services.split(",");
      }

      const processedPlan = {
        id: plan.plan_id,
        type: plan.plan_name,
        price: plan.amount,
        originalPrice: plan.original,
        duration: plan.duration,
        bonus: plan.bonus,
        bonusType: plan.bonus_type,
        pause: plan.pause,
        pauseType: plan.pause_type,
        features: servicesArray.slice(0, 3),
        allServices: servicesArray,
        fittbot_plan_offer: plan.fittbot_plan_offer,
      };

      if (plan.is_couple) {
        if (plan.personal_training) {
          couplePTPlans.push(processedPlan);
        } else {
          coupleMembershipPlans.push(processedPlan);
        }
      } else {
        if (plan.personal_training) {
          personalTrainingPlans.push(processedPlan);
        } else {
          regularPlans.push(processedPlan);
        }
      }
    });

    return {
      regularPlans,
      personalTrainingPlans,
      coupleMembershipPlans,
      couplePTPlans,
    };
  };

  // Get gym media (images and video) for carousel
  const getGymMedia = () => {
    if (!gymData?.photos || gymData.photos.length === 0) {
      return [
        "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
      ];
    }
    return (gymData?.photos || []).map((photo) => photo.image_url);
  };

  const {
    regularPlans,
    personalTrainingPlans,
    coupleMembershipPlans,
    couplePTPlans,
  } = processPlansData();
  const gymMedia = getGymMedia();
  const formattedTimings = formatGymTimings(
    gymData.gym_timings || gymData.operating_hours
  );

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
          excludedActivityTypes: [
            // Optionally exclude some activities
          ],
          subject: `Check out ${gymData?.gym_name} on Fittbot`, // For email
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: 500 }}>Gym Info</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <MaterialIcons name="share" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gym Images/Video Carousel */}
        <GymCarousel media={gymMedia} playerRef={videoPlayerRef} />

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
            <Text style={styles.gymName}>
              {gymData?.gym_name ? String(gymData.gym_name).toUpperCase() : ""}
            </Text>
            {gymData?.fittbot_verified && (
              // <Ionicons name="checkmark-circle" size={24} color="#007BFF" />
              <Image
                source={require("../../assets/images/verified.png")}
                style={{ width: 20, height: 20 }}
              />
            )}
          </View>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={18} color="#666" />
            <Text style={styles.gymLocation}>
              {[
                gymData?.address?.street,
                gymData?.address?.area,
                gymData?.address?.city,
                gymData?.address?.state,
                gymData?.address?.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
          <View style={[styles.locationRow, { marginTop: 5 }]}>
            <MaterialIcons name="alarm" size={18} color="#666" />
            <Text style={styles.gymLocation}>{formattedTimings}</Text>
          </View>
        </View>

        {gymData?.services && gymData.services.length > 0 && (
          <View style={styles.servicesSection}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Services
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesScrollContainer}
            >
              {(gymData?.services || []).map((service, index) => (
                <ServiceBadge key={index} service={service} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daily Pass Section - Show only if dailypass is true */}
        {gymData?.dailypass && (
          <View style={styles.dailyPass}>
            <TouchableOpacity
              style={styles.dailyPassButton}
              onPress={() =>
                router.push({
                  pathname: "/client/dailypass",
                  params: {
                    amount: passPrice,
                    discountPrice: discountPrice,
                    discount_per: discount,
                    gymName: gymData?.gym_name || null,
                    gymId: gymData?.gym_id,
                    location:
                      !gymData?.address.street &&
                      !gymData?.address.area &&
                      !gymData?.address.city
                        ? "Location not available"
                        : `${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}` ||
                          null,
                  },
                })
              }
            >
              <View />
              <Text style={styles.dailyPassText}>Daily Gym Pass Available</Text>
              <MaterialIcons name="chevron-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.dailyPassBelowText}>
              Try Daily Gym Pass for a day at just{"  "}
              <Text
                style={{ color: "#28A745", fontSize: 16, fontWeight: "bold" }}
              >
                ₹{discountPrice}
              </Text>
            </Text>
          </View>
        )}

        {/* Gym Plans Section */}
        {regularPlans.length > 0 ? (
          <HorizontalPlansList
            plans={regularPlans}
            title="Gym Membership Plans"
            router={router}
            gymName={gymData?.gym_name}
            location={`${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}`}
            allPlans={regularPlans}
            gymId={gymData?.gym_id}
            passPrice={passPrice}
            discountPrice={discountPrice}
            discount={discount}
          />
        ) : (
          <View style={styles.noPlansSection}>
            <Text style={styles.noPlansText}>
              No Gym Membership Plans Found
            </Text>
          </View>
        )}

        {/* Couple Membership Plans Section */}
        {coupleMembershipPlans.length > 0 && (
          <HorizontalPlansList
            plans={coupleMembershipPlans}
            title="Couple Membership Plans"
            router={router}
            gymName={gymData?.gym_name}
            location={`${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}`}
            allPlans={coupleMembershipPlans}
            gymId={gymData?.gym_id}
            passPrice={passPrice}
            discountPrice={discountPrice}
            discount={discount}
          />
        )}

        {/* Personal Training Plans Section */}
        {personalTrainingPlans.length > 0 ? (
          <HorizontalPlansList
            plans={personalTrainingPlans}
            title="Personal Training Plans"
            router={router}
            gymName={gymData?.gym_name}
            location={`${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}`}
            allPlans={personalTrainingPlans}
            gymId={gymData?.gym_id}
            passPrice={passPrice}
            discountPrice={discountPrice}
            discount={discount}
          />
        ) : (
          <View style={styles.noPlansSection}>
            <Text style={styles.noPlansText}>
              No Personal Training Plans Found
            </Text>
          </View>
        )}

        {/* Couple PT Plans Section */}
        {couplePTPlans.length > 0 && (
          <HorizontalPlansList
            plans={couplePTPlans}
            title="Couple PT Plans"
            router={router}
            gymName={gymData?.gym_name}
            location={`${gymData?.address?.street}, ${gymData?.address?.area}, ${gymData?.address?.city}`}
            allPlans={couplePTPlans}
            gymId={gymData?.gym_id}
            passPrice={passPrice}
            discountPrice={discountPrice}
            discount={discount}
          />
        )}
      </ScrollView>
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
    paddingTop: 0,
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
    // backgroundColor: "#F5F5F5",
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
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  indicatorContainer: {
    // position: "absolute",
    // bottom: 20,
    // left: 0,
    // right: 0,
    // flexDirection: "row",
    // justifyContent: "center",
    // alignItems: "center",

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
    color: "#454545",
    // marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gymLocation: {
    fontSize: 12,
    color: "rgba(65,65,65,0.7)",
    marginLeft: 5,
    flex: 1,
    lineHeight: 20,
    backgroundColor: "#F6F6F6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
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

    textDecorationLine: "underline",

    // paddingHorizontal: 20,
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  servicesScrollContainer: {
    paddingHorizontal: 0,
    gap: 8,
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

  // Plans Styles
  plansSection: {
    backgroundColor: "#FFF",
    paddingTop: 10,
    paddingBottom: 15,
    marginBottom: 10,
  },
  horizontalPlansList: {
    paddingHorizontal: 20,
  },
  planCardWrapper: {
    width: 240,
    position: "relative",
    marginVertical: 10,
  },
  planCard: {
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
  discountBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: "#FF5757",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    elevation: 6,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    alignItems: "center",
    minWidth: 50,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
  discountBadgeLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: -1,
  },
  planHeader: {
    padding: 16,
    paddingTop: 5,
    paddingBottom: 8,
    paddingHorizontal: 10,
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
  planDuration: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8E8E8E",
    letterSpacing: -0.3,
  },
  bonusBadge: {
    backgroundColor: "#F8F8F8",
    // paddingHorizontal: 6,
    // paddingVertical: 4,
    // borderRadius: 6,
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
    marginLeft: 20,
    gap: 10,
    marginTop: 10,
  },
  originalPriceBox: {
    justifyContent: "center",
  },
  originalPriceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(142,142,142,0.6)",
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
    marginLeft: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "800",
    color: "#007BFF",
    marginRight: 2,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "900",
    color: "#007BFF",
    letterSpacing: -0.8,
  },
  featuresContainer: {
    paddingHorizontal: 14,
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
  moreServicesInline: {
    marginLeft: 8,
  },
  moreServicesInlineText: {
    color: "#007BFF",
    fontSize: 11,
    fontWeight: "700",
  },
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
  joinButton: {
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
  joinButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
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

  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 5,
    paddingVertical: 0,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  dailyTabWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  shimmerGlowOuter: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 16,
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 1,
  },
  shimmerBorderContainer: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 10,
    zIndex: 1,
    overflow: "hidden",
  },
  shimmerBorder: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  shimmerGradient: {
    flex: 1,
    borderRadius: 10,
    width: "150%",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  shimmerTab: {
    backgroundColor: "#F8F9FA",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.1)",
  },
  activeTab: {
    backgroundColor: "#007BFF",
    elevation: 2,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 8,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  planContent: {
    backgroundColor: "#FFFFFF",
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconImage: {
    width: 18,
    height: 22,
  },
  summaryText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
    fontWeight: "500",
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007BFF",
  },
  freeAmount: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  discountAmount: {
    color: "#FF5757",
  },
  complementaryBadge: {
    position: "absolute",
    top: -8,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  complementaryBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },

  // Daily Pass Styles
  dailyPassWrapper: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
  },
  dailyPassTitle: {
    fontSize: 14,
    color: "#656565",
    fontWeight: "400",
    marginVertical: 12,
    textAlign: "left",
    textDecorationLine: "underline",
  },
  dailyPassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    // paddingHorizontal: 20,
    // paddingVertical: 10,
    marginTop: 15,
  },
  dailyPassHeader: {
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#007BFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dailyPassName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
    width: "48%",
  },
  dailyPassPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  daySelector: {
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  selectDaysLabel: {
    fontSize: 14,
    color: "#414141",
    // marginBottom: 12,
    fontWeight: "bold",
  },
  dayInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayButton: {
    width: 26,
    height: 26,
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
    backgroundColor: "#97C9FF",
    elevation: 0,
    shadowOpacity: 0,
  },
  dayInputWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 80,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007BFF",
  },
  dayInput: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
    width: "100%",
    padding: 0,
    margin: 0,
  },
  discountText: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
    lineHeight: 16,
  },
  continueButton: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 90,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "center",
    elevation: 3,
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    marginTop: 40,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  dailyPass: {
    marginVertical: 10,
  },
  dailyPassButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "80%",
    margin: "auto",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dailyPassText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: 600,
  },
  dailyPassBelowText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E5E9",
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalServicesContainer: {
    gap: 8,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  serviceText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  moreServicesLink: {
    marginTop: 8,
  },
  moreServicesLinkText: {
    color: "#007BFF",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Loading and Error Styles
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  noPlansSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noPlansText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
});

export default GymDetails;
