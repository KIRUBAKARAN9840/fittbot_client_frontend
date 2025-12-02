import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  TouchableWithoutFeedback,
  Animated,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Share } from "react-native";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
  reverseGeocodeAsync,
} from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGymStudiosAPI } from "../../services/clientApi";

const { width, height } = Dimensions.get("window");

const ITEMS_PER_PAGE = 10;

const SERVICE_COLORS = {
  Fitness: "#FF6B6B",
  CrossFit: "#4ECDC4",
  Yoga: "#95E1D3",
  Zumba: "#F38BA8",
  "Dance Class": "#A8E6CF",
  "Personal Training": "#FFD93D",
  "Weight Training": "#6C5CE7",
  Cardio: "#FD79A8",
  "24/7 Access": "#00B894",
  Swimming: "#0984E3",
  Spa: "#E17055",
  Massage: "#FDCB6E",
  Nutrition: "#00CEC9",
  "Group Classes": "#A29BFE",
  Boxing: "#E84393",
  "Strength Training": "#2D3436",
  Meditation: "#81ECEC",
  Pilates: "#FAB1A0",
  Wellness: "#55A3FF",
  "Ladies Only": "#FF7675",
  Tennis: "#00B894",
  Badminton: "#FDCB6E",
  "Steam Bath": "#74B9FF",
  Bodybuilding: "#636E72",
  Powerlifting: "#2D3436",
  "Functional Training": "#00CEC9",
  Aerobics: "#FD79A8",
  Dance: "#A8E6CF",
  Steam: "#74B9FF",
};

const UpgradeGyms = () => {
  const [gyms, setGyms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userPincode, setUserPincode] = useState("");
  const [currentPincode, setCurrentPincode] = useState("");
  const [lastUsedFilters, setLastUsedFilters] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    city: "",
    area: "",
    pincode: "",
  });

  const [tempFilters, setTempFilters] = useState({
    search: "",
    state: "",
    city: "",
    area: "",
    pincode: "",
  });

  // Animation values
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    requestLocationPermission();
  }, []);

  // Memoize the filter values to prevent unnecessary re-renders
  const filterValues = useMemo(() => {
    return {
      city: filters.city,
      area: filters.area,
      pincode: filters.pincode,
      state: filters.state,
      search: filters.search,
    };
  }, [
    filters.city,
    filters.area,
    filters.pincode,
    filters.state,
    filters.search,
  ]);

  // Load gyms when non-search filters change
  useEffect(() => {
    if (
      filterValues.city ||
      filterValues.area ||
      filterValues.pincode ||
      filterValues.state
    ) {
      fetchGyms(1, false);
    }
  }, [
    filterValues.city,
    filterValues.area,
    filterValues.pincode,
    filterValues.state,
  ]);

  // Load gyms when userPincode is detected (after location is fetched)
  useEffect(() => {
    if (
      userPincode &&
      !filters.pincode &&
      !filters.city &&
      !filters.area &&
      !filters.state &&
      !filters.search
    ) {
      fetchGyms(1, false);
    }
  }, [userPincode]);

  // Load gyms when search filter changes
  useEffect(() => {
    if (filterValues.search !== undefined) {
      if (filterValues.search !== "") {
        fetchGyms(1, false);
      } else {
        if (
          userPincode ||
          filterValues.city ||
          filterValues.area ||
          filterValues.pincode ||
          filterValues.state
        ) {
          fetchGyms(1, false);
        }
      }
    }
  }, [filterValues.search]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== searchQuery) {
        setFilters((prev) => ({ ...prev, search: searchQuery }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.search]);

  // Update current pincode when filters change
  useEffect(() => {
    setCurrentPincode(filters.pincode || userPincode);
  }, [filters.pincode, userPincode]);

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      let { status } = await requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is required to find nearby gyms. Please enable it in settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "OK", onPress: () => setLoading(false) },
          ]
        );
        setLoading(false);
        return;
      }

      // Add delay for iOS permission processing
      if (Platform.OS === "ios") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await getCurrentLocation();
    } catch (error) {
      console.error("Permission error:", error);
      setLoading(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let position = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!position && attempts < maxAttempts) {
        try {
          position = await getCurrentPositionAsync({
            accuracy:
              Platform.OS === "android"
                ? LocationAccuracy.BestForNavigation
                : LocationAccuracy.BestForNavigation,
            maximumAge: 5000,
            timeout: 15000,
          });
          break;
        } catch (locationError) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            throw locationError;
          }
        }
      }

      if (position) {
        setUserLocation(position.coords);
        await getPincodeFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert(
        "Location Error",
        "Could not get your exact location. Showing all gyms nearby.",
        [{ text: "OK" }]
      );
    } finally {
      // Don't set loading to false here since it will be set in getPincodeFromCoordinates or its error handler
    }
  };

  const fetchGyms = useCallback(
    async (page = 1, loadMore = false) => {
      try {
        if (loadMore) {
          setLoadingMore(true);
        } else {
          setApiLoading(true);
        }

        const apiParams = {
          page,
          limit: ITEMS_PER_PAGE,
          ...(filters.search &&
            filters.search.trim() && { search: filters.search }),
          ...(filters.city && filters.city.trim() && { city: filters.city }),
          ...(filters.area && filters.area.trim() && { area: filters.area }),
          ...(filters.pincode &&
            filters.pincode.trim() && { pincode: filters.pincode }),
          ...(filters.state &&
            filters.state.trim() && { state: filters.state }),
          // Only add userPincode if no other location filters are set and userPincode exists
          ...(!filters.pincode?.trim() &&
            !filters.city?.trim() &&
            !filters.area?.trim() &&
            !filters.state?.trim() &&
            !filters.search?.trim() &&
            userPincode && { pincode: userPincode }),
          // Add the daily_pass parameter with amount from route params
          daily_pass: params?.gym_id || null,
        };

        // Check if we have any filters before making API call
        const hasFilters =
          apiParams.search ||
          apiParams.city ||
          apiParams.area ||
          apiParams.pincode ||
          apiParams.state;
        if (!hasFilters && !loadMore) {
          setApiLoading(false);
          setLoadingMore(false);
          if (loading) {
            setLoading(false);
          }
          return;
        }

        // For pagination (loadMore), if no current filters, use the last used filters
        if (loadMore && !hasFilters && lastUsedFilters) {
          const paginationParams = {
            ...lastUsedFilters,
            page, // Override with new page number
            daily_pass: params?.gym_id || null, // Always include daily_pass
          };

          const response = await getGymStudiosAPI(paginationParams);

          if (response?.status === 200) {
            const normalizedGyms = (response?.data || []).map((gym) => ({
              id: gym.gym_id,
              gym_id: gym.gym_id,
              name: gym.gym_name,
              location: `${gym.address?.street || ""} ${
                gym.address?.area || ""
              }`.trim(),
              pincode: gym.address?.pincode || "",
              state: gym.address?.state || "",
              city: gym.address?.city || "",
              area: gym.address?.area || "",
              image:
                gym.cover_pic ||
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
              services: Array.isArray(gym.services)
                ? gym.services
                : gym.services
                ? gym.services.split(",")
                : [],
              openTime: gym.operating_hours || gym.gym_timings,
              verified: true,
              dailyPass: gym.dailypass || false,
              contactNumber: gym.contact_number,
              photos: gym.photos || [],
              daily_pass_price: gym?.daily_pass_actual_price,
              discountPrice: gym.daily_pass_discount_price || null,
              discount: gym.daily_pass_discount || null,
            }));

            // Only append data if we got results
            if (normalizedGyms.length > 0) {
              setGyms((prev) => [...prev, ...normalizedGyms]);
            }

            // Update pagination with response data
            setPagination({
              currentPage: response.pagination?.current_page || page,
              totalPages:
                response.pagination?.total_pages || pagination.totalPages,
              totalCount:
                response.pagination?.total_count || pagination.totalCount,
              hasNext: response.pagination?.has_next || false,
              hasPrev: response.pagination?.has_prev || false,
            });
          } else {
            console.error("Pagination API error:", response);
            setPagination((prev) => ({
              ...prev,
              hasNext: false,
            }));
          }

          setLoadingMore(false);
          return;
        } else if (loadMore && !hasFilters && !lastUsedFilters) {
          setLoadingMore(false);
          return;
        }

        const response = await getGymStudiosAPI(apiParams);

        if (response?.status === 200) {
          const normalizedGyms = (response?.data || []).map((gym) => ({
            id: gym.gym_id,
            gym_id: gym.gym_id,
            name: gym.gym_name,
            location: `${gym.address?.street || ""} ${
              gym.address?.area || ""
            }`.trim(),
            pincode: gym.address?.pincode || "",
            state: gym.address?.state || "",
            city: gym.address?.city || "",
            area: gym.address?.area || "",
            image:
              gym.cover_pic ||
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
            services: Array.isArray(gym.services)
              ? gym.services
              : gym.services
              ? gym.services.split(",")
              : [],
            openTime:
              gym.operating_hours || gym.gym_timings || "6:00 AM - 10:00 PM",
            verified: true,
            dailyPass: gym.dailypass || false,
            contactNumber: gym.contact_number,
            photos: gym.photos || [],
            daily_pass_price: gym?.daily_pass_actual_price,
            discountPrice: gym.daily_pass_discount_price || null,
            discount: gym.daily_pass_discount || null,
          }));

          if (loadMore) {
            setGyms((prev) => [...prev, ...normalizedGyms]);
          } else {
            setGyms(normalizedGyms);
          }

          setPagination({
            currentPage: response.pagination?.current_page || page,
            totalPages: response.pagination?.total_pages || 1,
            totalCount:
              response.pagination?.total_count || normalizedGyms.length,
            hasNext: response.pagination?.has_next || false,
            hasPrev: response.pagination?.has_prev || false,
          });
        } else {
          console.error("API Error:", response);
          if (!loadMore) {
            setGyms([]);
          }
        }
      } catch (error) {
        console.error("Error fetching gyms:", error);
        if (!loadMore) {
          setGyms([]);
        }
      } finally {
        setApiLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        if (loading) {
          setLoading(false);
        }
      }
    },
    [filters, lastUsedFilters, params?.currentAmount]
  );

  const getPincodeFromCoordinates = async (latitude, longitude) => {
    try {
      const geocoded = await reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocoded.length > 0) {
        let bestMatch = geocoded[0];

        // Look for result with postalCode
        for (let location of geocoded) {
          if (location.postalCode && location.postalCode.length === 6) {
            bestMatch = location;
            break;
          }
        }

        const pincode = bestMatch.postalCode || "";
        setUserPincode(pincode);
        setCurrentPincode(pincode);

        // Set initial filter to user's location - only pincode for initial filtering
        const initialFilter = {
          search: "",
          state: "",
          city: "",
          area: "",
          pincode: pincode,
        };

        setFilters(initialFilter);
        setTempFilters(initialFilter);
        // Loading will be set to false when fetchGyms is called via useEffect
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setUserPincode("");
      setCurrentPincode("");
      // Don't call fetchGyms here - let user manually search or filter
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (
      pagination.hasNext &&
      !loadingMore &&
      !apiLoading &&
      pagination.currentPage < pagination.totalPages
    ) {
      fetchGyms(pagination.currentPage + 1, true);
    }
  }, [
    pagination.hasNext,
    loadingMore,
    apiLoading,
    pagination.currentPage,
    pagination.totalPages,
    fetchGyms,
    gyms.length,
  ]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGyms(1, false);
  }, [fetchGyms]);

  const handleApplyFilters = useCallback(() => {
    setFilters({ ...tempFilters });
    setShowFilterModal(false);
  }, [tempFilters]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      search: "",
      state: "",
      city: "",
      area: "",
      pincode: "",
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setSearchQuery("");
    setCurrentPincode("");
    setUserPincode("");
    setShowFilterModal(false);

    // Directly call API with no filters to get all gyms
    const fetchAllGyms = async () => {
      try {
        setApiLoading(true);
        const apiParams = {
          page: 1,
          limit: ITEMS_PER_PAGE,
          daily_pass: params?.gym_id || null,
        };
        const response = await getGymStudiosAPI(apiParams);

        if (response?.status === 200) {
          const normalizedGyms = (response?.data || []).map((gym) => ({
            id: gym.gym_id,
            gym_id: gym.gym_id,
            name: gym.gym_name,
            location: `${gym.address?.street || ""} ${
              gym.address?.area || ""
            }`.trim(),
            pincode: gym.address?.pincode || "",
            state: gym.address?.state || "",
            city: gym.address?.city || "",
            area: gym.address?.area || "",
            image:
              gym.cover_pic ||
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
            services: Array.isArray(gym.services)
              ? gym.services
              : gym.services
              ? gym.services.split(",")
              : [],
            openTime:
              gym.operating_hours || gym.gym_timings || "6:00 AM - 10:00 PM",
            verified: true,
            dailyPass: gym.dailypass || false,
            contactNumber: gym.contact_number,
            photos: gym.photos || [],
          }));

          setGyms(normalizedGyms);
          setPagination({
            currentPage: response.pagination?.current_page || 1,
            totalPages: response.pagination?.total_pages || 1,
            totalCount:
              response.pagination?.total_count || normalizedGyms.length,
            hasNext: response.pagination?.has_next || false,
            hasPrev: response.pagination?.has_prev || false,
          });

          setLastUsedFilters({
            page: 1,
            limit: ITEMS_PER_PAGE,
            daily_pass: params?.gym_id || null,
          });
        }
      } catch (error) {
        console.error("Error fetching all gyms:", error);
      } finally {
        setApiLoading(false);
      }
    };

    fetchAllGyms();
  }, [params?.currentAmount]);

  const handleGymPress = (gym) => {
    router.push({
      pathname: "/client/upgradepass",
      params: {
        gymId: gym.gym_id,
        daily_pass_price: gym?.discountPrice,
        gymName: gym.name,
        gymLocation: gym.location,
        gymImage: gym.image,
        gymServices: JSON.stringify(gym.services),
        gymOpenTime: gym.openTime,
        gymVerified: gym.verified,
        // Pass through the upgrade parameters
        fromDate: params?.fromDate,
        toDate: params?.toDate,
        currentAmount: params?.currentAmount,
        currentGymName: params?.currentGymName,
        availableDays: params?.availableDays,
        upgradeStartDate: params?.upgradeStartDate,
        pass_id: params?.pass_id,
      },
    });
  };

  const handleBookGym = (gym) => {
    router.push({
      pathname: "/client/upgradepass",
      params: {
        gymId: gym.gym_id,
        gymName: gym.name,
        gymLocation: gym.location,
        gymImage: gym.image,
        gymServices: JSON.stringify(gym.services),
        gymOpenTime: gym.openTime,
        gymVerified: gym.verified,
        // Pass through the upgrade parameters
        fromDate: params?.fromDate,
        toDate: params?.toDate,
        currentAmount: params?.currentAmount,
        currentGymName: params?.currentGymName,
        availableDays: params?.availableDays,
        upgradeStartDate: params?.upgradeStartDate,
        pass_id: params?.pass_id, // Add missing pass_id
      },
    });
  };

  const handleShareGym = async (gym) => {
    try {
      const servicesList = gym.services.join(", ");
      const verifiedText = gym.verified ? "Fittbot Verified ✅" : "";

      const shareContent = `Check Out This Gym on Fittbot!
🏋️‍♂️ ${gym.name} ${verifiedText}

📍 Location: ${gym.location}

💪 Services: ${servicesList}

Find more gyms and book your fitness journey with Fittbot!

📱 Download Fittbot:
Android: https://play.google.com/store/apps/details?id=com.fittbot.fittbot_user&hl=en_IN
iOS: https://apps.apple.com/us/app/fittbot/id6747237294`;

      const result = await Share.share(
        {
          message: shareContent,
          title: `Check out ${gym.name}`,
        },
        {
          dialogTitle: `Share ${gym.name}`,
          excludedActivityTypes: [
            // Optionally exclude some activities
          ],
          subject: `Check out ${gym.name} on Fittbot`, // For email
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

  const renderServiceTag = (service, index) => {
    const backgroundColor = SERVICE_COLORS[service] || "#DDD";
    return (
      <View
        key={index}
        style={[
          styles.serviceTag,
          { backgroundColor: "#FFFFFF", borderWidth: 0.5, borderColor: "#ccc" },
        ]}
      >
        <Text style={styles.serviceText}>{service}</Text>
      </View>
    );
  };

  const renderListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        {/* Enhanced Search and Filter Section */}
        <View style={styles.searchFilterSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color="#007BFF" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search gyms, locations, services..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery("");
                  // Force clear the search filter immediately
                  setFilters((prev) => ({ ...prev, search: "" }));
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="tune" size={22} color="#007BFF" />
          </TouchableOpacity>
        </View>

        {/* Enhanced Location Info */}
        {currentPincode &&
          (filters.pincode ||
            (!filters.city &&
              !filters.area &&
              !filters.state &&
              !searchQuery)) && (
            <View style={styles.locationInfo}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location" size={16} color="#007BFF" />
              </View>
              <Text style={styles.locationText}>
                Showing gyms near {currentPincode}
              </Text>
              <TouchableOpacity
                style={styles.changeLocationButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Text style={styles.changeLocationText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Enhanced Results Info */}
        <View style={styles.resultsInfo}>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {pagination.totalCount} gym
              {pagination.totalCount !== 1 ? "s" : ""} found
            </Text>
            {searchQuery && (
              <Text style={styles.searchResultText}>for "{searchQuery}"</Text>
            )}
          </View>
        </View>
      </View>
    ),
    [
      searchQuery,
      currentPincode,
      filters.pincode,
      filters.city,
      filters.area,
      filters.state,
      pagination.totalCount,
      setShowFilterModal,
    ]
  );

  const renderGymCard = ({ item }) => (
    <Animated.View
      style={[
        styles.gymCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.gymCardInner}>
        {/* Enhanced Image Section */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => handleGymPress(item)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: item.image }} style={styles.gymImage} />

          {/* Overlay Elements */}
          <View style={styles.imageOverlay}>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Fittbot Verified</Text>
                <Ionicons name="checkmark-circle" size={20} color="#007BFF" />
              </View>
            )}
            {!item.verified && <View style={styles.verifiedBadge}></View>}

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShareGym(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={18} color="#007BFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Enhanced Info Section */}
        <TouchableOpacity
          style={styles.gymInfo}
          onPress={() => handleGymPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.gymHeader}>
            <Text style={styles.gymName} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => handleBookGym(item)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text style={styles.gymLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Enhanced Services Section - Separate from main TouchableOpacity */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesLabel}>Services</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.servicesContainer}
            contentContainerStyle={styles.servicesContent}
          >
            {item.services
              .slice(0, 4)
              .map((service, index) => renderServiceTag(service, index))}
            {item.services.length > 4 && (
              <View style={styles.moreServicesTag}>
                <Text style={styles.moreServicesText}>
                  +{item.services.length - 4}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
        {item?.dailyPass && (
          <>
            <View
              style={{
                marginBottom: 5,
                paddingHorizontal: 16,
                flexDirection: "row",
                justifyContent: "flex-start",
              }}
            ></View>
            <Text
              style={{
                color: "#514b4bff",
                fontSize: 12,
                fontWeight: 400,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Daily gym pass available for just{"  "}
              <Text
                style={{
                  color: "#28A745",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                ₹{item?.discountPrice}
              </Text>
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );

  const renderLoadMoreFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#007BFF" />
        <Text style={styles.loadMoreText}>Loading more gyms...</Text>
      </View>
    );
  }, [loadingMore, pagination.hasNext]);

  const renderFilterModal = useMemo(() => {
    return (
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.filterModal}>
                  <View style={styles.filterHeader}>
                    <Text style={styles.filterTitle}>Filter Gyms</Text>
                    <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.filterContent}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>State</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color="#666"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.filterInput}
                          placeholder="Enter state"
                          placeholderTextColor="#999"
                          value={tempFilters.state}
                          onChangeText={(text) =>
                            setTempFilters({ ...tempFilters, state: text })
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>City</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="business-outline"
                          size={16}
                          color="#666"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.filterInput}
                          placeholder="Enter city"
                          placeholderTextColor="#999"
                          value={tempFilters.city}
                          onChangeText={(text) =>
                            setTempFilters({ ...tempFilters, city: text })
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Area</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="map-outline"
                          size={16}
                          color="#666"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.filterInput}
                          placeholder="Enter area"
                          placeholderTextColor="#999"
                          value={tempFilters.area}
                          onChangeText={(text) =>
                            setTempFilters({ ...tempFilters, area: text })
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Pincode</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="mail-outline"
                          size={16}
                          color="#666"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.filterInput}
                          placeholder="Enter pincode"
                          placeholderTextColor="#999"
                          value={tempFilters.pincode}
                          onChangeText={(text) =>
                            setTempFilters({ ...tempFilters, pincode: text })
                          }
                          keyboardType="numeric"
                          maxLength={6}
                        />
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.filterButtons}>
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={handleResetFilters}
                    >
                      <Text style={styles.resetButtonText}>Reset All</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.applyButton}
                      onPress={handleApplyFilters}
                    >
                      <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  }, [
    showFilterModal,
    tempFilters,
    handleApplyFilters,
    handleResetFilters,
    setTempFilters,
    setShowFilterModal,
  ]);

  const insets = useSafeAreaInsets();

  if (loading || (apiLoading && gyms.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding nearby gyms...</Text>
        {locationLoading && (
          <Text style={styles.loadingSubText}>Getting your location...</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Gyms</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={gyms}
        renderItem={renderGymCard}
        keyExtractor={(item) => `${item.id || item.gym_id}-${item.name}`}
        contentContainerStyle={styles.gymList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderLoadMoreFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={60} color="#DDD" />
            <Text style={styles.emptyTitle}>No gyms found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleResetFilters}
            >
              <Text style={styles.emptyButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Loading overlay for API calls */}
      {apiLoading && gyms.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007BFF" />
        </View>
      )}

      {/* Filter Modal */}
      {renderFilterModal}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    marginTop: 16,
    fontWeight: "500",
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  headerContainer: {
    paddingBottom: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 10,
  },
  searchFilterSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.17)",
  },
  searchIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#333",
    paddingVertical: 2,
  },
  clearButton: {
    paddingHorizontal: 8,
  },
  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,123,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: "#07070773",
    fontWeight: "500",
  },
  changeLocationButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  changeLocationText: {
    fontSize: 12,
    color: "#007BFF",
    fontWeight: "600",
  },
  resultsInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
  searchResultText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  paginationText: {
    fontSize: 12,
    color: "#007BFF",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 16,
    paddingTop: 20,
    zIndex: 1,
  },
  gymList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  gymCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
    borderWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "#ddd",
  },
  gymCardInner: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  gymImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: "#007BFF",
    fontWeight: "600",
    marginLeft: 0,
  },
  shareButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gymInfo: {
    padding: 16,
    paddingBottom: 8,
  },
  gymHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    flex: 1,
    marginRight: 8,
  },
  upgradeButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 7,
  },
  upgradeButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  gymLocation: {
    fontSize: 12,
    color: "rgba(65,65,65,0.7)",
    marginLeft: 6,
    flex: 1,
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  timingText: {
    fontSize: 12,
    color: "rgba(65,65,65,0.7)",
    marginLeft: 6,
    flex: 1,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7B7B7B",
    marginBottom: 8,
    textDecorationLine: "underline",
  },
  servicesContainer: {
    marginBottom: 4,
  },
  servicesContent: {
    paddingRight: 16,
  },
  serviceTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    marginRight: 8,
  },
  serviceText: {
    fontSize: 11,
    color: "#787878",
    fontWeight: "600",
  },
  moreServicesTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#007BFF",
    marginRight: 8,
  },
  moreServicesText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filterContent: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EDF3",
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  filterInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 16,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EDF3",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#007BFF",
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default UpgradeGyms;
