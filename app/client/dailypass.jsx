import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { editDailyPassAPI } from "../../services/clientApi";
import { toIndianISOString } from "../../utils/basicUtilFunctions";
import { MaskedText } from "../../components/ui/MaskedText";
import DateTimePicker from "@react-native-community/datetimepicker";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const DailyPass = () => {
  const router = useRouter();
  const {
    amount,
    gymName,
    days,
    startDate: editStartDate,
    isEdit,
    location,
    gymId,
    pass_id,
    gym_id,
    discountPrice,
    discount_per,
  } = useLocalSearchParams();

  const [selectedDays, setSelectedDays] = useState(
    isEdit ? parseInt(days) || 4 : 4
  );
  const [selectedCard, setSelectedCard] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    if (isEdit && editStartDate) {
      // Parse the date string properly for local timezone
      const [year, month, day] = editStartDate.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const [expectedTime, setExpectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    if (isEdit && editStartDate) {
      const [year, month, day] = editStartDate.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const [tempTime, setTempTime] = useState(new Date());
  const [displayGymName, setDisplayGymName] = useState(
    gymName || "Mount Carmel Fitness Center"
  );

  const handleDaysChange = (newDays) => {
    setSelectedDays(newDays);

    // Show confetti animation only for exactly 4 days
    if (newDays === 4) {
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

  const handleBack = () => {
    router.push({
      pathname: "/client/gymdetails",
      params: {
        gym_id: gymId || gym_id,
        passPrice: amount,
        discountPrice: discountPrice,
        discount: discount_per,
      },
    });
  };

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
    }, [gymId, gym_id, amount, discountPrice, discount_per])
  );

  const basePrice = discountPrice ? parseInt(discountPrice) : 0;
  const totalPrice =
    selectedDays >= 4
      ? Math.round(basePrice * selectedDays * 0.9)
      : basePrice * selectedDays;
  const discount = selectedDays >= 4 ? 10 : 0;
  const normalPrice = basePrice * selectedDays;

  const getEndDate = () => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + selectedDays - 1);
    return endDate;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      // Only update if user confirmed (not dismissed)
      if (event.type === "set" && selectedDate) {
        setStartDate(selectedDate);
      } else {
      }
      // If dismissed, startDate stays the same
    } else {
      // iOS - update temp date as user scrolls
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      // Only update if user confirmed (not dismissed)
      if (event.type === "set" && selectedTime) {
        setExpectedTime(selectedTime);
      }
      // If dismissed, expectedTime stays the same
    } else {
      // iOS - update temp time as user scrolls
      if (selectedTime) {
        setTempTime(selectedTime);
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

  const handleEditSubmit = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Client ID not found. Please login again.",
        });
        return;
      }

      const payload = {
        pass_id: pass_id,
        client_id: parseInt(clientId),
        new_start_date: toIndianISOString(startDate).split("T")[0], // Format as YYYY-MM-DD
      };

      const response = await editDailyPassAPI(payload);

      if (response?.pass_id) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Pass updated successfully!",
        });
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to update pass",
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

  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.headerTitle}>
            <Text style={{ color: "#FF5757" }}>Fitt</Text>bot{" "}
            {isEdit ? "Edit" : "Daily"} Gym Pass
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gym Name */}
      <ScrollView>
        <View style={styles.gymSection}>
          <Text style={styles.gymName}>{displayGymName}</Text>
        </View>

        {/* Quick Select Section - Hide in edit mode */}
        {!isEdit && (
          <View style={styles.quickSelectSection}>
            {/* <Text style={styles.sectionTitle}>Quick Select Daily Gym Pass</Text> */}
            <LinearGradient
              colors={["#EBF5FF", "#FFFFFF"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaskedText
                bg2="#525252"
                bg1="#525252"
                text="Quick Select Daily Gym Pass"
                textStyle={styles.headerText}
              >
                Quick Select Daily Gym Pass
              </MaskedText>
            </LinearGradient>

            {/* 1 Day Pass */}
            <View style={styles.passCardWrapper}>
              {discount_per > 0 && (
                <View
                  style={[
                    styles.badgesContainer,
                    { justifyContent: "flex-end" },
                  ]}
                >
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{discount_per}% OFF</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.passCard,
                  selectedCard === "oneDay" && styles.selectedPassCard,
                ]}
                onPress={() => {
                  setSelectedCard("oneDay");
                  handleDaysChange(1);
                }}
              >
                <View style={styles.passCardContent}>
                  <View style={styles.passCardLeft}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={24}
                      color="#007BFF"
                    />
                    <Text style={styles.passCardText}>1 Day Pass</Text>
                  </View>
                  {discount_per > 0 ? (
                    <View style={styles.priceContainer}>
                      <Text style={styles.originalPrice}>₹{amount}</Text>
                      <Text style={styles.offerPrice}>₹{discountPrice}</Text>
                    </View>
                  ) : (
                    <Text style={styles.passCardPrice}>₹{discountPrice}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={["#EBF5FF", "#FFFFFF"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaskedText
                bg2="#525252"
                bg1="#525252"
                text="Bundle Pack - Get Extra"
                textStyle={styles.headerText}
                extraText="10% Discount"
                extra={true}
                extraStyle={{ color: "#FF5757", fontWeight: "bold" }}
              >
                Bundle Pack - Get Extra
              </MaskedText>
            </LinearGradient>

            {/* 4 Day Pass */}
            <View style={styles.passCardWrapper}>
              {/* Badges positioned above the card */}
              <View style={styles.badgesContainer}>
                {/* <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>Best Value</Text>
              </View> */}
                <LinearGradient
                  colors={["#007BFF", "#FF8C00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bestValueBadge}
                >
                  <Text style={styles.bestValueText}>Best Value</Text>
                </LinearGradient>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>10% OFF</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.passCard,
                  selectedCard === "fourDay" && styles.selectedPassCard,
                ]}
                onPress={() => {
                  setSelectedCard("fourDay");
                  handleDaysChange(4);
                }}
              >
                <View style={styles.passCardContent}>
                  <View style={styles.passCardLeft}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={24}
                      color="#007BFF"
                    />
                    <Text style={styles.passCardText}>4 Day Pass</Text>
                  </View>
                  <Text style={styles.passCardPrice}>
                    ₹{Math.round(basePrice * 4 * 0.9)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Price Summary */}
            <View style={styles.priceSummary}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.priceSummaryText}>
                <Text
                  style={{
                    color: "#5C5C5C",
                    textDecorationLine: "line-through",
                  }}
                >
                  Normal Price ₹{normalPrice}{" "}
                </Text>
                → You Pay ₹{totalPrice}
              </Text>
            </View>
          </View>
        )}

        {/* Custom Days Selector - Only show when a card is selected or in edit mode */}
        {(selectedCard || isEdit) && (
          <View style={styles.customSection}>
            {/* <Text style={styles.sectionTitle}>
          Select Days for Your Daily Gym Pass
        </Text> */}
            <LinearGradient
              colors={["#EBF5FF", "#FFFFFF"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaskedText
                bg2="#525252"
                bg1="#525252"
                text="Select Days for Your Daily Gym Pass"
                textStyle={styles.headerText}
              >
                Select Days for Your Daily Gym Pass
              </MaskedText>
            </LinearGradient>
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.daySelector}>
                <Text style={styles.selectDaysLabel}>
                  {isEdit ? "Days Available" : "Select Days"}
                </Text>
                <View style={styles.dayInputContainer}>
                  {!isEdit && (
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
                        color={selectedDays === 1 ? "#CCCCCC" : "#FFFFFF"}
                      />
                    </TouchableOpacity>
                  )}

                  <View style={styles.dayInputWrapper}>
                    <TextInput
                      style={styles.dayInput}
                      value={selectedDays.toString()}
                      onChangeText={isEdit ? null : handleTextChange}
                      keyboardType="numeric"
                      textAlign="center"
                      maxLength={2}
                      editable={!isEdit}
                    />
                  </View>

                  {!isEdit && (
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        selectedDays >= 30 && styles.dayButtonDisabled,
                      ]}
                      onPress={incrementDays}
                      disabled={selectedDays >= 30}
                    >
                      <MaterialIcons
                        name="add"
                        size={18}
                        color={selectedDays >= 30 ? "#CCCCCC" : "#FFFFFF"}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Date and Time Selector Row */}
              <View style={styles.dateTimeRow}>
                {/* Start Date Selector */}
                <View style={styles.dateTimeSelector}>
                  <Text style={styles.selectDaysLabelSelector}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateTimeInput}
                    onPress={() => {
                      if (Platform.OS === "ios") {
                        setTempDate(startDate);
                      }
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateTimeText}>
                      {startDate.toLocaleDateString()}
                    </Text>
                    <MaterialIcons
                      name="calendar-today"
                      size={20}
                      color="#007BFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Expected Time Selector */}
                <View style={styles.dateTimeSelector}>
                  <Text style={styles.selectDaysLabelSelector}>
                    Expected Time
                  </Text>
                  <TouchableOpacity
                    style={styles.dateTimeInput}
                    onPress={() => {
                      if (Platform.OS === "ios") {
                        setTempTime(expectedTime);
                      }
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.dateTimeText}>
                      {expectedTime.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <MaterialIcons name="schedule" size={20} color="#007BFF" />
                  </TouchableOpacity>
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
                    {selectedDays} Day Pass ( {startDate.toLocaleDateString()}{" "}
                    {selectedDays === 1 ? null : "to "}
                    {selectedDays === 1
                      ? null
                      : getEndDate().toLocaleDateString()}
                    )
                  </Text>
                </View>
                <Text style={styles.passSummaryPrice}>
                  ₹
                  {selectedDays >= 4
                    ? Math.round(basePrice * selectedDays * 0.9)
                    : basePrice * selectedDays}
                </Text>
              </View>
            </View>

            {/* Discount Message - Hide in edit mode */}
            {!isEdit && (
              <>
                {selectedDays < 4 ? (
                  <Text style={styles.discountMessage}>
                    <Text style={styles.discountHighlight}>Get 10% Off</Text>{" "}
                    When You Choose 4 Days Together
                  </Text>
                ) : selectedDays === 4 ? (
                  <Text style={styles.celebrationMessage}>
                    Congratulations! You Got 10% discount!!
                  </Text>
                ) : (
                  <Text style={styles.celebrationMessage}>
                    Great choice! You got 10% discount on your {selectedDays}{" "}
                    day pass!
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Spacer to push button to bottom */}
        <View style={styles.spacer} />

        {/* Buy Now Button - Fixed at bottom */}
        {(selectedCard || isEdit) && (
          <View style={styles.buyNowContainer}>
            <TouchableOpacity
              style={styles.buyNowButton}
              onPress={() => {
                if (!isEdit) {
                  router.push({
                    pathname: "/client/passpay",
                    params: {
                      gymName: displayGymName,
                      location: location || "Location not specified",
                      finalAmount: totalPrice,
                      days: selectedDays,
                      basePrice: basePrice,
                      startDate: startDate.toLocaleDateString(),
                      endDate: getEndDate().toLocaleDateString(),
                      expectedTime: expectedTime.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      gymId: gymId,
                    },
                    type: "new",
                  });
                } else {
                  handleEditSubmit();
                }
              }}
            >
              <LinearGradient
                colors={["#007BFF", "#FF8C00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyNowGradient}
              >
                <Text style={styles.buyNowText}>
                  {isEdit ? "Update Pass" : "Buy Now"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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

      {/* Confetti Animation */}
      {/* {showConfetti && (
        <GrainConfettiAnimation numberOfGrains={150} xpPoints={0} />
      )} */}
    </View>
  );
};

export default DailyPass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: Platform.OS === "ios" ? 0 : 0,
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
    marginLeft: 8,
  },
  gymSection: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  gymName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 6,
  },
  quickSelectSection: {
    // paddingHorizontal: 16,
    paddingVertical: 8,
  },
  gradient: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#525252",
    marginLeft: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  passCardWrapper: {
    marginBottom: 10,
    position: "relative",
    paddingHorizontal: 16,
  },
  badgesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: -8,
    zIndex: 2,
  },
  passCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // fourDayPassCard: {
  //   borderColor: "#007BFF",
  //   borderWidth: 2,
  // },
  selectedPassCard: {
    borderColor: "#007BFF",
    borderWidth: 2,
    elevation: 4,
    shadowOpacity: 0.2,
  },
  passCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  bestValueBadge: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  bestValueText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  discountBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  passCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  passCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  passCardPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  priceContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 15,
    paddingVertical: 0,
    borderRadius: 8,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
    textDecorationLine: "line-through",
  },
  offerPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  priceSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginTop: 0,
  },
  priceSummaryText: {
    fontSize: 12,
    color: "#000000",
    marginLeft: 4,
    fontWeight: "500",
  },
  customSection: {
    paddingVertical: 12,
    paddingTop: 6,
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
  discountMessage: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 16,
  },
  discountHighlight: {
    color: "#FF5757",
    fontWeight: "600",
  },
  celebrationMessage: {
    fontSize: 12,
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
    lineHeight: 16,
  },
  spacer: {
    flex: 1,
  },
  buyNowContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 10 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  buyNowButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  buyNowGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
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
  dateTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007BFF",
    flex: 1,
  },
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
