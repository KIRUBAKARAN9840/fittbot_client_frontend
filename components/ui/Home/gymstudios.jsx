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
  Keyboard,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Share } from "react-native";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
  reverseGeocodeAsync,
} from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import { getGymStudiosAPI } from "../../../services/clientApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const ITEMS_PER_PAGE = 10;

// Module-level storage for session persistence
let sessionState = {
  hasRequestedLocationOnce: false,
  savedFilters: null,
  savedGyms: null,
  savedPagination: null,
  savedUserPincode: null,
  savedCurrentPincode: null,
};

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

const GymStudios = ({
  scrollY = new Animated.Value(0),
  headerHeight = 150,
}) => {
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
  const [lastUsedFilters, setLastUsedFilters] = useState({}); // Store last used filters for pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  // Refs to store current state for saving on blur
  const gymsRef = useRef(gyms);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const userPincodeRef = useRef(userPincode);
  const currentPincodeRef = useRef(currentPincode);

  // Update refs whenever state changes
  useEffect(() => {
    gymsRef.current = gyms;
  }, [gyms]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    userPincodeRef.current = userPincode;
  }, [userPincode]);

  useEffect(() => {
    currentPincodeRef.current = currentPincode;
  }, [currentPincode]);

  // Restore state when screen is focused (coming back from gym details)
  useFocusEffect(
    useCallback(() => {
      // Restore saved state if available (only on focus)
      if (sessionState.savedGyms && sessionState.savedGyms.length > 0) {
        setGyms(sessionState.savedGyms);
      }
      if (sessionState.savedFilters) {
        setFilters(sessionState.savedFilters);
        setTempFilters(sessionState.savedFilters);
      }
      if (sessionState.savedPagination) {
        setPagination(sessionState.savedPagination);
      }
      if (sessionState.savedUserPincode) {
        setUserPincode(sessionState.savedUserPincode);
      }
      if (sessionState.savedCurrentPincode) {
        setCurrentPincode(sessionState.savedCurrentPincode);
      }

      return () => {
        // Save current state when leaving the screen using refs
        if (gymsRef.current.length > 0) {
          sessionState.savedGyms = [...gymsRef.current];
        }
        sessionState.savedFilters = { ...filtersRef.current };
        sessionState.savedPagination = { ...paginationRef.current };
        sessionState.savedUserPincode = userPincodeRef.current;
        sessionState.savedCurrentPincode = currentPincodeRef.current;
      };
    }, []) // Empty dependency array - only run on focus/blur
  );

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

    // Only request location once per session
    if (!sessionState.hasRequestedLocationOnce) {
      sessionState.hasRequestedLocationOnce = true;
      requestLocationPermission();
    } else {
      // If we've already fetched location, just stop the loading
      setLoading(false);
    }

    // Keyboard listeners for both platforms
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
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

  // Debounced search query using useMemo
  const debouncedSearchQuery = useMemo(() => {
    const handler = setTimeout(() => {
      return searchQuery;
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

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
  // This is now handled inside getPincodeFromCoordinates for the first call
  // useEffect(() => {
  //   if (
  //     userPincode &&
  //     !filters.pincode &&
  //     !filters.city &&
  //     !filters.area &&
  //     !filters.state &&
  //     !filters.search
  //   ) {
  //     fetchGyms(1, false);
  //   }
  // }, [userPincode]);

  // Load gyms when search filter changes (after debounce)
  useEffect(() => {
    // Trigger API call when search has content
    if (filterValues.search !== undefined && filterValues.search !== "") {
      fetchGyms(1, false);
    } else if (filterValues.search === "") {
      // Search was cleared - reload with other active filters or location
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
        setLocationLoading(false);
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
      setLocationLoading(false);
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
          const locationOptions =
            Platform.OS === "ios"
              ? {
                  accuracy: LocationAccuracy.Highest,
                  mayShowUserSettingsDialog: true,
                  timeInterval: 5000,
                }
              : {
                  accuracy: LocationAccuracy.BestForNavigation,
                  maximumAge: 5000,
                  timeout: 15000,
                };

          position = await getCurrentPositionAsync(locationOptions);
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
      } else {
        // If no position was obtained, stop loading
        setLoading(false);
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert(
        "Location Error",
        "Could not get your exact location. Showing all gyms nearby.",
        [{ text: "OK" }]
      );
      setLoading(false);
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

        const params = {
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
        };

        // Check if we have any filters before making API call (skip this check for loadMore pagination)
        const hasFilters =
          params.search ||
          params.city ||
          params.area ||
          params.pincode ||
          params.state;
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
            page,
          };

          const response = await getGymStudiosAPI(paginationParams);

          if (response?.status === 200) {
            const normalizedGyms = response.data.map((gym) => ({
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
                "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
              services: Array.isArray(gym.services)
                ? gym.services
                : gym.services
                ? gym.services.split(",")
                : [],
              openTime:
                gym.operating_hours || gym.gym_timings || "Not Available",
              verified: true,
              dailyPass: gym.dailypass || false,
              contactNumber: gym.contact_number,
              photos: gym.photos || [],
              dailyPassPrice: gym.daily_pass_actual_price || null,
              discountPrice: gym.daily_pass_discount_price || null,
              discount: gym.daily_pass_discount || null,
              distance_km: gym.distance_km || null,
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
            // Mark pagination as ended on API error
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

        // Store the filters used for this API call for future pagination
        if (!loadMore) {
        }

        const response = await getGymStudiosAPI(params);

        if (response?.status === 200) {
          const normalizedGyms = response.data.map((gym) => ({
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
              "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
            services: Array.isArray(gym.services)
              ? gym.services
              : gym.services
              ? gym.services.split(",")
              : [],
            openTime: gym.operating_hours || gym.gym_timings || "Not Available",
            verified: true, // All gyms from API are fittbot verified
            dailyPass: gym.dailypass || false,
            contactNumber: gym.contact_number,
            photos: gym.photos || [],
            dailyPassPrice: gym.daily_pass_actual_price || null,
            discountPrice: gym.daily_pass_discount_price || null,
            discount: gym.daily_pass_discount || null,
            distance_km: gym.distance_km || null,
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
        // Set main loading to false when API call completes
        if (loading) {
          setLoading(false);
        }
      }
    },
    [filters, lastUsedFilters]
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

        if (pincode) {
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

          // Make first API call with coordinates
          try {
            setApiLoading(true);
            const params = {
              page: 1,
              limit: ITEMS_PER_PAGE,
              pincode: pincode,
              client_lat: latitude,
              client_lng: longitude,
            };

            const response = await getGymStudiosAPI(params);
            console.log(JSON.stringify(response.data));
            if (response?.status === 200) {
              const normalizedGyms = response.data.map((gym) => ({
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
                  "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
                services: Array.isArray(gym.services)
                  ? gym.services
                  : gym.services
                  ? gym.services.split(",")
                  : [],
                openTime:
                  gym.operating_hours || gym.gym_timings || "Not Available",
                verified: true,
                dailyPass: gym.dailypass || false,
                contactNumber: gym.contact_number,
                photos: gym.photos || [],
                dailyPassPrice: gym.daily_pass_actual_price || null,
                discountPrice: gym.daily_pass_discount_price || null,
                discount: gym.daily_pass_discount || null,
                distance_km: gym.distance_km || null,
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

              setLastUsedFilters(params);
            }
          } catch (error) {
            console.error("Error fetching gyms with coordinates:", error);
          } finally {
            setApiLoading(false);
            setLoading(false);
          }
        } else {
          // No pincode found, fetch all gyms
          await fetchAllGymsWithoutFilters();
        }
      } else {
        // No geocoding results, fetch all gyms
        await fetchAllGymsWithoutFilters();
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setUserPincode("");
      setCurrentPincode("");
      // Fetch all gyms if geocoding fails
      await fetchAllGymsWithoutFilters();
    }
  };

  const fetchAllGymsWithoutFilters = async () => {
    try {
      setApiLoading(true);
      const params = {
        page: 1,
        limit: ITEMS_PER_PAGE,
      };
      const response = await getGymStudiosAPI(params);

      if (response?.status === 200) {
        const normalizedGyms = response.data.map((gym) => ({
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
            "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
          services: Array.isArray(gym.services)
            ? gym.services
            : gym.services
            ? gym.services.split(",")
            : [],
          openTime: gym.operating_hours || gym.gym_timings || "Not Available",
          verified: true,
          dailyPass: gym.dailypass || false,
          contactNumber: gym.contact_number,
          photos: gym.photos || [],
          dailyPassPrice: gym.daily_pass_actual_price || null,
          discountPrice: gym.daily_pass_discount_price || null,
          discount: gym.daily_pass_discount || null,
          distance_km: gym.distance_km || null,
        }));

        setGyms(normalizedGyms);
        setPagination({
          currentPage: response.pagination?.current_page || 1,
          totalPages: response.pagination?.total_pages || 1,
          totalCount: response.pagination?.total_count || normalizedGyms.length,
          hasNext: response.pagination?.has_next || false,
          hasPrev: response.pagination?.has_prev || false,
        });

        setLastUsedFilters({ page: 1, limit: ITEMS_PER_PAGE });
      }
    } catch (error) {
      console.error("Error fetching all gyms:", error);
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    // Check if we can load more
    if (
      pagination.hasNext &&
      !loadingMore &&
      !apiLoading &&
      pagination.currentPage < pagination.totalPages
    ) {
      fetchGyms(pagination.currentPage + 1, true);
    } else {
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

  const handleGetCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const position = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.BestForNavigation,
        maximumAge: 5000,
        timeout: 15000,
      });

      if (position) {
        setUserLocation(position.coords);

        // Get pincode from coordinates
        const geocoded = await reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        let pincode = "";
        if (geocoded.length > 0) {
          let bestMatch = geocoded[0];
          for (let location of geocoded) {
            if (location.postalCode && location.postalCode.length === 6) {
              bestMatch = location;
              break;
            }
          }
          pincode = bestMatch.postalCode || "";
        }

        if (pincode) {
          setUserPincode(pincode);
          setCurrentPincode(pincode);

          const locationFilter = {
            search: "",
            state: "",
            city: "",
            area: "",
            pincode: pincode,
          };

          setFilters(locationFilter);
          setTempFilters(locationFilter);

          // Make API call with coordinates
          setApiLoading(true);
          const params = {
            page: 1,
            limit: ITEMS_PER_PAGE,
            pincode: pincode,
            client_lat: position.coords.latitude,
            client_lng: position.coords.longitude,
          };

          const response = await getGymStudiosAPI(params);

          if (response?.status === 200) {
            const normalizedGyms = response.data.map((gym) => ({
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
                "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
              services: Array.isArray(gym.services)
                ? gym.services
                : gym.services
                ? gym.services.split(",")
                : [],
              openTime: gym.operating_hours || gym.gym_timings || "Not Available",
              verified: true,
              dailyPass: gym.dailypass || false,
              contactNumber: gym.contact_number,
              photos: gym.photos || [],
              dailyPassPrice: gym.daily_pass_actual_price || null,
              discountPrice: gym.daily_pass_discount_price || null,
              discount: gym.daily_pass_discount || null,
              distance_km: gym.distance_km || null,
            }));

            setGyms(normalizedGyms);
            setPagination({
              currentPage: response.pagination?.current_page || 1,
              totalPages: response.pagination?.total_pages || 1,
              totalCount: response.pagination?.total_count || normalizedGyms.length,
              hasNext: response.pagination?.has_next || false,
              hasPrev: response.pagination?.has_prev || false,
            });

            setLastUsedFilters(params);
          }
          setApiLoading(false);
        }
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your current location. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

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
    setCurrentPincode(""); // Clear current pincode display
    setUserPincode(""); // Also clear user pincode to prevent auto-filtering
    setShowFilterModal(false);

    // Directly call API with no filters to get all gyms
    const fetchAllGyms = async () => {
      try {
        setApiLoading(true);
        const params = {
          page: 1,
          limit: ITEMS_PER_PAGE,
        };
        const response = await getGymStudiosAPI(params);

        if (response?.status === 200) {
          const normalizedGyms = response.data.map((gym) => ({
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
              "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
            services: Array.isArray(gym.services)
              ? gym.services
              : gym.services
              ? gym.services.split(",")
              : [],
            openTime: gym.operating_hours || gym.gym_timings || "Not Available",
            verified: true,
            dailyPass: gym.dailypass || false,
            contactNumber: gym.contact_number,
            photos: gym.photos || [],
            dailyPassPrice: gym.daily_pass_actual_price || null,
            discountPrice: gym.daily_pass_discount_price || null,
            discount: gym.daily_pass_discount || null,
            distance_km: gym.distance_km || null,
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

          // Update lastUsedFilters for reset results (no filters)
          setLastUsedFilters({ page: 1, limit: ITEMS_PER_PAGE });
        }
      } catch (error) {
        console.error("Error fetching all gyms:", error);
      } finally {
        setApiLoading(false);
      }
    };

    fetchAllGyms();
  }, []);

  const handleGymPress = (gym_id, price, discountPrice, discount) => {
    router.push({
      pathname: "/client/gymdetails",
      params: {
        gym_id: gym_id,
        passPrice: price,
        discountPrice: discountPrice,
        discount: discount,
      },
    });
  };

  const handleBookGym = (gym_id, price, discountPrice, discount) => {
    router.push({
      pathname: "/client/gymdetails",
      params: {
        gym_id: gym_id,
        passPrice: price,
        discountPrice: discountPrice,
        discount: discount,
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

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(async () => {
    setSearchQuery("");
    setFilters((prev) => ({ ...prev, search: "" }));

    // Call API directly like reset button does
    try {
      setApiLoading(true);
      const params = {
        page: 1,
        limit: ITEMS_PER_PAGE,
        // Include any active filters except search
        ...(filters.city && filters.city.trim() && { city: filters.city }),
        ...(filters.area && filters.area.trim() && { area: filters.area }),
        ...(filters.pincode &&
          filters.pincode.trim() && { pincode: filters.pincode }),
        ...(filters.state && filters.state.trim() && { state: filters.state }),
        // Add userPincode if no other location filters
        ...(!filters.pincode?.trim() &&
          !filters.city?.trim() &&
          !filters.area?.trim() &&
          !filters.state?.trim() &&
          userPincode && { pincode: userPincode }),
      };

      const response = await getGymStudiosAPI(params);

      if (response?.status === 200) {
        const normalizedGyms = response.data.map((gym) => ({
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
            "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/Gym_Studios/default_gym_mage.png",
          services: Array.isArray(gym.services)
            ? gym.services
            : gym.services
            ? gym.services.split(",")
            : [],
          openTime: gym.operating_hours || gym.gym_timings || "Not Available",
          verified: true,
          dailyPass: gym.dailypass || false,
          contactNumber: gym.contact_number,
          photos: gym.photos || [],
          dailyPassPrice: gym.daily_pass_actual_price || null,
          discountPrice: gym.daily_pass_discount_price || null,
          discount: gym.daily_pass_discount || null,
          distance_km: gym.distance_km || null,
        }));

        setGyms(normalizedGyms);
        setPagination({
          currentPage: response.pagination?.current_page || 1,
          totalPages: response.pagination?.total_pages || 1,
          totalCount: response.pagination?.total_count || normalizedGyms.length,
          hasNext: response.pagination?.has_next || false,
          hasPrev: response.pagination?.has_prev || false,
        });

        setLastUsedFilters(params);
      }
    } catch (error) {
      console.error("Error fetching gyms after clearing search:", error);
    } finally {
      setApiLoading(false);
    }
  }, [filters, userPincode]);

  const renderListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        {/* Enhanced Search and Filter Section */}
        <View style={styles.searchFilterSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color="#FF5757" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search gyms, locations, services..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSearch}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="tune" size={22} color="#FF5757" />
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
                <Ionicons name="location" size={16} color="#FF5757" />
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

        {/* Get Current Location Button - Show when no location is set */}
        {!currentPincode &&
          !filters.city &&
          !filters.area &&
          !filters.state &&
          !searchQuery && (
            <View style={styles.locationInfo}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location-outline" size={16} color="#FF5757" />
              </View>
              <Text style={styles.locationText}>
                {locationLoading ? "Getting your location..." : "Find gyms near your location"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.getCurrentLocationButton,
                  locationLoading && styles.getCurrentLocationButtonDisabled,
                ]}
                onPress={handleGetCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.getCurrentLocationText}>Get Location</Text>
                )}
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
      locationLoading,
      handleGetCurrentLocation,
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
          onPress={() =>
            handleGymPress(
              item?.gym_id,
              item?.dailyPassPrice,
              item?.discountPrice,
              item?.discount
            )
          }
          activeOpacity={0.8}
        >
          <Image source={{ uri: item.image }} style={styles.gymImage} />

          {/* Overlay Elements */}
          <View style={styles.imageOverlay}>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Fittbot Verified</Text>
                {/* <Ionicons name="checkmark-circle" size={20} color="#007BFF" /> */}
                <Image
                  source={require("../../../assets/images/verified.png")}
                  style={{ width: 18, height: 18, marginLeft: 5 }}
                />
              </View>
            )}
            {!item.verified && <View style={styles.verifiedBadge}></View>}

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShareGym(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={18} color="#FF5757" />
            </TouchableOpacity>
          </View>

          {/* Distance Badge */}
          {item.distance_km !== null && item.distance_km !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {item.distance_km} Kms Away
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Enhanced Info Section */}
        <TouchableOpacity
          style={styles.gymInfo}
          onPress={() =>
            handleGymPress(
              item?.gym_id,
              item?.dailyPassPrice,
              item?.discountPrice,
              item?.discount
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.gymHeader}>
            <Text style={styles.gymName} numberOfLines={1}>
              {item?.name ? String(item.name).toUpperCase() : ""}
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() =>
                handleBookGym(
                  item?.gym_id,
                  item?.dailyPassPrice,
                  item?.discountPrice,
                  item?.discount
                )
              }
            >
              <Text style={styles.bookButtonText}>Join Now</Text>
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
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: "#FF5757",
                  width: "auto",
                  borderRadius: 8,
                }}
                onPress={() =>
                  router.push({
                    pathname: "/client/dailypass",
                    params: {
                      amount: item?.dailyPassPrice,
                      discountPrice: item?.discountPrice,
                      discount_per: item?.discount,
                      gymName: item?.name || null,
                      gymId: item?.gym_id,
                      location:
                        !item?.location && !item?.area && !item?.city
                          ? "Location Not Available"
                          : `${item?.location}, ${item?.area}, ${item?.city}` ||
                            null,
                    },
                  })
                }
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 12, fontWeight: 400 }}
                >
                  Daily Gym Pass Available
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={{
                color: "#414141",
                fontSize: 10,
                fontWeight: 400,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Stay Active everyday with Daily Gym Pass available for just
              {"  "}
              <Text
                style={{
                  color: "#28A745",
                  fontSize: 13,
                  fontWeight: 600,
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

  const renderFilterModal = useMemo(() => {
    return (
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowFilterModal(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setShowFilterModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.filterModal,
                { paddingBottom: Math.max(insets.bottom, 24) },
              ]}
            >
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filter Gyms</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowFilterModal(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.filterContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
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
                      placeholderTextColor={"#aaa"}
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
                      value={tempFilters.city}
                      placeholderTextColor={"#aaa"}
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
                      value={tempFilters.area}
                      placeholderTextColor={"#aaa"}
                      onChangeText={(text) =>
                        setTempFilters({ ...tempFilters, area: text })
                      }
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    isKeyboardVisible && { paddingBottom: 200 },
                  ]}
                >
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.filterInput}
                      placeholder="Enter pincode"
                      value={tempFilters.pincode}
                      placeholderTextColor={"#aaa"}
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
                  onPress={() => {
                    Keyboard.dismiss();
                    handleResetFilters();
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleApplyFilters();
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }, [
    showFilterModal,
    tempFilters,
    handleApplyFilters,
    handleResetFilters,
    setTempFilters,
    setShowFilterModal,
    insets.bottom,
    isKeyboardVisible,
  ]);

  const renderLoadMoreFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#007BFF" />
        <Text style={styles.loadMoreText}>Loading more gyms...</Text>
      </View>
    );
  }, [loadingMore, pagination.hasNext]);

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
    <View style={styles.container}>
      <FlatList
        data={gyms}
        renderItem={renderGymCard}
        keyExtractor={(item) => `${item.id || item.gym_id}-${item.name}`}
        contentContainerStyle={[styles.gymList, { paddingTop: headerHeight }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
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
    marginTop: 10,
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
    // backgroundColor: "#FFF",
    paddingBottom: 10,
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOffset: { width: 2, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 10,
  },
  searchFilterSection: {
    flexDirection: "row",
    alignItems: "center",
    // paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#F5F7FA",
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
    // marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,87,87,0.1)",
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
    color: "#FF5757",
    fontWeight: "600",
  },
  getCurrentLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF5757",
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  getCurrentLocationButtonDisabled: {
    backgroundColor: "#FFB3B3",
    opacity: 0.7,
  },
  getCurrentLocationText: {
    fontSize: 12,
    color: "#FFFFFF",
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
    color: "#FF5757",
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
    borderRadius: 8,
    // marginLeft: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#000",
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
  distanceBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#00A8E8",
    fontWeight: "600",
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
    fontSize: 15,
    fontWeight: "bold",
    color: "#454545",
    flex: 1,
    marginRight: 8,
  },
  bookButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  bookButtonText: {
    fontSize: 12,
    color: "#FF5757",
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
    marginBottom: 8,
  },
  timingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
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
    height: height * 0.75,
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
    flexGrow: 1,
    flexShrink: 1,
  },
  filterScrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
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
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
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
    backgroundColor: "#FF5757",
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default GymStudios;
