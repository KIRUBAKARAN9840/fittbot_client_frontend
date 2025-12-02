import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toIndianISOString } from "../../../utils/basicUtilFunctions";
import {
  gymBuddyAcceptProposalAPI,
  gymBuddyCreateSessionAPI,
  gymBuddyDeclineProposalAPI,
  gymBuddyDeleteSessionAPI,
  gymBuddyJoinProposalAPI,
  gymBuddyRescheduleSessionAPI,
  gymBuddyRemoveParticipantsSessionAPI,
} from "../../../services/clientApi";
import { useRouter } from "expo-router";

import { showToast } from "../../../utils/Toaster";
import { WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";
import { Image } from "expo-image";
import SkeletonHome from "./skeletonHome";
import { isFittbotPremium, isPureFreemium } from "../../../config/access";
import PremiumBadge from "../Payment/premiumbadge";
import JoinGym from "../Payment/joingym";
const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

export default function gymBuddy(props) {
  if (isPureFreemium(props.plan))
    return <PremiumBadge size={30} topSpace={true} />;
  if (isFittbotPremium(props.plan))
    return (
      <JoinGym
        size={30}
        topSpace={true}
        onChangeTab={props.onChangeTab}
        tab={true}
      />
    );
  return <GymBuddyContent {...props} />;
}

function GymBuddyContent(props) {
  const insets = useSafeAreaInsets();
  const [gymId, setGymId] = React.useState(null);
  React.useEffect(() => {
    AsyncStorage.getItem("gym_id").then((id) => setGymId(Number(id)));
  }, []);
  const url1 = "websocket_live";
  const url2 = "sessions";
  return (
    <WebSocketProvider gymId={gymId} url1={url1} url2={url2}>
      <Buddy {...props} insets={insets} />
    </WebSocketProvider>
  );
}

const SessionImageCarousel = ({
  workoutImages,
  workoutTypes = [],
  containerWidth = 140,
  containerHeight = 130,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const autoScrollTimer = useRef(null);

  // Create infinite loop arrays by triplicating the data
  const createInfiniteArray = (arr) => {
    if (!arr || arr.length === 0) return [];
    if (arr.length === 1) return arr;
    return [...arr, ...arr, ...arr];
  };

  const infiniteImages = createInfiniteArray(workoutImages);
  const infiniteTypes = createInfiniteArray(workoutTypes);
  const originalLength = workoutImages?.length || 0;

  useEffect(() => {
    if (!workoutImages || workoutImages.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      if (!isScrolling && scrollViewRef.current) {
        const nextIndex = currentIndex + 1;
        const scrollToIndex = nextIndex + originalLength; // Start from middle section

        if (scrollToIndex >= 0 && scrollToIndex * containerWidth >= 0) {
          setCurrentIndex(nextIndex % originalLength);

          try {
            scrollViewRef.current.scrollTo({
              x: scrollToIndex * containerWidth,
              animated: true,
            });
          } catch (error) {
            // Ignore scroll errors
          }
        }
      }
    }, 3000);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, [
    currentIndex,
    workoutImages,
    isScrolling,
    originalLength,
    containerWidth,
  ]);

  const handleScroll = (event) => {
    if (!event?.nativeEvent) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / containerWidth);

    // Handle infinite scroll boundaries
    if (index >= originalLength * 2) {
      // If we're at the end, jump to beginning of middle section
      try {
        scrollViewRef.current?.scrollTo({
          x: originalLength * containerWidth,
          animated: false,
        });
      } catch (error) {
        // Ignore scroll errors
      }
    } else if (index < originalLength) {
      // If we're at the beginning, jump to end of middle section
      try {
        scrollViewRef.current?.scrollTo({
          x: (originalLength * 2 - 1) * containerWidth,
          animated: false,
        });
      } catch (error) {
        // Ignore scroll errors
      }
    }

    setCurrentIndex(index % originalLength);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, []);

  if (!workoutImages || workoutImages.length === 0) {
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: containerWidth,
            height: containerHeight,
            borderRadius: 8,
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFFFFF", "#FFFFFF", "rgba(103,197,251,0.3)"]}
            style={{
              width: containerWidth,
              height: containerHeight,
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("../../../assets/images/PERSONAL_WORKOUT_02 1.png")}
                style={{
                  width: containerWidth - 20,
                  height: containerHeight - 50,
                }}
                contentFit="contain"
              />
            </View>
            <View style={{ paddingHorizontal: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#333",
                  textAlign: "center",
                  fontWeight: "600",
                  maxWidth: containerWidth - 16,
                }}
                numberOfLines={1}
              >
                Workout
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (workoutImages.length === 1) {
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: containerWidth,
            height: containerHeight,
            borderRadius: 8,
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFFFFF", "#FFFFFF", "rgba(103,197,251,0.3)"]}
            style={{
              width: containerWidth,
              height: containerHeight,
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <Image
                source={{ uri: workoutImages[0] }}
                style={{
                  width: containerWidth - 20,
                  height: containerHeight - 50,
                }}
                contentFit="contain"
              />
            </View>
            <View style={{ paddingHorizontal: 8, width: containerWidth - 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#333",
                  textAlign: "center",
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {workoutTypes[0] || "Workout"}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: containerWidth,
          height: containerHeight,
          borderRadius: 8,
          // overflow: "hidden",
          marginTop: 10,
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setIsScrolling(false)}
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={{
            width: containerWidth * infiniteImages.length,
            height: containerHeight,
          }}
          onLayout={() => {
            // Start at the middle section
            if (scrollViewRef.current && originalLength > 0) {
              scrollViewRef.current.scrollTo({
                x: originalLength * containerWidth,
                animated: false,
              });
            }
          }}
        >
          {infiniteImages.map((image, index) => (
            <View
              key={index}
              style={{
                width: containerWidth,
                height: containerHeight,
              }}
            >
              <LinearGradient
                colors={[
                  "#FFFFFF",
                  "#FFFFFF",
                  "#FFFFFF",
                  "rgba(103,197,251,0.3)",
                ]}
                style={{
                  width: containerWidth,
                  height: containerHeight,
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Image
                    source={{ uri: image }}
                    style={{
                      width: containerWidth - 20,
                      height: containerHeight - 50,
                    }}
                    contentFit="contain"
                  />
                </View>
                <View
                  style={{ paddingHorizontal: 8, width: containerWidth - 16 }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#333",
                      textAlign: "center",
                      fontWeight: "600",
                      letterSpacing: 0.5,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                  >
                    {workoutTypes[currentIndex] || "Workout"}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        {workoutImages.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              position: "absolute",
              bottom: -10,
              width: "100%",
            }}
          >
            {workoutImages.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    currentIndex === index ? "#FF5757" : "rgba(0,0,0,0.3)",
                  marginHorizontal: 1,
                }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const Buddy = ({ scrollY, headerHeight = 110, insets }) => {
  const [sessions, setSessions] = useState([]);
  const [socket, setSocket] = useState(null);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [isRescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTimePickerJoin, setShowTimePickerJoin] = useState(false);
  const [showDatePickerReschedule, setShowDatePickerReschedule] =
    useState(false);
  const [showTimePickerReschedule, setShowTimePickerReschedule] =
    useState(false);
  const [filter, setFilter] = useState("upcoming");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formattedTime, setFormattedTime] = useState("");
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [tempTimeJoin, setTempTimeJoin] = useState(new Date());
  const [tempDateReschedule, setTempDateReschedule] = useState(new Date());
  const [tempTimeReschedule, setTempTimeReschedule] = useState(new Date());
  const [newSession, setNewSession] = useState({
    date: null,
    time: null,
    maxParticipants: 4,
    preferredGender: "any",
    muscleGroups: ["Chest"],
  });

  const [newSessionJoin, setNewSessionJoin] = useState({
    date: new Date(),
    time: new Date(),
  });

  const [rescheduleSession, setRescheduleSession] = useState({
    date: null,
    time: null,
  });

  const [isRemoveParticipantsModalVisible, setRemoveParticipantsModalVisible] =
    useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  const createButtonScale = new Animated.Value(1);
  const router = useRouter();
  const ws = useRef(null);

  useFeedSocket(async (message) => {
    try {
      const id = await AsyncStorage.getItem("client_id");
      if (
        message.action === "session_data" ||
        message.action === "update_sessions"
      ) {
        setCurrentUserId(id);
        setSessions(message.data);
        filterSessions(message.data, filter);
      } else {
        setSessions([]);
      }
    } catch (err) {
      alert("something went wrong");
    } finally {
    }
  });

  const generateAvatar = (userName) => {
    const firstLetter = userName ? userName.charAt(0).toUpperCase() : "?";
    const colors = ["#FF5757", "#4CAF50", "#2196F3", "#9C27B0", "#FF9800"];
    const colorIndex = userName ? userName.charCodeAt(0) % colors.length : 0;

    return (
      <View
        style={{
          width: responsiveWidth(10),
          height: responsiveWidth(10),
          borderRadius: responsiveWidth(5),
          backgroundColor: colors[colorIndex],
          justifyContent: "center",
          alignItems: "center",
          marginRight: responsiveWidth(0),
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: responsiveFontSize(16),
            fontWeight: "bold",
          }}
        >
          {firstLetter}
        </Text>
      </View>
    );
  };

  useEffect(() => {
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
    // fetchAllSessions()

    return () => {
      setDetailModalVisible(false);
    };
  }, []);

  const filterSessions = (allSessions, filterType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterType) {
      case "upcoming":
        setFilteredSessions(
          allSessions.filter(
            (session) => new Date(session.session_date) >= today
          )
        );
        break;
      case "my-sessions":
        setFilteredSessions(
          allSessions.filter((session) => session.host_id == currentUserId)
        );
        break;
      case "joined":
        setFilteredSessions(
          allSessions.filter(
            (session) =>
              session.host_id != currentUserId &&
              session.participants.some((p) => p.user_id == currentUserId)
          )
        );
        break;
      default:
        setFilteredSessions(allSessions);
    }
  };

  const handleCreateSession = () => {
    Animated.sequence([
      Animated.timing(createButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(createButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setCreateModalVisible(true));
  };

  const saveNewSession = async () => {
    if (!newSession.date) {
      alert("Please select a date for your session");
      return;
    }
    if (!newSession.time) {
      alert("Please select a time for your session");
      return;
    }

    // Check if the selected date is today and time is in the past
    const today = new Date();
    const selectedDate = new Date(newSession.date);
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const selectedDateTime = new Date(newSession.date);
      selectedDateTime.setHours(newSession.time.getHours());
      selectedDateTime.setMinutes(newSession.time.getMinutes());

      if (selectedDateTime <= now) {
        Alert.alert(
          "Invalid Time",
          "Please select a future time for today's session"
        );
        return;
      }
    }

    if (!newSession.muscleGroups || newSession.muscleGroups.length === 0) {
      alert("Please select at least one muscle group");
      return;
    }

    try {
      const hostId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!hostId || !gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const parsedHostId = parseInt(hostId, 10);
      const parsedGymId = parseInt(gymId, 10);

      const sessionHours = newSession.time.getHours();
      const sessionMinutes = newSession.time.getMinutes();
      const formattedTime = `${sessionHours
        .toString()
        .padStart(2, "0")}:${sessionMinutes.toString().padStart(2, "0")}:00`;

      const newSessionObj = {
        gym_id: parsedGymId,
        host_id: parsedHostId,
        session_date: toIndianISOString(newSession.date).split("T")[0],
        session_time: formattedTime,
        participant_limit: newSession.maxParticipants,
        gender_preference: newSession.preferredGender,
        workout_type: newSession.muscleGroups,
      };

      const response = await gymBuddyCreateSessionAPI(newSessionObj);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Session Created Successfully",
        });
        setCreateModalVisible(false);
        setNewSession({
          date: null,
          time: null,
          maxParticipants: 4,
          preferredGender: "any",
          muscleGroups: ["Chest"],
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to create session",
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

  const convertTimeStringToDate = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  };

  const handleOpenSession = (session) => {
    setSelectedSession(session);
    setDetailModalVisible(true);

    const sessionDate = convertTimeStringToDate(session.session_time);

    setNewSessionJoin((prev) => ({
      ...prev,
      time: sessionDate,
      date: new Date(session.session_date),
    }));

    setFormattedTime(session.session_time);

    setTempTimeJoin(sessionDate);
  };

  const handleRequestJoin = async () => {
    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const payload = {
        proposer_id: currentUserId,
        session_id: selectedSession?.session_id,
        proposed_time: formattedTime,
        gym_id,
      };
      const response = await gymBuddyJoinProposalAPI(payload);
      if (response?.status === 200) {
        setDetailModalVisible(false);
        showToast({
          type: "success",
          title: "Success",
          desc: "Request Sent Successfully",
        });
        // await fetchAllSessions()
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail ||
            "Unable to send proposal. Please try again later",
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

  const handleAcceptRequest = async (sessionId, requestId) => {
    const gym_id = await AsyncStorage.getItem("gym_id");
    if (!gym_id) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
    try {
      const payload = {
        session_id: sessionId,
        proposal_id: requestId,
        gym_id,
      };

      const response = await gymBuddyAcceptProposalAPI(payload);
      if (response?.status === 200) {
        setDetailModalVisible(false);
        // await fetchAllSessions()
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Acceptiong Proposal",
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

  const handleRejectRequest = async (sessionId, requestId, proposerId) => {
    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await gymBuddyDeclineProposalAPI(
        sessionId,
        requestId,
        proposerId,
        gym_id
      );
      if (response?.status === 200) {
        setDetailModalVisible(false);
        // await fetchAllSessions()
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error declining proposal",
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

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      if (Platform.OS === "ios") {
        setTempDate(selectedDate);
      } else {
        setNewSession({ ...newSession, date: selectedDate });
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
        setNewSession({ ...newSession, time: selectedTime });
      }
    }
  };

  const handleTimeChangeJoin = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePickerJoin(false);
    }

    if (selectedTime) {
      if (Platform.OS === "ios") {
        setTempTimeJoin(selectedTime);
      } else {
        setNewSessionJoin((prev) => ({ ...prev, time: selectedTime }));
        const hours = selectedTime.getHours().toString().padStart(2, "0");
        const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
        setFormattedTime(`${hours}:${minutes}:00`);
      }
    }
  };

  const confirmDateSelection = () => {
    setNewSession({ ...newSession, date: tempDate });
    setShowDatePicker(false);
  };

  const confirmTimeSelection = () => {
    setNewSession({ ...newSession, time: tempTime });
    setShowTimePicker(false);
  };

  const confirmTimeJoinSelection = () => {
    setNewSessionJoin((prev) => ({ ...prev, time: tempTimeJoin }));
    const hours = tempTimeJoin.getHours().toString().padStart(2, "0");
    const minutes = tempTimeJoin.getMinutes().toString().padStart(2, "0");
    setFormattedTime(`${hours}:${minutes}:00`);
    setShowTimePickerJoin(false);
  };

  const cancelDateSelection = () => {
    setTempDate(newSession.date || new Date());
    setShowDatePicker(false);
  };

  const cancelTimeSelection = () => {
    setTempTime(newSession.time || new Date());
    setShowTimePicker(false);
  };

  const toggleMuscleGroup = (muscle) => {
    setNewSession((prev) => {
      const currentGroups = prev.muscleGroups || [];
      if (currentGroups.includes(muscle)) {
        return {
          ...prev,
          muscleGroups: currentGroups.filter((group) => group !== muscle),
        };
      } else {
        return {
          ...prev,
          muscleGroups: [...currentGroups, muscle],
        };
      }
    });
  };

  const cancelTimeJoinSelection = () => {
    setTempTimeJoin(newSessionJoin.time);
    setShowTimePickerJoin(false);
  };

  const handleDateChangeReschedule = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePickerReschedule(false);
    }

    if (selectedDate) {
      if (Platform.OS === "ios") {
        setTempDateReschedule(selectedDate);
      } else {
        setRescheduleSession({ ...rescheduleSession, date: selectedDate });
      }
    }
  };

  const handleTimeChangeReschedule = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePickerReschedule(false);
    }

    if (selectedTime) {
      if (Platform.OS === "ios") {
        setTempTimeReschedule(selectedTime);
      } else {
        setRescheduleSession({ ...rescheduleSession, time: selectedTime });
      }
    }
  };

  const confirmDateRescheduleSelection = () => {
    setRescheduleSession({ ...rescheduleSession, date: tempDateReschedule });
    setShowDatePickerReschedule(false);
  };

  const confirmTimeRescheduleSelection = () => {
    setRescheduleSession({ ...rescheduleSession, time: tempTimeReschedule });
    setShowTimePickerReschedule(false);
  };

  const cancelDateRescheduleSelection = () => {
    setTempDateReschedule(rescheduleSession.date || new Date());
    setShowDatePickerReschedule(false);
  };

  const cancelTimeRescheduleSelection = () => {
    setTempTimeReschedule(rescheduleSession.time || new Date());
    setShowTimePickerReschedule(false);
  };

  const handleOpenRescheduleModal = () => {
    setDetailModalVisible(false);
    setRescheduleModalVisible(true);
  };

  const handleRescheduleSession = async () => {
    if (!rescheduleSession.date) {
      Alert.alert("Error", "Please select a date for rescheduling");
      return;
    }
    if (!rescheduleSession.time) {
      Alert.alert("Error", "Please select a time for rescheduling");
      return;
    }

    // Check if the selected date is today and time is in the past
    const today = new Date();
    const selectedDate = new Date(rescheduleSession.date);
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const selectedDateTime = new Date(rescheduleSession.date);
      selectedDateTime.setHours(rescheduleSession.time.getHours());
      selectedDateTime.setMinutes(rescheduleSession.time.getMinutes());

      if (selectedDateTime <= now) {
        Alert.alert(
          "Invalid Time",
          "Please select a future time for today's session"
        );
        return;
      }
    }

    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const sessionHours = rescheduleSession.time.getHours();
      const sessionMinutes = rescheduleSession.time.getMinutes();
      const formattedTime = `${sessionHours
        .toString()
        .padStart(2, "0")}:${sessionMinutes.toString().padStart(2, "0")}:00`;

      const payload = {
        gym_id: parseInt(gym_id, 10),
        session_id: selectedSession?.session_id,
        new_session_date: toIndianISOString(rescheduleSession.date).split(
          "T"
        )[0],
        new_session_time: formattedTime,
      };

      const response = await gymBuddyRescheduleSessionAPI(payload);
      if (response?.status === 200) {
        setRescheduleModalVisible(false);
        showToast({
          type: "success",
          title: "Success",
          desc: "Session Rescheduled Successfully",
        });
        setRescheduleSession({
          date: null,
          time: null,
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error rescheduling session",
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

  const resetRescheduleSession = () => {
    setRescheduleModalVisible(false);
    setRescheduleSession({
      date: null,
      time: null,
    });
    setTempDateReschedule(new Date());
    setTempTimeReschedule(new Date());
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await gymBuddyDeleteSessionAPI(sessionId, gym_id);
      if (response?.status === 200) {
        setDetailModalVisible(false);
        // await fetchAllSessions()
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error deleting session",
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

  const handleRemoveParticipants = async () => {
    if (selectedParticipants.length === 0) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please select at least one participant to remove",
      });
      return;
    }

    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const participantNames = selectedParticipants
        .map((id) => {
          const participant = selectedSession.participants.find(
            (p) => p.user_id === id
          );
          return participant?.participant_name;
        })
        .filter(Boolean);

      Alert.alert(
        "Remove Participants",
        `Are you removing these users: ${participantNames.join(", ")}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: async () => {
              const response = await gymBuddyRemoveParticipantsSessionAPI({
                session_id: selectedSession.session_id,
                gym_id: gym_id,
                client_ids: selectedParticipants,
              });

              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Success",
                  desc: "Participants removed successfully",
                });
                setRemoveParticipantsModalVisible(false);
                setSelectedParticipants([]);
                setSelectedSession(null);
                // Optionally refresh the session data here
              } else {
                showToast({
                  type: "error",
                  title: "Error",
                  desc: response?.detail || "Error removing participants",
                });
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const toggleParticipantSelection = (userId) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const resetSession = () => {
    setCreateModalVisible(false);
    setNewSession({
      date: null,
      time: null,
      maxParticipants: 4,
      preferredGender: "any",
      muscleGroup: ["Chest"],
    });
    setTempDate(new Date());
    setTempTime(new Date());
  };

  const renderSessionItem = ({ item }) => {
    const isMySession = item.host_id == currentUserId;
    const isRejected =
      Array.isArray(item?.rejected) &&
      item.rejected?.includes(Number(currentUserId));
    const isRequested =
      item.host_id != currentUserId &&
      item?.requests?.some((r) => r.proposer_id == currentUserId);
    const isAccepted = item.participants?.some(
      (p) => p.user_id == Number(currentUserId)
    );
    const remainingSpots = item.participant_limit - item.participant_count;
    const sessionDate = new Date(item.session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const muscleGroupsText = Array.isArray(item.workout_type)
      ? item.workout_type.join(", ")
      : item.workout_type;

    const isToday = sessionDate.toDateString() === today.toDateString();
    const isTomorrow =
      new Date(today.setDate(today.getDate() + 1)).toDateString() ===
      sessionDate.toDateString();

    let dateText = `${sessionDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
    if (isToday) dateText = "Today";
    if (isTomorrow) dateText = "Tomorrow";

    return (
      <Animated.View
        style={[
          styles.sessionCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.sessionCardInner}
          onPress={() => handleOpenSession(item)}
          activeOpacity={0.8}
        >
          {isMySession && (
            <View style={styles.mySessionTag}>
              <Text style={styles.mySessionTagText}>My Session</Text>
            </View>
          )}

          {isRejected && (
            <View style={styles.rejectedProposalTag}>
              <Text style={styles.mySessionTagText}>Request Declined</Text>
            </View>
          )}

          {isRequested && (
            <View style={styles.requestedProposalTag}>
              <Text style={styles.mySessionTagText}>Request Pending</Text>
            </View>
          )}

          {isAccepted && (
            <View style={styles.acceptedProposalTag}>
              <Text style={styles.mySessionTagText}>Request Accepted</Text>
            </View>
          )}

          <View style={styles.sessionDetails}>
            <View style={styles.detailRow}>
              <View style={{ marginLeft: 6, flex: 1 }}>
                <View style={styles.sessionHeader}>
                  <View style={styles.detailRow}>
                    {item?.host_profile ? (
                      <Image
                        source={{ uri: item?.host_profile }}
                        style={{
                          width: responsiveWidth(7),
                          height: responsiveWidth(7),
                          borderRadius: responsiveWidth(5),
                          marginRight: responsiveWidth(0),
                        }}
                      />
                    ) : (
                      generateAvatar(item?.host_name)
                    )}
                    <Text style={styles.hostName}>
                      {isMySession ? "You" : item?.host_name}
                    </Text>
                  </View>
                </View>
                <View style={[styles.detailRow, { marginBottom: 6 }]}>
                  <Image
                    source={require("../../../assets/images/buddy/calendar.png")}
                    style={{ width: 14, height: 14 }}
                  />
                  <Text style={[styles.detailText, { fontSize: 14 }]}>
                    {dateText} • {item.session_time}
                  </Text>
                </View>

                <View style={[styles.detailRow, { marginBottom: 6 }]}>
                  <Image
                    source={require("../../../assets/images/buddy/joined.png")}
                    style={{ width: 14, height: 14 }}
                  />
                  <Text style={styles.detailText}>
                    {item?.participant_count}/{item?.participant_limit} •{" "}
                    {remainingSpots} spot{remainingSpots !== 1 ? "s" : ""} left
                  </Text>
                </View>

                <View style={[styles.detailRow, { marginBottom: 6 }]}>
                  <Image
                    source={
                      item?.gender_preference === "male"
                        ? require("../../../assets/images/buddy/gender.png")
                        : item?.gender_preference === "female"
                        ? require("../../../assets/images/buddy/female.png")
                        : require("../../../assets/images/buddy/gender.png")
                    }
                    style={{
                      width: 14,
                      height: item?.gender_preference === "female" ? 20 : 14,
                    }}
                  />
                  <Text style={styles.detailText}>
                    {item.gender_preference === "any"
                      ? "Any Gender"
                      : item.gender_preference === "male"
                      ? "Males Only"
                      : "Females Only"}
                  </Text>
                </View>

                <View style={[styles.detailRow, { marginBottom: 0 }]}>
                  <Image
                    source={require("../../../assets/images/buddy/calendar.png")}
                    style={{ width: 14, height: 14 }}
                  />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {muscleGroupsText}
                  </Text>
                </View>
              </View>
              <SessionImageCarousel
                workoutImages={item.workout_images || []}
                workoutTypes={item.workout_type || []}
                containerWidth={120}
                containerHeight={130}
              />
            </View>
          </View>

          <View style={styles.participantsRow}>
            <Text style={styles.participantsLabel}>Participants:</Text>
            <View style={styles.participantsIcons}>
              {item?.participants?.length === 0 && (
                <View>
                  <Text style={styles.moreParticipantsText}>None</Text>
                </View>
              )}

              {item?.participants?.slice(0, 3).map((participant, index) => (
                <View
                  key={participant.participant_id}
                  style={[
                    styles.participantIcon,
                    { marginLeft: index > 0 ? -10 : 0 },
                  ]}
                >
                  {participant?.participant_profile ? (
                    <Image
                      source={{ uri: participant.participant_profile }}
                      style={{
                        width: responsiveWidth(7),
                        height: responsiveWidth(7),
                        borderRadius: responsiveWidth(5),
                        marginRight: responsiveWidth(0),
                      }}
                    />
                  ) : (
                    generateAvatar(participant.participant_name)
                  )}
                </View>
              ))}
              {item?.participants?.length > 3 && (
                <View style={styles.moreParticipants}>
                  <Text style={styles.moreParticipantsText}>
                    +{item.participants.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {isMySession && item?.requests?.length > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>
                {item.requests.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return <SkeletonHome type="buddy" header={false} />;
  }

  return (
    <View style={[styles.container]}>
      <FlatList
        data={filteredSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.session_id}
        contentContainerStyle={[
          styles.sessionsList,
          { paddingTop: headerHeight + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No sessions found</Text>
            {filter !== "joined" && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleCreateSession}
              >
                <Text style={styles.emptyStateButtonText}>
                  Create a Session
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, filter === "upcoming" && styles.activeTab]}
              onPress={() => {
                setFilter("upcoming");
                filterSessions(sessions, "upcoming");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === "upcoming" && styles.activeTabText,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, filter === "my-sessions" && styles.activeTab]}
              onPress={() => {
                setFilter("my-sessions");
                filterSessions(sessions, "my-sessions");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === "my-sessions" && styles.activeTabText,
                ]}
              >
                My Sessions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, filter === "joined" && styles.activeTab]}
              onPress={() => {
                setFilter("joined");
                filterSessions(sessions, "joined");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === "joined" && styles.activeTabText,
                ]}
              >
                Joined
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Animated.View
        style={[
          styles.createButtonContainer,
          { transform: [{ scale: createButtonScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateSession}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetSession}
      >
        <TouchableWithoutFeedback onPress={resetSession}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalContent,
                  { paddingBottom: insets.bottom + 10 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create Gym Session</Text>
                  <TouchableOpacity onPress={resetSession}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.formInput}
                      onPress={() => {
                        setTempDate(newSession.date || new Date());
                        setShowDatePicker(true);
                      }}
                    >
                      <Text
                        style={
                          !newSession.date
                            ? styles.placeholderText
                            : styles.selectedText
                        }
                      >
                        {newSession.date
                          ? newSession.date.toLocaleDateString()
                          : "Select Date"}
                      </Text>
                    </TouchableOpacity>
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
                                <Text style={styles.pickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.pickerTitle}>
                                Select Date
                              </Text>
                              <TouchableOpacity onPress={confirmDateSelection}>
                                <Text style={styles.pickerConfirmText}>
                                  Done
                                </Text>
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
                        value={newSession.date || new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Time</Text>
                    <TouchableOpacity
                      style={styles.formInput}
                      onPress={() => {
                        setTempTime(newSession.time || new Date());
                        setShowTimePicker(true);
                      }}
                    >
                      <Text
                        style={
                          !newSession.time
                            ? styles.placeholderText
                            : styles.selectedText
                        }
                      >
                        {newSession.time
                          ? newSession.time.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Select Time"}
                      </Text>
                    </TouchableOpacity>

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
                                <Text style={styles.pickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.pickerTitle}>
                                Select Time
                              </Text>
                              <TouchableOpacity onPress={confirmTimeSelection}>
                                <Text style={styles.pickerConfirmText}>
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={tempTime}
                              mode="time"
                              display="spinner"
                              themeVariant="light"
                              textColor="#000000"
                              onChange={handleTimeChange}
                              is24Hour={false}
                              style={styles.iosPickerStyle}
                            />
                          </View>
                        </View>
                      </Modal>
                    )}

                    {Platform.OS === "android" && showTimePicker && (
                      <DateTimePicker
                        value={newSession.time || new Date()}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                        is24Hour={false}
                      />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Max Participants</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() =>
                          setNewSession({
                            ...newSession,
                            maxParticipants: Math.max(
                              2,
                              newSession.maxParticipants - 1
                            ),
                          })
                        }
                      >
                        <Ionicons name="remove" size={20} color="#FF5757" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>
                        {newSession.maxParticipants}
                      </Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() =>
                          setNewSession({
                            ...newSession,
                            maxParticipants: Math.min(
                              10,
                              newSession.maxParticipants + 1
                            ),
                          })
                        }
                      >
                        <Ionicons name="add" size={20} color="#FF5757" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Preferred Gender</Text>
                    <View style={styles.genderOptions}>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          newSession.preferredGender === "male" &&
                            styles.genderOptionSelected,
                        ]}
                        onPress={() =>
                          setNewSession({
                            ...newSession,
                            preferredGender: "male",
                          })
                        }
                      >
                        <MaterialIcons
                          name="male"
                          size={18}
                          color={
                            newSession.preferredGender === "male"
                              ? "#FFF"
                              : "#333"
                          }
                        />
                        <Text
                          style={[
                            styles.genderOptionText,
                            newSession.preferredGender === "male" &&
                              styles.genderOptionTextSelected,
                          ]}
                        >
                          Male
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          newSession.preferredGender === "female" &&
                            styles.genderOptionSelected,
                        ]}
                        onPress={() =>
                          setNewSession({
                            ...newSession,
                            preferredGender: "female",
                          })
                        }
                      >
                        <MaterialIcons
                          name="female"
                          size={18}
                          color={
                            newSession.preferredGender === "female"
                              ? "#FFF"
                              : "#333"
                          }
                        />
                        <Text
                          style={[
                            styles.genderOptionText,
                            newSession.preferredGender === "female" &&
                              styles.genderOptionTextSelected,
                          ]}
                        >
                          Female
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          newSession.preferredGender === "any" &&
                            styles.genderOptionSelected,
                        ]}
                        onPress={() =>
                          setNewSession({
                            ...newSession,
                            preferredGender: "any",
                          })
                        }
                      >
                        <MaterialIcons
                          name="people"
                          size={18}
                          color={
                            newSession.preferredGender === "any"
                              ? "#FFF"
                              : "#333"
                          }
                        />
                        <Text
                          style={[
                            styles.genderOptionText,
                            newSession.preferredGender === "any" &&
                              styles.genderOptionTextSelected,
                          ]}
                        >
                          Any
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      Muscle Groups (Select Multiple)
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.muscleGroupsContainer}
                    >
                      {[
                        "Chest",
                        "Shoulder",
                        "Leg",
                        "Back",
                        "ABS",
                        "Biceps",
                        "Cardio",
                        "Core",
                        "Cycling",
                        "Forearms",
                        "Treadmill",
                        "Triceps",
                      ].map((muscle) => (
                        <TouchableOpacity
                          key={muscle}
                          style={[
                            styles.muscleGroupOption,
                            newSession.muscleGroups?.includes(muscle) &&
                              styles.muscleGroupOptionSelected,
                          ]}
                          onPress={() => toggleMuscleGroup(muscle)}
                        >
                          <Text
                            style={[
                              styles.muscleGroupOptionText,
                              newSession.muscleGroups?.includes(muscle) &&
                                styles.muscleGroupOptionTextSelected,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {muscle}
                          </Text>
                          {newSession.muscleGroups?.includes(muscle) && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#FFF"
                              style={{ marginLeft: 5 }}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {newSession.muscleGroups &&
                      newSession.muscleGroups.length > 0 && (
                        <View style={styles.selectedMuscleGroups}>
                          <Text style={styles.selectedLabel}>
                            Selected: {newSession.muscleGroups.join(", ")}
                          </Text>
                        </View>
                      )}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveNewSession}
                >
                  <Text style={styles.saveButtonText}>Create Session</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        {selectedSession && (
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { paddingBottom: insets.bottom + 10 },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedSession.host_id == currentUserId
                    ? "My Session"
                    : `${selectedSession.host_name}'s Session`}
                </Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.sessionDetailCard}>
                  <View style={styles.detailRow}>
                    <Image
                      source={require("../../../assets/images/buddy/calendar.png")}
                      style={{ width: 14, height: 14 }}
                    />
                    <Text style={styles.detailTextLarge}>
                      {new Date(
                        selectedSession.session_date
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Image
                      source={require("../../../assets/images/buddy/clock.png")}
                      style={{ width: 14, height: 16 }}
                    />
                    <Text style={styles.detailTextLarge}>
                      {selectedSession.session_time}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Image
                      source={require("../../../assets/images/buddy/calendar.png")}
                      style={{ width: 14, height: 14 }}
                    />
                    <Text style={styles.detailTextLarge}>
                      {Array.isArray(selectedSession.workout_type)
                        ? selectedSession.workout_type.join(" • ") + " Workout"
                        : selectedSession.workout_type + " Workout"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Image
                      source={
                        selectedSession.gender_preference === "male"
                          ? require("../../../assets/images/buddy/gender.png")
                          : selectedSession.gender_preference === "female"
                          ? require("../../../assets/images/buddy/female.png")
                          : require("../../../assets/images/buddy/gender.png")
                      }
                      style={{
                        width: 14,
                        height:
                          selectedSession.gender_preference === "female"
                            ? 20
                            : 14,
                      }}
                    />
                    <Text style={styles.detailTextLarge}>
                      {selectedSession.gender_preference === "any"
                        ? "Any Gender Welcome"
                        : selectedSession.gender_preference === "male"
                        ? "Males Only"
                        : "Females Only"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Image
                      source={require("../../../assets/images/buddy/calendar.png")}
                      style={{ width: 14, height: 14 }}
                    />
                    <Text style={styles.detailTextLarge}>
                      {selectedSession.participant_count}/
                      {selectedSession.participant_limit} Participants
                    </Text>
                  </View>
                </View>
                {/* 
                    {selectedSession.workout_images &&
                      selectedSession.workout_images.length > 0 && (
                        <View style={styles.sectionContainer}>
                          <Text style={styles.sectionTitle}>
                            Workout Preview
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.workoutImagesContainer}
                          >
                            {selectedSession.workout_images.map(
                              (imageUrl, index) => (
                                <Image
                                  key={index}
                                  source={{ uri: imageUrl }}
                                  style={styles.workoutPreviewImage}
                                  contentFit="cover"
                                />
                              )
                            )}
                          </ScrollView>
                        </View>
                      )} */}

                <View style={styles.sectionContainer}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={styles.sectionTitle}>Participants</Text>
                    {selectedSession.host_id == currentUserId &&
                      selectedSession?.participants?.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedParticipants([]);
                            setRemoveParticipantsModalVisible(true);
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: "#FF5757",
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFF",
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                  {selectedSession?.participants?.length === 0 && (
                    <Text style={styles.participantName}>
                      No Participants yet.
                    </Text>
                  )}
                  {selectedSession.participants.map((participant) => (
                    <View
                      key={participant.participant_id}
                      style={styles.participantRow}
                    >
                      <View style={styles.participantInfo}>
                        <View
                          style={[
                            styles.participantAvatar,
                            {
                              backgroundColor:
                                participant.gender.toLowerCase() === "male"
                                  ? "#3498db"
                                  : "#e84393",
                            },
                          ]}
                        >
                          {participant?.participant_profile ? (
                            <Image
                              source={{
                                uri: participant?.participant_profile,
                              }}
                              style={{
                                width: responsiveWidth(7),
                                height: responsiveWidth(7),
                                borderRadius: responsiveWidth(5),
                                marginRight: responsiveWidth(0),
                              }}
                            />
                          ) : (
                            generateAvatar(participant?.participant_name)
                          )}
                        </View>
                        <Text style={styles.participantName}>
                          {currentUserId == participant.user_id
                            ? "You"
                            : participant.participant_name.length > 18
                            ? participant.participant_name.substring(0, 18) +
                              "..."
                            : participant.participant_name}
                        </Text>
                      </View>
                      <Text style={styles.participantTime}>
                        {participant.proposed_time}
                      </Text>
                    </View>
                  ))}
                </View>

                {selectedSession.host_id == currentUserId && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Join Requests</Text>
                    {selectedSession.requests.length === 0 && (
                      <Text style={styles.participantName}>
                        No Requests yet.
                      </Text>
                    )}
                    {selectedSession.requests.map((request) => (
                      <View key={request.proposal_id} style={styles.requestRow}>
                        <View style={styles.participantInfo}>
                          <View
                            style={[
                              styles.participantAvatar,
                              {
                                backgroundColor:
                                  request.gender === "male"
                                    ? "#000000"
                                    : "#000000",
                              },
                            ]}
                          >
                            {request?.proposer_profile ? (
                              <Image
                                source={{ uri: request?.proposer_profile }}
                                style={{
                                  width: responsiveWidth(7),
                                  height: responsiveWidth(7),
                                  borderRadius: responsiveWidth(5),
                                  marginRight: responsiveWidth(0),
                                }}
                              />
                            ) : (
                              generateAvatar(request?.proposer_name)
                            )}
                          </View>
                          <View>
                            <Text style={styles.participantName}>
                              {request.proposer_name.length > 15
                                ? request.proposer_name.substring(0, 15) + "..."
                                : request.proposer_name}
                            </Text>
                            <Text style={styles.participantTime}>
                              Preferred: {request.proposal_time}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() =>
                              handleAcceptRequest(
                                selectedSession.session_id,
                                request.proposal_id
                              )
                            }
                          >
                            <Ionicons name="checkmark" size={18} color="#FFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() =>
                              handleRejectRequest(
                                selectedSession.session_id,
                                request.proposal_id,
                                request.proposer_id
                              )
                            }
                          >
                            <Ionicons name="close" size={18} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <View>
                  {(selectedSession.host_id == currentUserId ||
                    selectedSession.participants.some(
                      (p) => p.user_id == currentUserId
                    )) && (
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => {
                        setDetailModalVisible(false);
                        router.push({
                          pathname: "/client/sessionchat",
                          params: {
                            sessionId: selectedSession.session_id.toString(),
                            sessionName:
                              selectedSession.host_id == currentUserId
                                ? "My Session"
                                : `${
                                    selectedSession.host_name?.split(" ")[0]
                                  }'s Session`,
                            host_id: selectedSession.host_id.toString(),
                            selectedSession: JSON.stringify(selectedSession),
                          },
                        });
                      }}
                    >
                      <View style={styles.chatButtonContent}>
                        <Ionicons
                          name="chatbubbles"
                          size={28}
                          color="#FFFFFF"
                        />
                        <Text style={styles.chatButtonText}>Session Chat</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedSession.host_id == currentUserId && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.rescheduleButton}
                        onPress={handleOpenRescheduleModal}
                      >
                        <Text style={styles.rescheduleButtonText}>
                          Reschedule Session
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            "Delete Session",
                            "Are you sure you want to delete this session?",
                            [
                              {
                                text: "Cancel",
                                style: "cancel",
                              },
                              {
                                text: "Yes",
                                onPress: () =>
                                  handleDeleteSession(
                                    selectedSession?.session_id
                                  ),
                              },
                            ],
                            { cancelable: false }
                          );
                        }}
                      >
                        <Text style={styles.deleteButtonText}>
                          Delete Session
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {selectedSession.host_id != currentUserId &&
                  !selectedSession.participants.some(
                    (p) => p.user_id == currentUserId
                  ) &&
                  !selectedSession.requests.some(
                    (r) => r.proposer_id == currentUserId
                  ) && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Join This Session</Text>
                      <Text style={styles.joinText}>
                        Specify your preferred workout time:
                      </Text>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Time</Text>
                        <TouchableOpacity
                          style={styles.formInput}
                          onPress={() => {
                            setTempTimeJoin(newSessionJoin.time || new Date());
                            setShowTimePickerJoin(true);
                          }}
                        >
                          <Text>{formattedTime}</Text>
                        </TouchableOpacity>

                        {Platform.OS === "ios" && showTimePickerJoin && (
                          <Modal
                            transparent={true}
                            animationType="slide"
                            visible={showTimePickerJoin}
                            onRequestClose={cancelTimeJoinSelection}
                          >
                            <View style={styles.pickerModalContainer}>
                              <View style={styles.pickerContainer}>
                                <View style={styles.pickerHeader}>
                                  <TouchableOpacity
                                    onPress={cancelTimeJoinSelection}
                                  >
                                    <Text style={styles.pickerCancelText}>
                                      Cancel
                                    </Text>
                                  </TouchableOpacity>
                                  <Text style={styles.pickerTitle}>
                                    Select Time
                                  </Text>
                                  <TouchableOpacity
                                    onPress={confirmTimeJoinSelection}
                                  >
                                    <Text style={styles.pickerConfirmText}>
                                      Done
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                  value={tempTimeJoin}
                                  mode="time"
                                  display="spinner"
                                  themeVariant="light"
                                  textColor="#000000"
                                  onChange={handleTimeChangeJoin}
                                  is24Hour={true}
                                  style={styles.iosPickerStyle}
                                />
                              </View>
                            </View>
                          </Modal>
                        )}

                        {Platform.OS === "android" && showTimePickerJoin && (
                          <DateTimePicker
                            value={newSessionJoin.time}
                            mode="time"
                            display="default"
                            is24Hour={true}
                            onChange={handleTimeChangeJoin}
                          />
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleRequestJoin}
                      >
                        <Text style={styles.joinButtonText}>
                          Request to Join
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                {selectedSession.host_id != currentUserId &&
                  selectedSession.requests.some(
                    (r) => r.proposer_id == currentUserId
                  ) && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.pendingContainer}>
                        <Ionicons
                          name="time-outline"
                          size={24}
                          color="#FF5757"
                        />
                        <Text style={styles.pendingText}>
                          Join request pending approval
                        </Text>
                      </View>
                    </View>
                  )}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </Modal>

      <Modal
        visible={isRescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetRescheduleSession}
      >
        <TouchableWithoutFeedback onPress={resetRescheduleSession}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalContent,
                  { paddingBottom: insets.bottom + 10 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reschedule Session</Text>
                  <TouchableOpacity onPress={resetRescheduleSession}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.formInput}
                      onPress={() => {
                        setTempDateReschedule(
                          rescheduleSession.date || new Date()
                        );
                        setShowDatePickerReschedule(true);
                      }}
                    >
                      <Text
                        style={
                          !rescheduleSession.date
                            ? styles.placeholderText
                            : styles.selectedText
                        }
                      >
                        {rescheduleSession.date
                          ? rescheduleSession.date.toLocaleDateString()
                          : "Select Date"}
                      </Text>
                    </TouchableOpacity>
                    {Platform.OS === "ios" && showDatePickerReschedule && (
                      <Modal
                        transparent={true}
                        animationType="slide"
                        visible={showDatePickerReschedule}
                        onRequestClose={cancelDateRescheduleSelection}
                      >
                        <View style={styles.pickerModalContainer}>
                          <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                              <TouchableOpacity
                                onPress={cancelDateRescheduleSelection}
                              >
                                <Text style={styles.pickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.pickerTitle}>
                                Select Date
                              </Text>
                              <TouchableOpacity
                                onPress={confirmDateRescheduleSelection}
                              >
                                <Text style={styles.pickerConfirmText}>
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={tempDateReschedule}
                              mode="date"
                              display="spinner"
                              themeVariant="light"
                              textColor="#000000"
                              onChange={handleDateChangeReschedule}
                              minimumDate={new Date()}
                              style={styles.iosPickerStyle}
                            />
                          </View>
                        </View>
                      </Modal>
                    )}

                    {Platform.OS === "android" && showDatePickerReschedule && (
                      <DateTimePicker
                        value={rescheduleSession.date || new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChangeReschedule}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Time</Text>
                    <TouchableOpacity
                      style={styles.formInput}
                      onPress={() => {
                        setTempTimeReschedule(
                          rescheduleSession.time || new Date()
                        );
                        setShowTimePickerReschedule(true);
                      }}
                    >
                      <Text
                        style={
                          !rescheduleSession.time
                            ? styles.placeholderText
                            : styles.selectedText
                        }
                      >
                        {rescheduleSession.time
                          ? rescheduleSession.time.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Select Time"}
                      </Text>
                    </TouchableOpacity>

                    {Platform.OS === "ios" && showTimePickerReschedule && (
                      <Modal
                        transparent={true}
                        animationType="slide"
                        visible={showTimePickerReschedule}
                        onRequestClose={cancelTimeRescheduleSelection}
                      >
                        <View style={styles.pickerModalContainer}>
                          <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                              <TouchableOpacity
                                onPress={cancelTimeRescheduleSelection}
                              >
                                <Text style={styles.pickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.pickerTitle}>
                                Select Time
                              </Text>
                              <TouchableOpacity
                                onPress={confirmTimeRescheduleSelection}
                              >
                                <Text style={styles.pickerConfirmText}>
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={tempTimeReschedule}
                              mode="time"
                              display="spinner"
                              themeVariant="light"
                              textColor="#000000"
                              onChange={handleTimeChangeReschedule}
                              is24Hour={false}
                              style={styles.iosPickerStyle}
                            />
                          </View>
                        </View>
                      </Modal>
                    )}

                    {Platform.OS === "android" && showTimePickerReschedule && (
                      <DateTimePicker
                        value={rescheduleSession.time || new Date()}
                        mode="time"
                        display="default"
                        onChange={handleTimeChangeReschedule}
                        is24Hour={false}
                      />
                    )}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleRescheduleSession}
                >
                  <Text style={styles.saveButtonText}>Reschedule Session</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={isRemoveParticipantsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setRemoveParticipantsModalVisible(false);
          setSelectedParticipants([]);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setRemoveParticipantsModalVisible(false);
            setSelectedParticipants([]);
          }}
        >
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalContent,
                  { paddingBottom: insets.bottom + 10 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Remove Participants</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setRemoveParticipantsModalVisible(false);
                      setSelectedParticipants([]);
                    }}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  <Text style={styles.formLabel}>
                    Select participants to remove:
                  </Text>
                  {selectedSession?.participants
                    ?.filter((p) => p.user_id !== currentUserId)
                    .map((participant) => (
                      <TouchableOpacity
                        key={participant.user_id}
                        style={styles.checkboxRow}
                        onPress={() =>
                          toggleParticipantSelection(participant.user_id)
                        }
                      >
                        <View style={styles.checkboxContainer}>
                          <View
                            style={[
                              styles.checkbox,
                              selectedParticipants.includes(
                                participant.user_id
                              ) && styles.checkboxSelected,
                            ]}
                          >
                            {selectedParticipants.includes(
                              participant.user_id
                            ) && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#FFF"
                              />
                            )}
                          </View>
                          <View style={styles.participantInfo}>
                            <View
                              style={[
                                styles.participantAvatar,
                                {
                                  backgroundColor:
                                    participant.gender.toLowerCase() === "male"
                                      ? "#3498db"
                                      : "#e84393",
                                },
                              ]}
                            >
                              {participant?.participant_profile ? (
                                <Image
                                  source={{
                                    uri: participant?.participant_profile,
                                  }}
                                  style={{
                                    width: responsiveWidth(7),
                                    height: responsiveWidth(7),
                                    borderRadius: responsiveWidth(5),
                                  }}
                                />
                              ) : (
                                <Text style={{ color: "#FFF", fontSize: 12 }}>
                                  {participant.participant_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <Text style={styles.participantName}>
                              {participant.participant_name}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    selectedParticipants.length === 0 && {
                      backgroundColor: "#ccc",
                    },
                  ]}
                  onPress={handleRemoveParticipants}
                  disabled={selectedParticipants.length === 0}
                >
                  <Text style={styles.saveButtonText}>
                    Remove Selected ({selectedParticipants.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 30,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterScrollView: {
    paddingVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: "#FF5757",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
  },
  filterTextActive: {
    color: "#FFF",
    fontWeight: "500",
  },
  sessionsList: {
    paddingBottom: 100,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sessionCardInner: {
    padding: 15,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    // marginTop: 10,
  },
  muscleGroupTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEAEA",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  muscleGroupText: {
    color: "#FF5757",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  hostName: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
  sessionDetails: {
    marginBottom: 7,
    // marginLeft: 5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 8,
  },
  detailTextLarge: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
    marginTop: 5,
  },
  participantsLabel: {
    fontSize: 14,
    color: "#666",
  },
  participantsIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF5757",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  moreParticipants: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    marginLeft: -10,
  },
  moreParticipantsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  mySessionTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#3498db",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
  },
  rejectedProposalTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
  },
  requestedProposalTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FFC300",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
  },
  acceptedProposalTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "green",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
  },
  mySessionTagText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  requestsBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  requestsBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  createButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 70 : 20,
    right: 20,
  },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF5757",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  modalScrollView: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 8,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  genderOptionSelected: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
  },
  genderOptionText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 5,
  },
  genderOptionTextSelected: {
    color: "#FFF",
  },
  muscleGroupsContainer: {
    flexDirection: "row",
  },
  muscleGroupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    marginRight: 10,
  },
  muscleGroupOptionSelected: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
  },
  muscleGroupOptionText: {
    fontSize: 12,
    color: "#333",
    letterSpacing: 0.5,
  },
  muscleGroupOptionTextSelected: {
    color: "#FFF",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  sessionDetailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantAvatar: {
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  participantName: {
    fontSize: 12,
    color: "#333",
  },
  participantTime: {
    fontSize: 12,
    color: "#666",
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  requestActions: {
    flexDirection: "row",
  },
  acceptButton: {
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: "#2ecc71",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  rejectButton: {
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  joinText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  joinButton: {
    backgroundColor: "#FF5757",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 10,
    borderColor: "#aaa",
    borderWidth: 1,
  },
  deleteButtonText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "bold",
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderColor: "#aaa",
    borderWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  rescheduleButtonText: {
    color: "#4a4848ff",
    fontSize: 14,
    fontWeight: "500",
  },
  joinButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  pendingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEAEA",
    padding: 15,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 16,
    color: "#FF5757",
    marginLeft: 10,
    fontWeight: "500",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: "#FF5757",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emptyStateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  chatButton: {
    backgroundColor: "#FF5757",
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  chatButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 15,
    marginTop: 10,
    gap: 10,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeTab: {
    backgroundColor: "#FF5757",
  },
  tabText: {
    fontSize: 12,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // iOS Picker Modal Styles
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
  workoutImagesContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  workoutPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
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
    color: "#FF5757",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  placeholderText: {
    color: "#999",
    fontSize: 16,
  },
  selectedText: {
    color: "#333",
    fontSize: 16,
  },
  selectedMuscleGroups: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF5757",
  },
  selectedLabel: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  muscleGroupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 60,
  },
  muscleGroupOptionSelected: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
  },
  muscleGroupOptionText: {
    fontSize: 12,
    color: "#333",
    letterSpacing: 0.5,
  },
  muscleGroupOptionTextSelected: {
    color: "#FFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#DDD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  checkboxSelected: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
  },
});
