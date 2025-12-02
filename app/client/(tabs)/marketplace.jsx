import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  FlatList,
  BackHandler,
} from "react-native";
import {
  getSmartWatchInterestAPI,
  showSmartWatchInterestAPI,
} from "../../../services/clientApi";
import { useFocusEffect } from "@react-navigation/native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const ProductBanner = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Start at 1 (first real item)
  const flatListRef = useRef(null);
  const isScrolling = useRef(false);
  const autoScrollTimer = useRef(null);

  // Product data for carousel
  const productData = [
    {
      id: 2,
      name: "Smart Nutrition Plan",
      image: require("../../../assets/images/marketplace/nutrition.png"),
      tagline: "Personalized diet plans for your goals.",
    },
    {
      id: 1,
      name: "Fittbot Smart Wearables",
      image: require("../../../assets/images/marketplace/watchy.png"),
      tagline: "Smarter tracking, sharper results.",
    },
  ];

  // Create infinite loop data by adding duplicates
  const infiniteData = React.useMemo(() => {
    if (productData.length <= 1) return productData;
    return [
      { ...productData[productData.length - 1], id: "last-duplicate" },
      ...productData,
      { ...productData[0], id: "first-duplicate" },
    ];
  }, []);

  // Get current product for display
  const getCurrentProduct = () => {
    let realIndex = activeIndex - 1;
    if (activeIndex === 0) realIndex = productData.length - 1;
    if (activeIndex === infiniteData.length - 1) realIndex = 0;
    return productData[realIndex] || productData[0];
  };

  const currentProduct = getCurrentProduct();

  // Auto-play functionality for infinite carousel
  useEffect(() => {
    if (productData.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      if (!isScrolling.current && flatListRef.current) {
        const nextIndex = activeIndex + 1;
        if (nextIndex < infiniteData.length) {
          flatListRef.current.scrollToIndex({
            animated: true,
            index: nextIndex,
          });
        }
      }
    }, 3000);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, [activeIndex, productData.length, infiniteData.length]);

  // Handle infinite loop transitions
  useEffect(() => {
    if (productData.length <= 1 || infiniteData.length <= 1) return;

    // When we reach the duplicate at the end, jump to the real first item
    if (activeIndex === infiniteData.length - 1) {
      const timer = setTimeout(() => {
        isScrolling.current = true;
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              animated: false,
              index: 1, // Jump to first real item
            });
            setTimeout(() => {
              setActiveIndex(1);
              isScrolling.current = false;
            }, 50);
          } catch (error) {
            isScrolling.current = false;
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // When we reach the duplicate at the beginning, jump to the real last item
    if (activeIndex === 0) {
      const timer = setTimeout(() => {
        isScrolling.current = true;
        if (flatListRef.current) {
          const targetIndex = infiniteData.length - 2;
          if (targetIndex >= 0 && targetIndex < infiniteData.length) {
            try {
              flatListRef.current.scrollToIndex({
                animated: false,
                index: targetIndex, // Jump to last real item
              });
              setTimeout(() => {
                setActiveIndex(targetIndex);
                isScrolling.current = false;
              }, 50);
            } catch (error) {
              isScrolling.current = false;
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, productData.length, infiniteData.length]);

  // Initialize to first real item and cleanup on unmount
  useEffect(() => {
    if (productData.length > 1 && infiniteData.length > 1) {
      const timer = setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              animated: false,
              index: 1, // Start at first real item
            });
          } catch (error) {
            // Ignore scroll errors on initial mount
          }
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        // Cleanup auto-scroll timer on unmount
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
        }
      };
    }

    return () => {
      // Ensure cleanup even if conditions aren't met
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, []);

  const handleScroll = (event) => {
    if (isScrolling.current || !event?.nativeEvent) return;

    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    if (
      slideIndex !== activeIndex &&
      slideIndex >= 0 &&
      slideIndex < infiniteData.length
    ) {
      setActiveIndex(slideIndex);
    }
  };

  const onScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  const onScrollEndDrag = () => {
    setTimeout(() => {
      isScrolling.current = false;
    }, 100);
  };

  const renderCarouselItem = ({ item }) => {
    return (
      <View style={styles.carouselSlide}>
        <View style={styles.glowContainer}>
          <View style={styles.watchImageContainer}>
            <View style={styles.watchImageOuter}>
              <View style={styles.watchImageInner}>
                <Image
                  style={styles.watchImage}
                  source={item.image}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render progress indicators (only for original data length)
  const renderIndicators = () => {
    if (productData.length <= 1) return null;

    return (
      <View style={styles.indicatorContainer}>
        {productData.map((_, index) => {
          // Calculate which real item is currently active
          let realActiveIndex = activeIndex - 1;
          if (activeIndex === 0) realActiveIndex = productData.length - 1;
          if (activeIndex === infiniteData.length - 1) realActiveIndex = 0;

          const isActive = index === realActiveIndex;

          return (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  width: isActive ? 10 : 10,
                  opacity: isActive ? 1 : 0.3,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <>
      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={infiniteData}
          renderItem={renderCarouselItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={16}
          snapToAlignment="center"
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
        />
      </View>

      {/* Indicators */}
      {renderIndicators()}

      {/* Product Name */}
      <Text style={styles.watchName}>{currentProduct.name}</Text>

      {/* Static Tagline */}
      <Text style={styles.tagline}>{currentProduct.tagline}</Text>
    </>
  );
};

const NotificationButton = ({ onPress, interest, loading }) => {
  return (
    <View style={styles.shadowWrapper}>
      {loading ? (
        <Text style={styles.interestText}>Loading...</Text>
      ) : (
        <>
          {!interest ? (
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.notifyButton}
            >
              <TouchableOpacity style={styles.notifyButton2} onPress={onPress}>
                <Text style={styles.notifyText}>I'm Interested</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <Text style={styles.interestText}>
              Thank you for showing your interest!
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const ProductCard = ({ title, description, imagePath }) => {
  return (
    <LinearGradient
      colors={["#4D7287", "#322A4F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: 8 }}
    >
      <View style={styles.productCard}>
        <View style={styles.imageContainer}>
          <Image source={imagePath} style={styles.productImage} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.productCardTitle}>{title}</Text>
          <Text style={styles.productCardDescription} numberOfLines={2}>
            {description}
          </Text>
          <TouchableOpacity style={styles.comingSoonButton}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const marketplace = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [interest, setInterest] = useState(false);
  const [loading, setLoading] = useState(null);

  const showInterest = async () => {
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const payload = {
        client_id,
        interest: true,
      };
      const response = await showSmartWatchInterestAPI(payload);
      if (response?.status === 200) {
        setInterest(true);
        getInterest();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
    }
  };

  const getInterest = async () => {
    setLoading(true);
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await getSmartWatchInterestAPI(client_id);
      if (response?.status === 200) {
        setInterest(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
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

  // useFocusEffect(
  //   useCallback(() => {
  //     getInterest();
  //   }, [])
  // );

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          router.push("/client/home");
          return true;
        }
      );

      return () => backHandler.remove();
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <LinearGradient colors={["#FFFFFF", "#FFF"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              justifyContent: "flex-start",
              width: "100%",
              marginTop: insets.top,
            }}
            onPress={() => {
              router.push("/client/home");
            }}
          >
            <Ionicons name="arrow-back-outline" color="#263148" size={18} />
            <Text style={styles.brandName}>Shop</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.bannerContainer}>
              <ProductBanner />
            </View>

            {/* <NotificationButton
              onPress={showInterest}
              interest={interest}
              loading={loading}
            /> */}

            <View style={styles.cardsContainer}>
              <ProductCard
                title="Smart Nutrition Plan"
                description="Personalized diet plans for your goals with regular followups."
                imagePath={require("../../../assets/images/marketplace/nutrition_small.png")}
              />
              <ProductCard
                title="Fittbot Smart Wearables"
                description="New to Fitness? Your Wrist just got Smarter!"
                imagePath={require("../../../assets/images/marketplace/watch_small.png")}
              />
              <ProductCard
                title="Supplements"
                description="Premium Quality Supplements to fuel your workouts."
                imagePath={require("../../../assets/images/marketplace/supplements.png")}
              />
              <ProductCard
                title="Workout Apparel"
                description="Comfortable and stylish apparel for maximum performance."
                imagePath={require("../../../assets/images/marketplace/apparels.png")}
              />
              <ProductCard
                title="Gym Equipment"
                description="Professional grade equipment for home and commercial use."
                imagePath={require("../../../assets/images/marketplace/equipments.png")}
              />
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default marketplace;

const styles = StyleSheet.create({
  container: {
    minHeight: "100%",
  },
  content: {
    padding: 16,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#263148",
    fontFamily: "rajdhani",
  },
  bannerContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  carouselContainer: {
    height: 280,
    width: "100%",
    marginBottom: 10,
  },
  carouselSlide: {
    width: screenWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0, // Remove padding to center properly
  },
  glowContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  watchImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 0,
    width: "100%",
    zIndex: 10,
  },
  watchImageOuter: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 60,
  },
  watchImageInner: {
    width: 207,
    height: 207,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 1)",
    borderRadius: 103.5,
    backgroundColor: "#1E171E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#919BA9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 50,
  },
  watchImage: {
    width: 200,
    height: 200,
  },
  watchName: {
    marginBottom: 5,
    fontWeight: "500",
    fontSize: 18,
    color: "#263148",
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: "#263148",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: -10,
    marginBottom: 10,
  },
  indicator: {
    height: 10,

    borderRadius: 5,
    backgroundColor: "#263148",
    marginHorizontal: 4,
  },
  shadowWrapper: {
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#00c2ff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {},
    }),
  },
  notifyButton: {
    borderRadius: 8,
    marginBottom: 30,
  },
  notifyButton2: {
    paddingVertical: 10,
    paddingHorizontal: 80,
    borderColor: "rgba(160, 160, 160, 0.311)",
  },
  notifyText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  interestText: {
    marginBottom: 10,
    color: "#0154A0",
  },
  cardsContainer: {
    width: "100%",
    gap: 20,
  },
  productCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 3,
  },
  productCardTitle: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
    fontWeight: "500",
  },
  productCardDescription: {
    fontSize: 12,
    color: "#818181",
    marginBottom: 6,
    lineHeight: 18,
    flex: 1,
  },
  comingSoonButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
  },
  comingSoonText: {
    color: "#030A15",
    fontSize: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: 100,
    height: 100,
  },
});
