import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import QRCode from "react-native-qrcode-svg";
import { toIndianISOString } from "../../utils/basicUtilFunctions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addPunchInAPI,
  addPunchOutAPI,
  getAllDailyPassesAPI,
  getTodayQrAPI,
} from "../../services/clientApi";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
} from "expo-location";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const muscleGroups = [
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
];

const ALLOWED_DISTANCE = 200;

const PassCard = ({ item, router, onQRPress, onEditSuccess }) => {
  const getStatusColor = () => {
    const today = new Date();
    const passStartDate = new Date(item.fromDate);
    const passEndDate = new Date(item.toDate);

    today.setHours(0, 0, 0, 0);
    passStartDate.setHours(0, 0, 0, 0);
    passEndDate.setHours(0, 0, 0, 0);

    // If pass has expired
    if (today > passEndDate) {
      return ["#9E9E9E", "#757575"]; // Gray for expired
    }

    // If pass is upcoming (future start date)
    if (today < passStartDate) {
      return ["#FF9800", "#F57C00"]; // Orange for upcoming
    }

    // If pass is active (today is within pass period)
    if (today >= passStartDate && today <= passEndDate) {
      return ["#4CAF50", "#45A049"]; // Green for active
    }

    return ["#007BFF", "#0056B3"]; // Default blue
  };

  const calculateRemainingDays = () => {
    const today = new Date();
    const passStartDate = new Date(item.fromDate);
    const passEndDate = new Date(item.toDate);

    today.setHours(0, 0, 0, 0);
    passStartDate.setHours(0, 0, 0, 0);
    passEndDate.setHours(0, 0, 0, 0);

    // If pass has expired
    if (today > passEndDate) {
      return { canEdit: false, isExpired: true };
    }

    // If today is the last day of pass
    if (today.getTime() === passEndDate.getTime()) {
      return { canEdit: false, isLastDay: true };
    }

    // Use local date string format to avoid timezone issues
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Calculate total available days in the pass
    const totalDays =
      Math.ceil(
        (passEndDate.getTime() - passStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    let startDate, remainingDays;

    // If today is the pass start date
    if (today.getTime() === passStartDate.getTime()) {
      // If available days > 1, send next day as start date
      if (totalDays > 1) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // If tomorrow is beyond the pass end date, no days to edit
        if (tomorrow > passEndDate) {
          return { canEdit: false, isLastDay: true };
        }

        startDate = formatLocalDate(tomorrow);
        remainingDays =
          Math.ceil(
            (passEndDate.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
      } else {
        // Only 1 day available and it's today, cannot edit
        return { canEdit: false, isLastDay: true };
      }
    }
    // If pass has already started (today is after start date but before end date)
    else if (today > passStartDate && today < passEndDate) {
      // Calculate remaining days from tomorrow (cannot edit same day)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // If tomorrow is beyond the pass end date, no days to edit
      if (tomorrow > passEndDate) {
        return { canEdit: false, isLastDay: true };
      }

      startDate = formatLocalDate(tomorrow);
      remainingDays =
        Math.ceil(
          (passEndDate.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
    }
    // If pass is in the future
    else if (today < passStartDate) {
      startDate = formatLocalDate(passStartDate);
      remainingDays = totalDays;
    }
    // Fallback case
    else {
      return { canEdit: false, isLastDay: true };
    }

    return {
      canEdit: true,
      remainingDays: remainingDays,
      nextStartDate: startDate,
    };
  };

  const handleEditPress = () => {
    const editData = calculateRemainingDays();

    if (!editData.canEdit) {
      return;
    }

    const params = {
      gymName: item.gymName,
      days: editData.remainingDays.toString(),
      amount: item.amount.toString(),
      startDate: editData.nextStartDate,
      isEdit: "true",
      pass_id: item.pass_id,
      gym_id: item.gym_id,
      onEditSuccess: onEditSuccess,
    };

    router.push({
      pathname: "/client/dailypass",
      params: params,
    });
  };

  const editStatus = calculateRemainingDays();

  const getStatusText = () => {
    const today = new Date();
    const passStartDate = new Date(item.fromDate);
    const passEndDate = new Date(item.toDate);

    today.setHours(0, 0, 0, 0);
    passStartDate.setHours(0, 0, 0, 0);
    passEndDate.setHours(0, 0, 0, 0);

    // If pass has expired
    if (today > passEndDate) {
      return "Expired";
    }

    // If pass is upcoming
    if (today < passStartDate) {
      return "Upcoming";
    }

    // If pass is active (today is within pass period)
    if (today >= passStartDate && today <= passEndDate) {
      const remainingDays =
        Math.ceil(
          (passEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      return `${remainingDays} days left`;
    }

    return "Active";
  };

  const isActive = () => {
    const today = new Date();
    const passStartDate = new Date(item.fromDate);
    const passEndDate = new Date(item.toDate);

    today.setHours(0, 0, 0, 0);
    passStartDate.setHours(0, 0, 0, 0);
    passEndDate.setHours(0, 0, 0, 0);

    return today >= passStartDate && today <= passEndDate;
  };

  return (
    <View style={styles.ticketContainer}>
      {/* Main Ticket */}
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.ticket}>
        {/* Header Section */}
        <View style={styles.ticketHeader}>
          <View style={styles.gymInfo}>
            <Text style={styles.gymName}>{item.gymName}</Text>
            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={12} color="#666" />
              <Text style={styles.address}>{item.address}</Text>
            </View>
          </View>
          <LinearGradient colors={getStatusColor()} style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </LinearGradient>
        </View>

        {/* Dotted Line Separator */}
        <View style={styles.dottedLineContainer}>
          {Array.from({ length: 25 }).map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>

        {/* Date & Time Section */}
        <View style={styles.dateTimeSection}>
          {item.is_edited &&
          item.actual_days &&
          item.actual_days.length > 0 &&
          item.rescheduled_days &&
          item.rescheduled_days.length > 0 ? (
            // Show both original and edited date ranges
            <>
              {/* Original Dates */}
              <View style={styles.originalDatesSection}>
                <Text style={styles.originalDatesLabel}>Original Dates</Text>
                <View style={styles.dateLabelsRow}>
                  <Text style={styles.fromToLabel}>From</Text>
                  <Text style={styles.fromToLabel}>To</Text>
                </View>
                <View style={styles.dateBoxesRow}>
                  <View style={styles.dateBox}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color="#FF9800"
                    />
                    <Text style={styles.dateText}>
                      {new Date(item.actual_days[0]).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                  <View style={styles.dateBox}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color="#FF9800"
                    />
                    <Text style={styles.dateText}>
                      {new Date(
                        item.actual_days[item.actual_days.length - 1]
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Edited Dates */}
              <View style={styles.editedDatesSection}>
                <Text style={styles.editedDatesLabel}>Edited Dates</Text>
                {/* <View style={styles.dateLabelsRow}>
                  <Text style={styles.fromToLabel}>From</Text>
                  <Text style={styles.fromToLabel}>To</Text>
                </View> */}
                <View style={styles.dateBoxesRow}>
                  <View style={[styles.dateBox, styles.editedDateBox]}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color="#22C55E"
                    />
                    <Text style={styles.dateText}>
                      {new Date(item.rescheduled_days[0]).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                  <View style={[styles.dateBox, styles.editedDateBox]}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color="#22C55E"
                    />
                    <Text style={styles.dateText}>
                      {new Date(
                        item.rescheduled_days[item.rescheduled_days.length - 1]
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            // Show regular date display for non-edited passes
            <>
              <View style={styles.dateLabelsRow}>
                <Text style={styles.fromToLabel}>From</Text>
                <Text style={styles.fromToLabel}>To</Text>
              </View>

              <View style={styles.dateBoxesRow}>
                <View style={styles.dateBox}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="#007BFF"
                  />
                  <Text style={styles.dateText}>
                    {new Date(item.fromDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.dateBox}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="#007BFF"
                  />
                  <Text style={styles.dateText}>
                    {new Date(item.toDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <View style={styles.timeLeftSection}>
                <MaterialIcons name="schedule" size={16} color="#007BFF" />
                <Text style={styles.timeLabel}>Time</Text>
              </View>
              <Text style={styles.timeValue}>{item.time}</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          {item?.is_upgraded ? (
            // Show upgraded text when pass has been upgraded
            <View style={styles.upgradedContainer}>
              <MaterialIcons name="upgrade" size={16} color="#22C55E" />
              <Text style={styles.upgradedText}>
                Upgraded from{" "}
                <Text style={styles.upgradedGymName}>{item?.oldGymName}</Text>
              </Text>
            </View>
          ) : (
            // Show edit and upgrade buttons when pass is not upgraded
            <>
              <TouchableOpacity
                style={[
                  styles.editButton,
                  // !editStatus.canEdit && styles.editButtonDisabled,
                  !item?.can_reschedule && styles.editButtonDisabled,
                ]}
                disabled={!item?.can_reschedule}
                onPress={handleEditPress}
              >
                {/* <MaterialIcons
                  name="edit"
                  size={14}
                  color={!editStatus.canEdit ? "#999" : "#FFFFFF"}
                /> */}
                <Image
                  source={require("../../assets/images/plans/edit_icon.png")}
                  style={{
                    width: 18,
                    height: 18,
                    tintColor: !item.can_reschedule ? "#999" : "#FFFFFF",
                  }}
                />
                <Text
                  style={[
                    styles.editButtonText,
                    // !editStatus.canEdit && styles.editButtonTextDisabled,
                    !item?.can_reschedule && styles.editButtonTextDisabled,
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  !editStatus.canEdit && styles.upgradeButtonDisabled,
                ]}
                disabled={!editStatus.canEdit}
                onPress={() => {
                  const editData = calculateRemainingDays();
                  if (editData.canEdit) {
                    router.push({
                      pathname: "/client/upgradegyms",
                      params: {
                        fromDate: item.fromDate,
                        pass_id: item?.pass_id,
                        toDate: item.toDate,
                        gym_id: item?.gym_id,
                        currentAmount: item.amount.toString(),
                        currentGymName: item.gymName,
                        availableDays: editData.remainingDays.toString(),
                        upgradeStartDate: editData.nextStartDate,
                      },
                    });
                  }
                }}
              >
                {/* <MaterialIcons
                  name="upgrade"
                  size={16}
                  color={!editStatus.canEdit ? "#999" : "#FFFFFF"}
                /> */}
                <Image
                  source={require("../../assets/images/plans/upgrade_gym.png")}
                  style={{
                    width: 18,
                    height: 18,
                    tintColor: !editStatus.canEdit ? "#999" : "#FFFFFF",
                  }}
                />
                <Text
                  style={[
                    styles.upgradeButtonText,
                    !editStatus.canEdit && styles.upgradeButtonTextDisabled,
                  ]}
                >
                  Upgrade Gym
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <MaterialIcons name="emergency" size={10} color="#FF5757" />
          <Text style={styles.noteText}>
            {editStatus.isLastDay
              ? "Cannot edit on last day of pass"
              : editStatus.isSameDay
              ? "Same-Day Edits Not Allowed"
              : item?.is_edited
              ? "Pass already edited - no more changes allowed"
              : "Change of plans? Edit your pass 1 day in advance"}
          </Text>
        </View>
      </LinearGradient>

      {/* Ticket Stub */}
      {isActive() ? (
        <TouchableOpacity
          style={styles.ticketStub}
          onPress={() => onQRPress(item)}
        >
          <LinearGradient colors={getStatusColor()} style={styles.stubGradient}>
            <MaterialIcons name="chevron-right" size={30} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={styles.ticketStub}>
          <LinearGradient colors={getStatusColor()} style={styles.stubGradient}>
            <View style={{ width: 30, height: 30 }} />
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const QRModal = ({
  visible,
  onClose,
  gymData,
  onPunchInPress,
  onPunchOutPress,
}) => {
  const [punchInLoading, setPunchInLoading] = useState(false);
  const [punchOutLoading, setPunchOutLoading] = useState(false);
  const [isUserPunchedIn, setIsUserPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [gymLocation, setGymLocation] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showMuscleSelection, setShowMuscleSelection] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [todayDate, setTodayDate] = useState("");

  const fetchQrData = async () => {
    if (!gymData?.pass_id) {
      console.error("No pass_id available");
      return;
    }

    setQrLoading(true);
    try {
      const response = await getTodayQrAPI(gymData.pass_id);

      if (response?.status === 200) {
        setQrData(response.day_id);
        setTodayDate(
          response.date || toIndianISOString(new Date()).split("T")[0]
        );

        // Update punch status from QR API response
        setIsUserPunchedIn(!response.in_punch);
        setPunchInTime(response.in_time);
        setPunchOutTime(response.out_time);
        setGymLocation(response?.gym_location);
      } else if (response?.status === 409) {
        alert("Today's Pass Already Scanned");
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.message || "Unable to generate QR code for today",
        });
      }
    } catch (error) {
      console.error("Error fetching QR data:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to fetch QR data",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const checkPunchStatus = async () => {
    // This function is now replaced by fetchQrData, but keeping for compatibility
    await fetchQrData();
  };

  // Check punch status when modal opens
  React.useEffect(() => {
    if (visible && gymData) {
      checkPunchStatus();
    }
  }, [visible, gymData]);

  const formatTimeTo12Hour = (timeString) => {
    if (!timeString || timeString === "NA") return "NA";

    try {
      const [hours, minutes, seconds] = timeString.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  // UUID generation is no longer needed - using API QR data

  const toggleMuscleSelection = (muscle) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handlePunchInPress = () => {
    if (onPunchInPress) {
      onPunchInPress(gymData, gymLocation);
    }
  };

  const handlePunchIn = async () => {
    if (punchInLoading) return;
    setPunchInLoading(true);

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId || !gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Client or Gym information not found. Please login again.",
        });
        return;
      }

      const payload = {
        client_id: clientId,
        gym_id: gymId,
        muscle: selectedMuscles,
      };

      const response = await addPunchInAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Punched In Successfully!",
        });
        // Update the punch status after successful punch in
        await checkPunchStatus();
        setShowMuscleSelection(false);
        setSelectedMuscles([]);
        onClose(); // Close modal on success
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch in.",
        });
      }
    } catch (error) {
      console.error("Punch in error:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setPunchInLoading(false);
    }
  };

  const handlePunchOutPress = () => {
    if (onPunchOutPress) {
      onPunchOutPress(gymData);
    }
  };

  if (!gymData) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* QR Section with Background */}
          <View style={styles.qrSection}>
            {/* Gym Name */}
            <Text style={styles.modalGymName}>{gymData.gymName}</Text>

            {/* Date Display */}
            {todayDate && (
              <Text style={styles.qrDate}>
                {new Date(todayDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            )}

            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              {qrLoading ? (
                <View style={styles.qrLoadingContainer}>
                  <ActivityIndicator size="large" color="#007BFF" />
                  <Text style={styles.qrLoadingText}>Loading QR...</Text>
                </View>
              ) : qrData ? (
                <QRCode
                  value={qrData}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              ) : (
                <View style={styles.qrErrorContainer}>
                  <MaterialIcons
                    name="error-outline"
                    size={48}
                    color="#FF5757"
                  />
                  <Text style={styles.qrErrorText}>QR Code Unavailable</Text>
                </View>
              )}
            </View>

            {/* Instructions */}
            <Text style={styles.qrInstructions}>
              Please Show this QR code at your gym for entry.
            </Text>

            {/* Enhanced Punch Status Display */}
            {/* {qrLoading ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#007BFF" />
                <Text style={styles.statusTextModal}>Loading status...</Text>
              </View>
            ) : (
              <View style={styles.punchStatusContainer}>
              
                <View style={styles.punchStatusRow}>
                  <MaterialIcons
                    name="login"
                    size={16}
                    color={isUserPunchedIn ? "#22C55E" : "#FF5757"}
                  />
                  <Text style={styles.punchStatusLabel}>Punch In:</Text>
                  <Text
                    style={[
                      styles.punchStatusValue,
                      { color: isUserPunchedIn ? "#22C55E" : "#FF5757" },
                    ]}
                  >
                    {punchInTime
                      ? formatTimeTo12Hour(punchInTime)
                      : "Not punched In"}
                  </Text>
                </View>

                <View style={styles.punchStatusRow}>
                  <MaterialIcons
                    name="logout"
                    size={16}
                    color={punchOutTime ? "#22C55E" : "#999"}
                  />
                  <Text style={styles.punchStatusLabel}>Punch Out:</Text>
                  <Text
                    style={[
                      styles.punchStatusValue,
                      { color: punchOutTime ? "#22C55E" : "#999" },
                    ]}
                  >
                    {punchOutTime
                      ? formatTimeTo12Hour(punchOutTime)
                      : "Not punched Out"}
                  </Text>
                </View>
              </View>
            )} */}
          </View>

          {/* Punch Buttons */}
          {/* <View style={styles.punchButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.punchInButton,
                (punchInLoading || qrLoading || isUserPunchedIn || !qrData) &&
                  styles.disabledButton,
              ]}
              onPress={handlePunchInPress}
              disabled={
                punchInLoading ||
                punchOutLoading ||
                qrLoading ||
                isUserPunchedIn ||
                !qrData
              }
            >
              {punchInLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="login" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.punchButtonText}>Punch in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.punchOutButton,
                (punchOutLoading ||
                  qrLoading ||
                  !isUserPunchedIn ||
                  !qrData ||
                  Boolean(punchOutTime)) &&
                  styles.disabledButton,
              ]}
              onPress={handlePunchOutPress}
              disabled={
                punchInLoading ||
                punchOutLoading ||
                qrLoading ||
                !isUserPunchedIn ||
                !qrData ||
                Boolean(punchOutTime)
              }
            >
              {punchOutLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="logout" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.punchButtonText}>Punch out</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </View>
    </Modal>
  );
};

const AllPass = () => {
  const router = useRouter();
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchAllPasses = async () => {
    try {
      setLoading(true);
      const clientId = await AsyncStorage.getItem("client_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Client ID not found. Please login again.",
        });
        return;
      }

      const response = await getAllDailyPassesAPI(parseInt(clientId));

      if (response?.passes) {
        // Transform API response to match our current UI format
        const transformedPasses = response.passes.map((pass, index) => ({
          id: index + 1,
          pass_id: pass.pass_id,
          gymName: pass.gym_name,
          address:
            `${pass.locality || ""}, ${pass.city || ""}`
              .trim()
              .replace(/^,|,$/, "") || "Location not specified",
          fromDate: pass.valid_from,
          toDate: pass.valid_until,
          time: pass.selected_time || "Not Available",
          status: pass.remaining_days > 0 ? "active" : "expired",
          amount: pass?.amount,
          remaining_days: pass.remaining_days,
          can_reschedule: pass.can_reschedule,
          can_upgrade: pass.can_upgrade,
          gym_id: pass.gym_id,
          is_edited: pass.is_edited,
          actual_days: pass.actual_days,
          rescheduled_days: pass.rescheduled_days,
          is_upgraded: pass?.is_upgraded || false,
          oldGymName: pass?.old_gym_name,
        }));

        setPasses(transformedPasses);
      } else {
        setPasses([]);
      }
    } catch (error) {
      console.error("Error fetching passes:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to fetch daily passes",
      });
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAllPasses();
    }, [])
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/client/home");
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handleBack = () => {
    router.push("/client/home");
  };

  const handleQRPress = (gymItem) => {
    setSelectedGym(gymItem);
    setQrModalVisible(true);
  };

  const closeQRModal = () => {
    setQrModalVisible(false);
    setSelectedGym(null);
  };

  const handlePunchInPress = (gymData, gymLocationData) => {
    setQrModalVisible(false);
    setSelectedGym({
      ...gymData,
      showMuscleSelection: true,
      selectedMuscles: [],
      gym_location: gymLocationData, // Pass the gym location from the QR API response
    });
  };

  const handlePunchOutPress = (gymData) => {
    setQrModalVisible(false);
    setSelectedGym({ ...gymData, showExitConfirm: true });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handlePunchInConfirm = async () => {
    if (!selectedGym?.selectedMuscles?.length) return;

    try {
      setSelectedGym({ ...selectedGym, punchInLoading: true });

      // Check if we have gym location from getTodayQrAPI
      if (!selectedGym.gym_location) {
        showToast({
          type: "error",
          title: "Location Error",
          desc: "Gym location not available. Please try again.",
        });
        setSelectedGym({ ...selectedGym, punchInLoading: false });
        return;
      }

      // Check location permission
      let { status } = await requestForegroundPermissionsAsync();

      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Permission Required",
          desc: "Location permission is required to punch in. Please enable it in settings.",
        });
        setSelectedGym({ ...selectedGym, punchInLoading: false });
        return;
      }

      // Add a small delay to ensure permission is fully processed
      if (Platform.OS === "ios") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Get current location with retry logic
      let position = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!position && attempts < maxAttempts) {
        try {
          position = await getCurrentPositionAsync({
            accuracy:
              Platform.OS === "android"
                ? LocationAccuracy.High
                : LocationAccuracy.Best,
            maximumAge: 10000,
            timeout: 10000,
          });
          break;
        } catch (locationError) {
          attempts++;

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw locationError;
          }
        }
      }

      if (!position) {
        throw new Error("Unable to get location after multiple attempts");
      }

      // Calculate distance from gym
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        selectedGym.gym_location.latitude,
        selectedGym.gym_location.longitude
      );

      if (distance > ALLOWED_DISTANCE) {
        showToast({
          type: "error",
          title: "Location Error",
          desc: "You are not at the gym. Please punch in only when you are inside the gym.",
        });
        setSelectedGym({ ...selectedGym, punchInLoading: false });
        return;
      }

      // Proceed with punch in if location is valid
      const clientId = await AsyncStorage.getItem("client_id");

      const payload = {
        client_id: clientId,
        gym_id: selectedGym?.gym_id,
        muscle: selectedGym.selectedMuscles,
      };

      const response = await addPunchInAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Punched In Successfully!",
        });
        // Reset all modal states
        setSelectedGym(null);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch in.",
        });
        setSelectedGym({ ...selectedGym, punchInLoading: false });
      }
    } catch (error) {
      console.error("Location/Punch in error:", error);

      let errorMessage =
        "Could not get your location. Please ensure location services are enabled and try again.";

      if (error.message.includes("denied")) {
        errorMessage =
          "Location access was denied. Please enable location permissions in settings.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Location request timed out. Please try again.";
      } else if (error.message.includes("unavailable")) {
        errorMessage =
          "Location services are unavailable. Please check your device settings.";
      }

      showToast({
        type: "error",
        title: "Error",
        desc: errorMessage,
      });
      setSelectedGym({ ...selectedGym, punchInLoading: false });
    }
  };

  const handlePunchOutConfirm = async () => {
    try {
      setSelectedGym({ ...selectedGym, punchOutLoading: true });
      const clientId = await AsyncStorage.getItem("client_id");

      const payload = {
        client_id: clientId,
        gym_id: selectedGym?.gym_id,
      };

      const response = await addPunchOutAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Punched Out Successfully!",
        });
        // Reset all modal states
        setSelectedGym(null);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch out.",
        });
        setSelectedGym({ ...selectedGym, punchOutLoading: false });
      }
    } catch (error) {
      console.error("Punch out error:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
      setSelectedGym({ ...selectedGym, punchOutLoading: false });
    }
  };

  const renderPass = ({ item }) => (
    <PassCard
      item={item}
      router={router}
      onQRPress={handleQRPress}
      onEditSuccess={fetchAllPasses}
    />
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Daily Passes</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Passes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading your passes...</Text>
        </View>
      ) : passes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-note" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Daily Passes Found</Text>
          <Text style={styles.emptySubtitle}>
            You haven't purchased any daily passes yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={passes}
          renderItem={renderPass}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      )}

      {/* QR Code Modal */}
      <QRModal
        visible={qrModalVisible}
        onClose={closeQRModal}
        gymData={selectedGym}
        onPunchInPress={handlePunchInPress}
        onPunchOutPress={handlePunchOutPress}
      />

      {/* Additional Modals rendered separately to avoid nesting issues */}
      {selectedGym && (
        <>
          {/* Muscle Selection Modal */}
          <Modal
            visible={selectedGym?.showMuscleSelection || false}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setSelectedGym({
                ...selectedGym,
                showMuscleSelection: false,
                selectedMuscles: [],
              });
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setSelectedGym({
                  ...selectedGym,
                  showMuscleSelection: false,
                  selectedMuscles: [],
                });
              }}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Muscle Groups</Text>
                    <Text style={styles.modalSubtitle}>
                      Which areas are you planning to workout today?
                    </Text>

                    <View style={styles.muscleGroupsModalContainer}>
                      {muscleGroups.map((muscle) => (
                        <TouchableOpacity
                          key={muscle}
                          style={[
                            styles.muscleGroupItem,
                            (selectedGym?.selectedMuscles || []).includes(
                              muscle
                            ) && styles.selectedMuscleGroupItem,
                          ]}
                          onPress={() => {
                            const currentMuscles =
                              selectedGym?.selectedMuscles || [];
                            const newMuscles = currentMuscles.includes(muscle)
                              ? currentMuscles.filter((m) => m !== muscle)
                              : [...currentMuscles, muscle];
                            setSelectedGym({
                              ...selectedGym,
                              selectedMuscles: newMuscles,
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.muscleGroupItemText,
                              (selectedGym?.selectedMuscles || []).includes(
                                muscle
                              ) && styles.selectedMuscleGroupItemText,
                            ]}
                          >
                            {muscle}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.modalButtonsContainer}>
                      <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => {
                          setSelectedGym({
                            ...selectedGym,
                            showMuscleSelection: false,
                            selectedMuscles: [],
                          });
                        }}
                      >
                        <Text style={styles.modalCancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.modalConfirmButton,
                          (!selectedGym?.selectedMuscles?.length ||
                            selectedGym?.punchInLoading) &&
                            styles.disabledConfirmButton,
                        ]}
                        disabled={
                          !selectedGym?.selectedMuscles?.length ||
                          selectedGym?.punchInLoading
                        }
                        onPress={handlePunchInConfirm}
                      >
                        {selectedGym?.punchInLoading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.modalConfirmButtonText}>
                            Confirm
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Exit Confirmation Modal */}
          <Modal
            visible={selectedGym?.showExitConfirm || false}
            transparent
            animationType="fade"
            onRequestClose={() =>
              setSelectedGym({ ...selectedGym, showExitConfirm: false })
            }
          >
            <TouchableWithoutFeedback
              onPress={() =>
                setSelectedGym({ ...selectedGym, showExitConfirm: false })
              }
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Confirm Gym Exit</Text>
                    <Text style={styles.modalSubtitle}>
                      Are you sure you want to end your workout session?
                    </Text>

                    <View style={styles.modalButtonsContainer}>
                      <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() =>
                          setSelectedGym({
                            ...selectedGym,
                            showExitConfirm: false,
                          })
                        }
                      >
                        <Text style={styles.modalCancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalConfirmButton}
                        disabled={selectedGym?.punchOutLoading}
                        onPress={handlePunchOutConfirm}
                      >
                        {selectedGym?.punchOutLoading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.modalConfirmButtonText}>
                            Confirm
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </>
      )}
    </View>
  );
};

export default AllPass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
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
  listContainer: {
    padding: 16,
  },
  ticketContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    borderWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "#ddd",
  },
  ticket: {
    flex: 1,
    padding: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  gymInfo: {
    flex: 1,
    marginRight: 12,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  address: {
    fontSize: 12,
    color: "#A8A8A8",
    marginLeft: 4,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFF",
  },
  dottedLineContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 0,
  },
  dot: {
    width: 6,
    height: 2,
    backgroundColor: "#D5D5D5",
  },
  dateTimeSection: {
    marginBottom: 8,
  },
  originalDatesSection: {
    marginBottom: 2,
  },
  originalDatesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
    marginBottom: 4,
    textAlign: "center",
  },
  editedDatesSection: {
    marginBottom: 8,
  },
  editedDatesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
    marginBottom: 4,
    textAlign: "center",
  },
  editedDateBox: {
    borderColor: "#22C55E",
    borderWidth: 1.5,
    backgroundColor: "#F0FDF4",
  },
  dateLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  fromToLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
    marginLeft: 12,
  },
  dateBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  timeRow: {
    alignItems: "flex-start",
  },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: "100%",
  },
  timeLeftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  actionSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  upgradedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    flex: 1,
  },
  upgradedText: {
    fontSize: 14,
    color: "#166534",
    marginLeft: 8,
    fontWeight: "500",
  },
  upgradedGymName: {
    fontWeight: "600",
    color: "#22C55E",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22C55E",
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  editButtonDisabled: {
    borderColor: "#DDD",
    backgroundColor: "#F9F9F9",
  },
  editButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 4,
    fontWeight: "500",
  },
  editButtonTextDisabled: {
    color: "#999",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5757",
    flex: 1,
    backgroundColor: "#FF5757",
    justifyContent: "center",
  },
  upgradeButtonDisabled: {
    borderColor: "#DDD",
    backgroundColor: "#F9F9F9",
  },
  upgradeButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 4,
    fontWeight: "500",
  },
  upgradeButtonTextDisabled: {
    color: "#999",
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    // backgroundColor: "#FFF9E6",
    padding: 8,
    borderRadius: 6,
    marginBottom: 0,
    paddingVertical: 0,
  },
  noteText: {
    fontSize: 10,
    color: "#666",
    marginLeft: 2,
    flex: 1,
    lineHeight: 14,
  },
  qrSection: {
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: "100%",
  },
  qrPlaceholder: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: "#007BFF",
    borderStyle: "dashed",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketStub: {
    width: 40,
  },
  stubGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    minWidth: 300,
    maxWidth: screenWidth - 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalGymName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 8,
    textAlign: "center",
  },
  qrDate: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  qrContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  qrLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  qrLoadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  qrErrorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  qrErrorText: {
    fontSize: 14,
    color: "#FF5757",
    marginTop: 8,
    textAlign: "center",
  },
  qrInstructions: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  punchButtonsContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  punchInButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  punchOutButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  punchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    gap: 8,
  },
  statusTextModal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  punchStatusContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    width: "100%",
  },
  punchStatusRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  punchStatusLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  punchStatusValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  muscleGroupsModalContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  muscleGroupItem: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
    marginVertical: 6,
  },
  selectedMuscleGroupItem: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  muscleGroupItemText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  selectedMuscleGroupItemText: {
    color: "#FFF",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    flex: 0.45,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#007BFF",
    flex: 0.45,
    alignItems: "center",
  },
  disabledConfirmButton: {
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
