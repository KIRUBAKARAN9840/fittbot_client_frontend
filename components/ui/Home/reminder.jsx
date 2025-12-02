import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createReminderAPI,
  deleteRemindersAPI,
  getRemindersAPI,
} from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import ReminderCard from "../RemainderCard";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import {
  safeScrollToIndex,
  safeGetItemLayout,
} from "../../../utils/safeHelpers";
import SkeletonHome from "./skeletonHome";
import { useUser } from "../../../context/UserContext";
import {
  isFittbotPremium,
  isGymPremium,
  isPurePremium,
} from "../../../config/access";

const { width, height } = Dimensions.get("window");

const isTablet = () => {
  const aspectRatio = height / width;
  return width >= 768 || (width >= 600 && aspectRatio < 1.6);
};

const deviceIsTablet = isTablet();

const FloatingActionButton = ({ icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={1}>
      <Ionicons name={icon} size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const reminderPic = [
  {
    url: require("../../../assets/images/reminders/water_reminder.png"),
    type: "water",
  },
  {
    url: require("../../../assets/images/reminders/workout_reminder.png"),
    type: "workout",
  },
  {
    url: require("../../../assets/images/reminders/diet_reminder.png"),
    type: "diet",
  },
  {
    url: require("../../../assets/images/reminders/meeting_reminder.png"),
    type: "meeting",
  },
];

const ChatModal = ({ visible, onClose, onAdd, initialReminderType = null }) => {
  const insets = useSafeAreaInsets();
  const [chatMessages, setChatMessages] = useState([]);
  const [reminderType, setReminderType] = useState("");
  const [reminderDetails, setReminderDetails] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [gymCount, setGymCount] = useState("");
  const [waterAmount, setWaterAmount] = useState("");
  const [waterInterval, setWaterInterval] = useState("");
  const [dietType, setDietType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notificationType, setNotificationType] = useState("push");
  const [currentStep, setCurrentStep] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("AM");
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const [timeError, setTimeError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const scrollViewRef = useRef(null);

  const { plan } = useUser();

  const getInitialMessage = (type) => {
    switch (type) {
      case "water":
        return "How much water would you like to drink each time?";
      case "diet":
        return "What type of meal would you like to be reminded about?";
      case "gym":
        return "Below what number of people in the gym would you like to be notified?";
      case "workout":
        return "Please enter a description for this workout reminder";
      case "meeting":
        return "Please enter a description for this meeting reminder";
      case "others":
        return "What would you like to title this reminder?";
      default:
        return "What type of reminder would you like to set?";
    }
  };

  const initializeChat = () => {
    if (initialReminderType) {
      setReminderType(initialReminderType);
      setCurrentStep(1);
      setChatMessages([
        {
          id: 1,
          text: `You selected ${initialReminderType} reminder`,
          isAI: false,
        },
        {
          id: 2,
          text: getInitialMessage(initialReminderType),
          isAI: true,
        },
      ]);
    } else {
      setCurrentStep(0);
      setChatMessages([
        {
          id: 1,
          text: "What type of reminder would you like to set?",
          isAI: true,
        },
      ]);
    }
  };

  useEffect(() => {
    if (visible) {
      initializeChat();
    }
  }, [visible, initialReminderType]);

  const formatToSQLDateTime = (date, timeString) => {
    if (!date || !timeString) return null;

    let dateString;
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      dateString = `${year}-${month}-${day}`;
    } else {
      dateString = date;
    }

    const [hours, minutes] = timeString.split(":");

    return `${dateString} ${hours.padStart(2, "0")}:${minutes.padStart(
      2,
      "0"
    )}:00`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const day = tomorrow.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages]);

  const resetForm = () => {
    setReminderType("");
    setReminderDetails("");
    setReminderTime("");
    setReminderTitle("");
    setGymCount("");
    setWaterAmount("");
    setWaterInterval("");
    setDietType("");
    setStartTime("");
    setEndTime("");
    setFrequency("");
    setNotificationType("push");
    setTimeError("");
    setSelectedAmPm("AM");
    setSelectedDate(null);
    setShowDatePicker(false);
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
    initializeChat();
  };

  const addMessage = (text, isAI = true) => {
    const newMessage = {
      id: Date.now(),
      text,
      isAI,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const convert24To12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const convert12To24Hour = (hour, minute, ampm) => {
    let hour24 = parseInt(hour, 10);

    if (ampm === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  };

  const isTimePast = (timeString) => {
    if (!timeString) return false;

    const now = new Date();
    const [hours, minutes] = timeString.split(":");
    const selectedDate = new Date();
    selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return selectedDate < now;
  };

  const handleSubmit = () => {
    let title = "";
    let details = "";
    let othersTime = null;
    let finalReminderMode = reminderType;
    let isRecurring = frequency === "daily";

    if (reminderType === "water") {
      title = "Water Reminder";
      details = `Drink ${waterAmount}ml of water every ${waterInterval} hours between ${convert24To12Hour(
        startTime
      )} and ${convert24To12Hour(endTime)}`;
    } else if (reminderType === "diet") {
      title = `${dietType} Meal Reminder`;
      details = reminderDetails || `Time for your ${dietType.toLowerCase()}`;
    } else if (reminderType === "gym") {
      title = "Gym Crowd Alert";
      details = `Alert when less than ${gymCount} people are in the gym between ${convert24To12Hour(
        startTime
      )} and ${convert24To12Hour(endTime)}`;
    } else if (reminderType === "workout") {
      title = "Workout Reminder";
      details = reminderDetails || "Time for your workout session";
      finalReminderMode = "others";

      if (frequency === "custom_date" && selectedDate) {
        othersTime = formatToSQLDateTime(selectedDate, reminderTime);
      } else if (frequency === "daily") {
        const tomorrowDate = getTomorrowDate();
        othersTime = formatToSQLDateTime(tomorrowDate, reminderTime);
      }
    } else if (reminderType === "meeting") {
      title = "Meeting Reminder";
      details = reminderDetails || "Time for your meeting";
      finalReminderMode = "others";

      if (frequency === "custom_date" && selectedDate) {
        othersTime = formatToSQLDateTime(selectedDate, reminderTime);
      } else if (frequency === "daily") {
        const tomorrowDate = getTomorrowDate();
        othersTime = formatToSQLDateTime(tomorrowDate, reminderTime);
      }
    } else if (reminderType === "others") {
      title = reminderTitle;
      details = reminderDetails || "Custom reminder";

      if (frequency === "custom_date" && selectedDate) {
        othersTime = formatToSQLDateTime(selectedDate, reminderTime);
      } else if (frequency === "daily") {
        const tomorrowDate = getTomorrowDate();
        othersTime = formatToSQLDateTime(tomorrowDate, reminderTime);
      }
    }

    onAdd({
      reminder_mode: finalReminderMode,
      title: title,
      details: details,
      intimation_start_time:
        reminderType === "water" || reminderType === "gym" ? startTime : null,
      intimation_end_time:
        reminderType === "water" || reminderType === "gym" ? endTime : null,
      reminder_time:
        reminderType === "diet" ||
        reminderType === "others" ||
        reminderType === "workout" ||
        reminderType === "meeting"
          ? reminderTime
          : null,
      is_recurring: frequency,
      reminder_type: notificationType ? notificationType : "push",
      gym_count: reminderType === "gym" ? gymCount : null,
      diet_type: reminderType === "diet" ? dietType : null,
      water_timing: reminderType === "water" ? waterInterval : null,
      water_amount: reminderType === "water" ? waterAmount : null,
      others_time: othersTime,
    });

    resetForm();
    onClose();
  };

  const moveToNextStep = (userResponse, nextAIQuestion) => {
    if (isProcessingSelection) return;

    setIsProcessingSelection(true);

    if (userResponse) {
      addMessage(userResponse, false);
    }

    if (nextAIQuestion) {
      setTimeout(() => {
        addMessage(nextAIQuestion, true);
        setCurrentStep((prev) => prev + 1);
        setIsProcessingSelection(false);
      }, 500);
    } else {
      setIsProcessingSelection(false);
    }
  };

  const renderTypeSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("water");
            moveToNextStep(
              "Water reminder",
              "How much water would you like to drink each time?"
            );
          }}
        >
          <Ionicons name="water" size={24} color="#2196F3" />
          <Text style={styles.optionText}>Water</Text>
        </TouchableOpacity>
        {isPurePremium(plan) && (
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              setReminderType("diet");
              moveToNextStep(
                "Diet reminder",
                "What type of meal would you like to be reminded about?"
              );
            }}
          >
            <Ionicons name="nutrition" size={24} color="#4CAF50" />
            <Text style={styles.optionText}>Diet</Text>
          </TouchableOpacity>
        )}
        {isGymPremium(plan) && (
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              setReminderType("gym");
              moveToNextStep(
                "Gym Crowd reminder",
                "Below what number of people in the gym would you like to be notified?"
              );
            }}
          >
            <Ionicons name="people" size={20} color="#FF9800" />
            <Text style={styles.optionText}>Gym Crowd</Text>
          </TouchableOpacity>
        )}
        {isPurePremium(plan) && (
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              setReminderType("workout");
              moveToNextStep(
                "Workout reminder",
                "Please enter a description for this workout reminder"
              );
            }}
          >
            <Ionicons name="barbell" size={24} color="#6C5CE7" />
            <Text style={styles.optionText}>Workout</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("meeting");
            moveToNextStep(
              "Meeting reminder",
              "Please enter a description for this meeting reminder"
            );
          }}
        >
          <Ionicons name="business" size={24} color="#6C5CE7" />
          <Text style={styles.optionText}>Meeting</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("others");
            moveToNextStep(
              "Other reminder",
              "What would you like to title this reminder?"
            );
          }}
        >
          <Ionicons name="calendar" size={24} color="#6C5CE7" />
          <Text style={styles.optionText}>Others</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReminderTitleInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="Enter a title for your reminder"
          placeholderTextColor="#999"
          value={reminderTitle}
          onChangeText={setReminderTitle}
        />
        <TouchableOpacity
          style={[styles.nextButton, !reminderTitle && styles.disabledButton]}
          disabled={!reminderTitle}
          onPress={() => {
            if (reminderTitle) {
              moveToNextStep(
                `Title: ${reminderTitle}`,
                "Please enter a description for this reminder"
              );
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc: "Please enter a title",
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReminderDescriptionInput = () => {
    return (
      <View>
        <TextInput
          style={[styles.textInput, { height: 100, textAlignVertical: "top" }]}
          placeholder="Enter a description (optional)"
          placeholderTextColor="#999"
          multiline={true}
          numberOfLines={4}
          value={reminderDetails}
          onChangeText={setReminderDetails}
        />
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            moveToNextStep(
              reminderDetails
                ? `Description: ${reminderDetails}`
                : "No description provided",
              "What time would you like to be reminded?"
            );
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWaterAmountInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="Amount in ml (e.g., 250)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={waterAmount}
          onChangeText={setWaterAmount}
        />
        <TouchableOpacity
          style={[styles.nextButton, !waterAmount && styles.disabledButton]}
          disabled={!waterAmount || isProcessingSelection}
          onPress={() => {
            if (waterAmount) {
              moveToNextStep(
                `${waterAmount}ml`,
                "How often would you like to be reminded to drink water?"
              );
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc: "Please enter an amount",
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDietTypeSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Breakfast");
            moveToNextStep(
              "Breakfast reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Breakfast</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Lunch");
            moveToNextStep(
              "Lunch reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Lunch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Dinner");
            moveToNextStep(
              "Dinner reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Dinner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Snack");
            moveToNextStep(
              "Snack reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Snack</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGymCountInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="Number of people (e.g., 10)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={gymCount}
          onChangeText={setGymCount}
        />
        <TouchableOpacity
          style={[styles.nextButton, !gymCount && styles.disabledButton]}
          disabled={!gymCount || isProcessingSelection}
          onPress={() => {
            if (gymCount) {
              moveToNextStep(
                `When fewer than ${gymCount} people`,
                "Between which hours would you like to be notified?"
              );
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc: "Please enter a number",
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWaterIntervalSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("0.5");
            moveToNextStep(
              "Every half an hour",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every half an hour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("1");
            moveToNextStep(
              "Every hour",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every hour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("2");
            moveToNextStep(
              "Every 2 hours",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every 2 hours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("3");
            moveToNextStep(
              "Every 3 hours",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every 3 hours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("4");
            moveToNextStep(
              "Every 4 hours",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every 4 hours</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDietDetailsInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Low carb breakfast, Protein-rich dinner"
          placeholderTextColor="#999"
          value={reminderDetails}
          onChangeText={setReminderDetails}
        />
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            moveToNextStep(
              reminderDetails
                ? `Details: ${reminderDetails}`
                : "No special details",
              "What time would you like to be reminded?"
            );
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTimeRangeSelection = () => {
    const allTimeOptions = [
      "06:00",
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00",
    ];

    const startTimeIndex = startTime ? allTimeOptions.indexOf(startTime) : -1;

    const availableEndTimes = startTime
      ? allTimeOptions.filter((_, index) => index > startTimeIndex)
      : [];

    return (
      <View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

        <Text style={styles.timeLabel}>Start Time:</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          style={styles.timeOptionsScrollView}
        >
          <View style={styles.timeOptionsContainer}>
            {allTimeOptions.map((time) => (
              <TouchableOpacity
                key={`start-${time}`}
                style={[
                  styles.timeOption,
                  startTime === time && styles.selectedTimeOption,
                ]}
                onPress={() => {
                  setStartTime(time);
                  setTimeError("");
                  if (
                    endTime &&
                    allTimeOptions.indexOf(endTime) <=
                      allTimeOptions.indexOf(time)
                  ) {
                    setEndTime("");
                  }
                }}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    startTime === time && styles.selectedTimeOptionText,
                  ]}
                >
                  {convert24To12Hour(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.timeLabel}>End Time:</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          style={styles.timeOptionsScrollView}
        >
          <View style={styles.timeOptionsContainer}>
            {availableEndTimes.map((time) => (
              <TouchableOpacity
                key={`end-${time}`}
                style={[
                  styles.timeOption,
                  endTime === time && styles.selectedTimeOption,
                ]}
                onPress={() => {
                  setEndTime(time);
                  setTimeError("");
                }}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    endTime === time && styles.selectedTimeOptionText,
                  ]}
                >
                  {convert24To12Hour(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {!startTime && (
          <Text style={styles.helperText}>
            Please select a start time first
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!startTime || !endTime) && styles.disabledButton,
          ]}
          disabled={!startTime || !endTime || isProcessingSelection}
          onPress={() => {
            if (startTime && endTime) {
              moveToNextStep(
                `Between ${convert24To12Hour(
                  startTime
                )} and ${convert24To12Hour(endTime)}`,
                "Is this reminder for today only or every day?"
              );
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSingleTimeSelection = () => {
    const updateReminderTime = () => {
      const time24 = convert12To24Hour(
        selectedHour,
        selectedMinute,
        selectedAmPm
      );
      setReminderTime(time24);
      setShowTimePicker(false);
    };

    return (
      <View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

        {!showTimePicker ? (
          <View>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => {
                setShowTimePicker(true);
                setTimeError("");
              }}
            >
              <Ionicons name="time-outline" size={20} color="#6c63ff" />
              <Text style={styles.timePickerButtonText}>
                {reminderTime
                  ? convert24To12Hour(reminderTime)
                  : "Select a time"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                !reminderTime && styles.disabledButton,
              ]}
              disabled={!reminderTime || isProcessingSelection}
              onPress={() => {
                if (reminderTime) {
                  moveToNextStep(
                    `At ${convert24To12Hour(reminderTime)}`,
                    "Is this reminder for today only or every day?"
                  );
                }
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Select Time</Text>

            <View style={styles.timePickerRow}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hour</Text>
                <ScrollView
                  style={styles.timePickerScroll}
                  contentContainerStyle={styles.timePickerScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = (i + 1).toString().padStart(2, "0");
                    return (
                      <TouchableOpacity
                        key={`hour-${hour}`}
                        style={[
                          styles.timePickerItem,
                          selectedHour === hour &&
                            styles.timePickerItemSelected,
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text
                          style={[
                            styles.timePickerItemText,
                            selectedHour === hour &&
                              styles.timePickerItemTextSelected,
                          ]}
                        >
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.timePickerSeparator}>:</Text>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minute</Text>
                <ScrollView
                  style={styles.timePickerScroll}
                  contentContainerStyle={styles.timePickerScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {[
                    "00",
                    "05",
                    "10",
                    "15",
                    "20",
                    "25",
                    "30",
                    "35",
                    "40",
                    "45",
                    "50",
                    "55",
                  ].map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timePickerItem,
                        selectedMinute === minute &&
                          styles.timePickerItemSelected,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timePickerItemText,
                          selectedMinute === minute &&
                            styles.timePickerItemTextSelected,
                        ]}
                      >
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>AM/PM</Text>
                <View style={styles.amPmContainer}>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      selectedAmPm === "AM" && styles.amPmButtonSelected,
                    ]}
                    onPress={() => setSelectedAmPm("AM")}
                  >
                    <Text
                      style={[
                        styles.amPmButtonText,
                        selectedAmPm === "AM" && styles.amPmButtonTextSelected,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      selectedAmPm === "PM" && styles.amPmButtonSelected,
                    ]}
                    onPress={() => setSelectedAmPm("PM")}
                  >
                    <Text
                      style={[
                        styles.amPmButtonText,
                        selectedAmPm === "PM" && styles.amPmButtonTextSelected,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={[styles.timePickerButton, styles.timePickerCancelButton]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.timePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timePickerButton,
                  styles.timePickerConfirmButton,
                ]}
                onPress={updateReminderTime}
              >
                <Text style={styles.timePickerConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFrequencySelection = () => {
    const handleFrequencySelection = (selectedFrequency) => {
      if (selectedFrequency === "today") {
        let timeToCheck;
        if (reminderType === "diet") {
          timeToCheck = reminderTime;
        } else {
          timeToCheck = endTime;
        }

        if (isTimePast(timeToCheck)) {
          setTimeError(
            "You've selected a time in the past. Please choose a future time or select 'Every day' instead."
          );
          return;
        }
      }

      setFrequency(selectedFrequency);
      setTimeError("");

      if (
        reminderType === "others" ||
        reminderType === "workout" ||
        reminderType === "meeting"
      ) {
        if (selectedFrequency === "custom_date") {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setSelectedDay(tomorrow.getDate().toString());
          setSelectedMonth((tomorrow.getMonth() + 1).toString());
          setSelectedYear(tomorrow.getFullYear().toString());
          setShowDatePicker(true);
          moveToNextStep(
            "Custom date",
            "Please select the date for your reminder"
          );
        } else {
          moveToNextStep("Every day", "Would you like to save this reminder?");
        }
      } else {
        moveToNextStep(
          selectedFrequency === "today" ? "Today only" : "Every day",
          "Would you like to save this reminder?"
        );
      }
    };

    return (
      <View>
        {timeError ? (
          <View>
            <Text style={styles.errorText}>{timeError}</Text>
            <TouchableOpacity
              style={[styles.backButton, { marginBottom: 10 }]}
              onPress={() => {
                setTimeError("");
                setCurrentStep(currentStep - 1);
              }}
            >
              <Text style={styles.backButtonText}>
                Go Back to Time Selection
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.optionsContainer}>
          {(reminderType === "water" ||
            reminderType === "diet" ||
            reminderType === "gym") && (
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleFrequencySelection("today")}
              disabled={isProcessingSelection}
            >
              <Ionicons name="today" size={24} color="#6c63ff" />
              <Text style={styles.optionText}>Today only</Text>
            </TouchableOpacity>
          )}

          {(reminderType === "others" ||
            reminderType === "workout" ||
            reminderType === "meeting") && (
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleFrequencySelection("custom_date")}
              disabled={isProcessingSelection}
            >
              <Ionicons name="calendar-outline" size={24} color="#6c63ff" />
              <Text style={styles.optionText}>Select Date</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleFrequencySelection("daily")}
            disabled={isProcessingSelection}
          >
            <Ionicons name="repeat" size={24} color="#6c63ff" />
            <Text style={styles.optionText}>Every day</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCustomDateSelection = () => {
    const updateSelectedDate = () => {
      if (!selectedDate) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setTimeError(
          "Selected date is in the past. Please choose today or a future date."
        );
        return;
      }

      const selectedDateTime = new Date(selectedDate);
      const [hours, minutes] = reminderTime.split(":");
      selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const now = new Date();

      if (selectedDateTime < now) {
        setTimeError(
          "Selected date and time is in the past. Please choose a future date and time."
        );
        return;
      }

      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      setSelectedDate(dateString);
      setShowDatePicker(false);
      setTimeError("");

      const formattedDate = selectedDate.toLocaleDateString();
      moveToNextStep(
        `Date: ${formattedDate}`,
        "Would you like to save this reminder?"
      );
    };

    const handleDateChange = (event, date) => {
      if (event.type === "dismissed") {
        setShowDatePicker(false);
        setCurrentStep(currentStep - 1);
        return;
      }

      if (date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
          setTimeError(
            "Selected date is in the past. Please choose today or a future date."
          );
          return;
        }

        setSelectedDate(date);
        setTimeError("");

        if (Platform.OS === "android") {
          const selectedDateTime = new Date(date);
          const [hours, minutes] = reminderTime.split(":");
          selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const now = new Date();

          if (selectedDateTime < now) {
            setTimeError(
              "Selected date and time is in the past. Please choose a future date and time."
            );
            return;
          }

          setShowDatePicker(false);
          const formattedDate = date.toLocaleDateString();
          moveToNextStep(
            `Date: ${formattedDate}`,
            "Would you like to save this reminder?"
          );
        }
      }
    };

    const getMinimumDate = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    };

    const getMaximumDate = () => {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      return maxDate;
    };

    return (
      <View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Date</Text>

            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    styles.datePickerCancelButton,
                  ]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentStep(currentStep - 1);
                  }}
                >
                  <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    styles.datePickerConfirmButton,
                    !selectedDate && styles.disabledButton,
                  ]}
                  onPress={updateSelectedDate}
                  disabled={!selectedDate}
                >
                  <Text style={styles.datePickerConfirmButtonText}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <DateTimePicker
              value={selectedDate || getMinimumDate()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="light"
              textColor="#000000"
              onChange={handleDateChange}
              minimumDate={getMinimumDate()}
              maximumDate={getMaximumDate()}
              style={styles.dateTimePicker}
            />
          </View>
        )}
      </View>
    );
  };

  const renderFinalConfirmation = () => {
    return (
      <View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Reminder</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: "#f44336", marginTop: 10 },
          ]}
          onPress={() => {
            resetForm();
            onClose();
          }}
        >
          <Text style={styles.submitButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentInput = () => {
    switch (currentStep) {
      case 0:
        return renderTypeSelection();
      case 1:
        if (reminderType === "water") {
          return renderWaterAmountInput();
        } else if (reminderType === "diet") {
          return renderDietTypeSelection();
        } else if (reminderType === "gym") {
          return renderGymCountInput();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          return renderReminderDescriptionInput();
        } else if (reminderType === "others") {
          return renderReminderTitleInput();
        }
        break;
      case 2:
        if (reminderType === "water") {
          return renderWaterIntervalSelection();
        } else if (reminderType === "diet") {
          return renderDietDetailsInput();
        } else if (reminderType === "gym") {
          return renderTimeRangeSelection();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          return renderSingleTimeSelection();
        } else if (reminderType === "others") {
          return renderReminderDescriptionInput();
        }
        break;
      case 3:
        if (reminderType === "water") {
          return renderTimeRangeSelection();
        } else if (reminderType === "diet") {
          return renderSingleTimeSelection();
        } else if (reminderType === "gym") {
          return renderFrequencySelection();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          return renderFrequencySelection();
        } else if (reminderType === "others") {
          return renderSingleTimeSelection();
        }
        break;
      case 4:
        if (reminderType === "water" || reminderType === "diet") {
          return renderFrequencySelection();
        } else if (reminderType === "gym") {
          return renderFinalConfirmation();
        } else if (reminderType === "others") {
          return renderFrequencySelection();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          if (frequency === "custom_date") {
            return renderCustomDateSelection();
          } else {
            return renderFinalConfirmation();
          }
        }
        break;
      case 5:
        if (reminderType === "water" || reminderType === "diet") {
          return renderFinalConfirmation();
        } else if (reminderType === "others") {
          if (frequency === "custom_date") {
            return renderCustomDateSelection();
          } else {
            return renderFinalConfirmation();
          }
        } else {
          return renderFinalConfirmation();
        }
        break;
      case 6:
        return renderFinalConfirmation();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={(e) => {
                e.stopPropagation();
                Keyboard.dismiss();
              }}
            >
              <View
                style={[
                  styles.modalContainer,
                  { paddingBottom: insets.bottom },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Set a New Reminder</Text>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      onClose();
                    }}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  ref={scrollViewRef}
                  style={styles.chatContainer}
                  contentContainerStyle={styles.chatContentContainer}
                >
                  {chatMessages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageContainer,
                        message.isAI
                          ? styles.aiMessageContainer
                          : styles.userMessageContainer,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          message.isAI ? styles.aiMessage : styles.userMessage,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            message.isAI
                              ? styles.aiMessageText
                              : styles.userMessageText,
                          ]}
                        >
                          {message.text}
                        </Text>
                      </View>
                      {message.isAI && (
                        <View style={styles.aiAvatar}>
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={16}
                            color="#fff"
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.inputContainer}>
                  {renderCurrentInput()}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const Reminders = ({ scrollY, onChangeTab, posters, gender }) => {
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReminderType, setSelectedReminderType] = useState(null);
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  const getReminders = async () => {
    setLoading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await getRemindersAPI(clientId);
      if (response?.status === 200) {
        setReminders(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    getReminders();
  }, []);

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const animatedStyle = {
    transform: [{ scale }],
  };

  const handleAddReminder = async (newReminder) => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const payload = {
        ...newReminder,
        client_id: clientId,
        gym_id: gymId ? gymId : null,
      };

      const response = await createReminderAPI(payload);

      if (response?.status === 200) {
        getReminders();
        showToast({
          type: "success",
          title: "Success",
          desc: "Reminder Added Successfully",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const handleDeleteReminder = (id) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await deleteRemindersAPI(id);
              if (response?.status === 200) {
                getReminders();
                showToast({
                  type: "success",
                  title: "Success",
                  desc: "Reminder deleted Successfully",
                });
              } else {
                showToast({
                  type: "error",
                  title: "Error",
                  desc:
                    response?.detail ||
                    "Something went wrong. Please try again later",
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
          },
          style: "destructive",
        },
      ]
    );
  };

  const openReminderModal = (reminderType = null) => {
    setSelectedReminderType(reminderType);
    setModalVisible(true);
  };

  const closeReminderModal = () => {
    setModalVisible(false);
    setSelectedReminderType(null);
  };

  // Carousel component for reminder types
  const ReminderCarousel = ({ data, onChangeTab, gender }) => {
    // Create infinite loop data by duplicating first and last items
    const loopData = React.useMemo(() => {
      if (!data || data.length <= 1) return data || [];
      return [data[data.length - 1], ...data, data[0]];
    }, [data]);

    const [activeIndex, setActiveIndex] = useState(1); // Start at index 1 (real first item)
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(width)).current; // Start at first real item
    const screenWidth = width;
    const isScrolling = useRef(false);
    const autoScrollTimer = useRef(null);
    const transitionTimers = useRef([]);

    // Auto-play functionality
    useEffect(() => {
      if (!data || data.length <= 1) return;

      autoScrollTimer.current = setInterval(() => {
        if (!isScrolling.current && flatListRef.current) {
          const nextIndex = activeIndex + 1;
          if (nextIndex < loopData.length) {
            try {
              flatListRef.current.scrollToIndex({
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
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
        }
      };
    }, [activeIndex, data, loopData.length]);

    // Handle infinite loop transitions
    useEffect(() => {
      if (!data || data.length <= 1 || loopData.length <= 1) return;

      const listener = scrollX.addListener(({ value }) => {
        const index = Math.round(value / screenWidth);

        // If we're at the last duplicate (first real item copy)
        if (index === loopData.length - 1 && !isScrolling.current) {
          const timer = setTimeout(() => {
            isScrolling.current = true;
            if (flatListRef.current) {
              try {
                flatListRef.current.scrollToIndex({
                  animated: false,
                  index: 1, // Jump to real first item
                });
                setActiveIndex(1);
                const innerTimer = setTimeout(() => {
                  isScrolling.current = false;
                }, 50);
                transitionTimers.current.push(innerTimer);
              } catch (error) {
                isScrolling.current = false;
              }
            }
          }, 100);
          transitionTimers.current.push(timer);
        }
        // If we're at the first duplicate (last real item copy)
        else if (index === 0 && !isScrolling.current) {
          const timer = setTimeout(() => {
            isScrolling.current = true;
            if (flatListRef.current) {
              const targetIndex = loopData.length - 2;
              if (targetIndex >= 0 && targetIndex < loopData.length) {
                try {
                  flatListRef.current.scrollToIndex({
                    animated: false,
                    index: targetIndex, // Jump to real last item
                  });
                  setActiveIndex(targetIndex);
                  const innerTimer = setTimeout(() => {
                    isScrolling.current = false;
                  }, 50);
                  transitionTimers.current.push(innerTimer);
                } catch (error) {
                  isScrolling.current = false;
                }
              }
            }
          }, 100);
          transitionTimers.current.push(timer);
        }
      });

      return () => {
        scrollX.removeListener(listener);
        // Clear all transition timers
        transitionTimers.current.forEach(timer => clearTimeout(timer));
        transitionTimers.current = [];
      };
    }, [data, loopData.length]);

    const handleScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      {
        useNativeDriver: false,
        listener: (event) => {
          if (isScrolling.current || !event?.nativeEvent) return;

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

    const goToReminderType = (reminderType) => {
      openReminderModal(reminderType);
    };

    const renderItem = ({ item, index }) => {
      return (
        <TouchableOpacity onPress={() => goToReminderType(item.type)}>
          <View style={carouselStyles.slideOuter}>
            <View style={carouselStyles.slide}>
              <Image
                source={item.url}
                style={carouselStyles.image}
                resizeMode="cover"
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    };

    const renderIndicators = () => {
      if (!data || data.length === 0) return null;

      return (
        <View style={carouselStyles.indicatorContainer}>
          {data.map((_, index) => {
            // Calculate which real item is currently active
            let realActiveIndex = activeIndex - 1;
            if (activeIndex === 0) realActiveIndex = data.length - 1; // Last duplicate shows last real item
            if (activeIndex === loopData.length - 1) realActiveIndex = 0; // First duplicate shows first real item

            const isActive = index === realActiveIndex;

            return (
              <View
                key={index}
                style={[
                  carouselStyles.indicator,
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

    // Initialize scroll position on mount and cleanup on unmount
    useEffect(() => {
      let initTimer = null;
      if (data && data.length > 1 && loopData.length > 1) {
        initTimer = setTimeout(() => {
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
      }

      return () => {
        // Cleanup all timers
        if (initTimer) clearTimeout(initTimer);
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
        }
        transitionTimers.current.forEach(timer => clearTimeout(timer));
        transitionTimers.current = [];
      };
    }, []);

    return (
      <View style={carouselStyles.container}>
        {/* <Text style={carouselStyles.headerText}>Quick Setup Reminders</Text> */}
        <FlatList
          ref={flatListRef}
          data={loopData}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={16}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={carouselStyles.flatlistContent}
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

  if (loading) {
    return <SkeletonHome type="reminders" header={false} />;
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingTop: 150 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Reminder Carousel */}
        {reminderPic && reminderPic.length > 0 && (
          <View
            style={{
              height: deviceIsTablet ? 350 : 160,
              marginVertical: 10,
            }}
          >
            <ReminderCarousel
              data={reminderPic}
              onChangeTab={onChangeTab}
              gender={gender}
            />
          </View>
        )}

        {reminders.length > 0 ? (
          <ScrollView style={styles.remindersList}>
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.reminder_id}
                reminder={reminder}
                onDelete={() => handleDeleteReminder(reminder.reminder_id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No reminders set</Text>
            <Text style={styles.emptyStateSubtext}>
              Use the carousel above or tap the + button to create your first
              reminder
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      <FloatingActionButton icon="add" onPress={() => openReminderModal()} />

      <ChatModal
        visible={modalVisible}
        onClose={closeReminderModal}
        onAdd={handleAddReminder}
        initialReminderType={selectedReminderType}
      />
    </View>
  );
};

export default Reminders;

const carouselStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "visible",
    marginTop: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginLeft: 14,
    marginBottom: 10,
  },
  flatlistContent: {
    alignItems: "center",
  },
  slideOuter: {
    width: width,
    height: "100%",
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  slide: {
    width: width - 10,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },

  indicatorContainer: {
    position: "absolute",
    bottom: -20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  indicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#14A0C2",
    marginHorizontal: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f5f5f7",
    marginBottom: 20,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  remindersList: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  reminderItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
  },
  reminderIcon: {
    marginRight: 15,
    justifyContent: "center",
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  reminderDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  reminderTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  reminderMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  reminderFrequency: {
    fontSize: 11,
    color: "#777",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reminderFrequencyText: {
    fontSize: 11,
    color: "#777",
  },
  reminderNotificationType: {
    fontSize: 11,
    color: "#777",
  },
  deleteButton: {
    justifyContent: "center",
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  chatContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  chatContentContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: "80%",
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  aiMessage: {
    backgroundColor: "#f0f0f5",
    borderTopLeftRadius: 5,
  },
  userMessage: {
    backgroundColor: "#6c63ff",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageText: {
    color: "#333",
  },
  userMessageText: {
    color: "#fff",
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6c63ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 12,
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: width / 2 - 30,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    alignSelf: "flex-end",
    width: 100,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timeOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  timeOption: {
    width: width / 4 - 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    padding: 5,
    margin: 5,
    alignItems: "center",
  },
  selectedTimeOption: {
    backgroundColor: "#6c63ff",
    borderColor: "#6c63ff",
  },
  timeOptionText: {
    fontSize: 12,
    color: "#333",
  },
  selectedTimeOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  timePickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timePickerColumn: {
    width: 80,
    alignItems: "center",
  },
  timePickerLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  timePickerSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 15,
  },
  timePickerScroll: {
    height: 150,
    width: "100%",
  },
  timePickerScrollContent: {
    paddingVertical: 10,
  },
  timePickerItem: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerItemSelected: {
    backgroundColor: "#6c63ff",
    borderRadius: 8,
  },
  timePickerItemText: {
    fontSize: 14,
    color: "#333",
  },
  timePickerItemTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  timePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timePickerCancelButton: {
    backgroundColor: "#f0f0f5",
    flex: 1,
    marginRight: 10,
  },
  timePickerCancelButtonText: {
    color: "#666",
  },
  timePickerConfirmButton: {
    backgroundColor: "#6c63ff",
    flex: 1,
    marginLeft: 10,
  },
  timePickerConfirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  amPmContainer: {
    flexDirection: "column",
    height: 100,
    justifyContent: "center",
  },
  amPmButton: {
    padding: 5,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    margin: 4,
  },
  amPmButtonSelected: {
    backgroundColor: "#6c63ff",
    borderColor: "#6c63ff",
  },
  amPmButtonText: {
    fontSize: 12,
    color: "#333",
  },
  amPmButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: "#f44336",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  timeOptionsScrollView: {
    maxHeight: 120,
    marginBottom: 10,
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 5,
    fontStyle: "italic",
  },
  backButton: {
    backgroundColor: "#f0f0f5",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1595A3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  datePickerButton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
  },
  datePickerCancelButton: {
    backgroundColor: "#f0f0f5",
    marginRight: 10,
  },
  datePickerCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerConfirmButton: {
    backgroundColor: "#6c63ff",
    marginLeft: 10,
  },
  datePickerConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateTimePicker: {
    height: 200,
    marginVertical: 10,
  },
});
