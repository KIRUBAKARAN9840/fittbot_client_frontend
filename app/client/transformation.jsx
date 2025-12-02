import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  StatusBar,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import { Camera } from "expo-camera";
import { toIndianISOString } from "../../utils/basicUtilFunctions";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import WorkoutCompletionModal from "../../components/ui/Workout/workoutcompletionmodal";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");

const TransformationPage = ({ gender }) => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [submittedDates, setSubmittedDates] = useState(null);
  const [workoutCompletionVisible, setWorkoutCompletionVisible] =
    useState(false);
  const [image, setImage] = useState(null);
  const [foundImages, setFoundImages] = useState({
    firstImage: null,
    secondImage: null,
  });
  const [clientId, setClientId] = useState(null);

  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [iosPickerMode, setIosPickerMode] = useState(null);
  const slideshowTimerRef = useRef(null);
  const slideDuration = 3000;

  const onFromDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowFromPicker(false);
    }

    if (selectedDate) {
      setFromDate(selectedDate);
    }

    // For iOS, close picker when date is confirmed
    if (Platform.OS === "ios" && event.type === "set") {
      setShowFromPicker(false);
      setIosPickerMode(null);
    }
  };

  const onToDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowToPicker(false);
    }

    if (selectedDate) {
      setToDate(selectedDate);
    }

    // For iOS, close picker when date is confirmed
    if (Platform.OS === "ios" && event.type === "set") {
      setShowToPicker(false);
      setIosPickerMode(null);
    }
  };

  const handleFromDatePress = () => {
    if (Platform.OS === "ios") {
      setIosPickerMode("from");
    }
    setShowFromPicker(true);
  };

  const handleToDatePress = () => {
    if (Platform.OS === "ios") {
      setIosPickerMode("to");
    }
    setShowToPicker(true);
  };

  const dismissIOSPicker = () => {
    setShowFromPicker(false);
    setShowToPicker(false);
    setIosPickerMode(null);
  };

  // Fetch client ID from AsyncStorage on component mount
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const storedClientId = await AsyncStorage.getItem("client_id");
        if (storedClientId) {
          setClientId(storedClientId);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc: "Client ID not found. Please login again.",
          });
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to fetch user information",
        });
      }
    };

    fetchClientId();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Select Date";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const formatDateForSearch = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const findImages = async () => {
    if (!submittedDates || !clientId) return;

    try {
      const dirUri = `${FileSystem.documentDirectory}FittbotImages/`;
      const dirInfo = await FileSystem.getInfoAsync(dirUri);

      if (!dirInfo.exists) {
        alert("No images found for the selected dates");
        return;
      }

      const files = await FileSystem.readDirectoryAsync(dirUri);

      const fromDateStr = formatDateForSearch(fromDate);
      const toDateStr = formatDateForSearch(toDate);
      const filteredFiles = files.filter((filename) => {
        if (!filename.startsWith(`${clientId}_`)) {
          return false;
        }
        const parts = filename.split("_");
        if (parts.length < 3) return false;
        const dateStr = parts[2]?.split(".")[0];
        return dateStr && dateStr >= fromDateStr && dateStr <= toDateStr;
      });

      if (filteredFiles.length === 0) {
        return;
      }

      const fromDateFiles = filteredFiles.filter((file) => {
        const parts = file.split("_");
        const dateStr = parts[2]?.split(".")[0];
        return dateStr && dateStr === fromDateStr;
      });

      let firstImagePath = null;
      if (fromDateFiles.length > 0) {
        const selectedFile = fromDateFiles[fromDateFiles.length - 1];
        firstImagePath = `${dirUri}${selectedFile}`;
        setFoundImages((prevState) => ({
          ...prevState,
          firstImage: firstImagePath,
        }));
      } else {
        setFoundImages((prevState) => ({
          ...prevState,
          firstImage: null,
        }));
      }

      const toDateFiles = filteredFiles.filter((file) => {
        const parts = file.split("_");
        const dateStr = parts[2]?.split(".")[0];
        return dateStr && dateStr === toDateStr;
      });

      let secondImagePath = null;
      if (toDateFiles.length > 0) {
        const selectedFile = toDateFiles[toDateFiles.length - 1];
        secondImagePath = `${dirUri}${selectedFile}`;
        setFoundImages((prevState) => ({
          ...prevState,
          secondImage: secondImagePath,
        }));
      } else {
        setFoundImages((prevState) => ({
          ...prevState,
          secondImage: null,
        }));
      }

      const slideshowArray = [];

      if (firstImagePath) {
        slideshowArray.push({
          uri: firstImagePath,
          date: `${fromDateStr.slice(8, 10)}/${fromDateStr.slice(
            5,
            7
          )}/${fromDateStr.slice(0, 4)}`,
        });
      }

      if (secondImagePath && secondImagePath !== firstImagePath) {
        slideshowArray.push({
          uri: secondImagePath,
          date: `${toDateStr.slice(8, 10)}/${toDateStr.slice(
            5,
            7
          )}/${toDateStr.slice(0, 4)}`,
        });
      }

      setSlideshowImages(slideshowArray);
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to load Images",
      });
    }
  };

  const submitDates = () => {
    if (!fromDate || !toDate) {
      alert("Please select both dates");
      return;
    }

    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "User not authenticated. Please login again.",
      });
      return;
    }

    setSubmittedDates({
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
    });
  };

  useEffect(() => {
    if (submittedDates && clientId) {
      setFoundImages({
        firstImage: null,
        secondImage: null,
      });
      findImages();
    }
  }, [submittedDates, clientId]);

  const generateFilename = () => {
    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Client ID not found. Cannot save image.",
      });
      return null;
    }

    const randomId = Math.random().toString().slice(2, 10);
    const date = toIndianISOString(new Date()).split("T")[0];
    return `${clientId}_${randomId}_${date}.jpg`;
  };

  const setupImageDirectory = async () => {
    const dirUri = `${FileSystem.documentDirectory}FittbotImages/`;
    const dirInfo = await FileSystem.getInfoAsync(dirUri);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }

    return dirUri;
  };

  const handleImageUpload = async () => {
    setWorkoutCompletionVisible(false);

    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "User not authenticated. Please login again.",
      });
      return;
    }

    try {
      // Request camera permissions with proper error handling
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (cameraStatus !== "granted") {
        showToast({
          type: "error",
          title: "Camera Permission Required",
          desc: "Please enable camera permissions in your device settings to take photos.",
        });
        setWorkoutCompletionVisible(true);
        return;
      }

      // For iOS, also request media library permissions
      if (Platform.OS === "ios") {
        const { status: mediaLibraryStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus !== "granted") {
        }
      }

      const dirUri = await setupImageDirectory();
      const newFilename = generateFilename();

      if (!newFilename) {
        setWorkoutCompletionVisible(true);
        return;
      }

      const newFileUri = `${dirUri}${newFilename}`;

      // Enhanced camera options for better iOS compatibility
      const cameraOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Set to false for better iOS compatibility
        aspect: [4, 3],
        quality: Platform.OS === "ios" ? 0.7 : 0.8,
        base64: false, // Set to false to reduce memory usage
        exif: false, // Disable EXIF data for faster processing
      };

      // Add iOS-specific options
      if (Platform.OS === "ios") {
        cameraOptions.presentationStyle =
          ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN;
      }

      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        // Delete previous image if exists
        if (image) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(image);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(image);
            }
          } catch (deleteError) {}
        }

        // Copy the image to our directory
        try {
          await FileSystem.copyAsync({
            from: selectedAsset.uri,
            to: newFileUri,
          });

          setImage(newFileUri);

          showToast({
            type: "success",
            title: "Success",
            desc: "Photo captured successfully!",
          });
        } catch (copyError) {
          console.error("Error copying image:", copyError);
          showToast({
            type: "error",
            title: "Error",
            desc: "Failed to save the image. Please try again.",
          });
        }
      } else {
      }
    } catch (error) {
      console.error("Camera error:", error);

      let errorMessage = "Failed to open camera. Please try again.";

      // Provide specific error messages based on the error
      if (error.message?.includes("permission")) {
        errorMessage =
          "Camera permission is required. Please enable it in Settings.";
      } else if (error.message?.includes("unavailable")) {
        errorMessage = "Camera is not available on this device.";
      } else if (error.message?.includes("cancelled")) {
        errorMessage = "Camera was cancelled.";
      }

      showToast({
        type: "error",
        title: "Camera Error",
        desc: errorMessage,
      });
    } finally {
      setWorkoutCompletionVisible(true);
    }
  };

  const openFullscreen = (imageUri) => {
    setFullscreenImage(imageUri);
    setFullscreenVisible(true);
  };

  const startSlideshow = () => {
    if (slideshowImages.length === 0) {
      showToast({
        type: "error",
        title: "Error",
        desc: "No Images found for slideshow",
      });
      return;
    }

    setCurrentSlideIndex(0);
    setSlideshowActive(true);
  };

  const animateProgressBar = () => {
    progressAnimation.setValue(0);
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: slideDuration,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (slideshowActive) {
      animateProgressBar();

      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
      }

      slideshowTimerRef.current = setTimeout(() => {
        if (currentSlideIndex < slideshowImages.length - 1) {
          setCurrentSlideIndex(currentSlideIndex + 1);
        } else {
          setSlideshowActive(false);
        }
      }, slideDuration);
    }

    return () => {
      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
      }
    };
  }, [slideshowActive, currentSlideIndex]);

  const getMaxDate = () => {
    return new Date();
  };

  // Check if both images are found
  const bothImagesFound = foundImages.firstImage && foundImages.secondImage;

  return (
    <SafeAreaView style={styles.container} edges={["right", "bottom", "left"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <LinearGradient
            colors={["rgba(41,125,179,0.09)", "rgba(41,125,179,0.09)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearHeader}
          >
            <Text style={styles.mainHeader}>Transformation Journey</Text>
          </LinearGradient>

          <View style={styles.dateSelectionCard}>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={handleFromDatePress}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#297DB3"
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>
                  {fromDate ? formatDate(fromDate) : "From Date"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={handleToDatePress}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#297DB3"
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>
                  {toDate ? formatDate(toDate) : "To Date"}
                </Text>
              </TouchableOpacity>
            </View>
            {!submittedDates && (
              <Text style={styles.dateHelperText}>
                Select two dates to see your transformation
              </Text>
            )}

            {/* iOS Date Picker Modal */}
            {Platform.OS === "ios" && (showFromPicker || showToPicker) && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showFromPicker || showToPicker}
                onRequestClose={dismissIOSPicker}
              >
                <View style={styles.iosPickerContainer}>
                  <View style={styles.iosPickerModal}>
                    <View style={styles.iosPickerHeader}>
                      <TouchableOpacity
                        onPress={dismissIOSPicker}
                        style={styles.iosPickerButton}
                      >
                        <Text style={styles.iosPickerButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.iosPickerTitle}>
                        Select {iosPickerMode === "from" ? "From" : "To"} Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          // Force trigger onChange with 'set' type to close picker
                          if (iosPickerMode === "from") {
                            onFromDateChange(
                              { type: "set" },
                              fromDate || new Date()
                            );
                          } else {
                            onToDateChange(
                              { type: "set" },
                              toDate || new Date()
                            );
                          }
                        }}
                        style={styles.iosPickerButton}
                      >
                        <Text
                          style={[
                            styles.iosPickerButtonText,
                            styles.iosPickerDoneButton,
                          ]}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={
                        iosPickerMode === "from"
                          ? fromDate || new Date()
                          : toDate || new Date()
                      }
                      mode="date"
                      display="spinner"
                      themeVariant="light"
                      textColor="#000000"
                      maximumDate={getMaxDate()}
                      onChange={
                        iosPickerMode === "from"
                          ? onFromDateChange
                          : onToDateChange
                      }
                    />
                  </View>
                </View>
              </Modal>
            )}

            {/* Android Date Picker */}
            {Platform.OS === "android" && showFromPicker && (
              <DateTimePicker
                value={fromDate || new Date()}
                mode="date"
                display="default"
                themeVariant="light"
                textColor="#000000"
                maximumDate={getMaxDate()}
                onChange={onFromDateChange}
              />
            )}

            {Platform.OS === "android" && showToPicker && (
              <DateTimePicker
                value={toDate || new Date()}
                mode="date"
                display="default"
                themeVariant="light"
                textColor="#000000"
                maximumDate={getMaxDate()}
                onChange={onToDateChange}
              />
            )}
          </View>

          {/* Show selected dates text when dates are submitted */}

          {(!submittedDates || (fromDate && toDate)) && (
            <TouchableOpacity onPress={submitDates}>
              <LinearGradient
                colors={["#297DB3", "#183243"]}
                start={[0, 0]}
                end={[1, 0]}
                style={[
                  styles.submitButton,
                  fromDate && toDate
                    ? styles.submitButtonActive
                    : styles.submitButtonInactive,
                ]}
              >
                <Text style={styles.submitButtonText}>View Transformation</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {submittedDates && (
            <View style={styles.selectedDatesContainer}>
              <Text style={styles.selectedDatesText}>
                You have selected{" "}
                <Text style={styles.selectedDatesHighlight}>
                  {submittedDates.fromDate}
                </Text>{" "}
                To{" "}
                <Text style={styles.selectedDatesHighlight}>
                  {submittedDates.toDate}
                </Text>
              </Text>
            </View>
          )}

          {submittedDates && (
            <View style={{ backgroundColor: "#FFFFFF", width: "100%" }}>
              {/* Show slideshow button and images only if both images are found */}
              {bothImagesFound && (
                <>
                  <View style={styles.slideshowContainer}>
                    <TouchableOpacity
                      onPress={startSlideshow}
                      style={styles.arrowButton}
                    >
                      <Text style={styles.slideshowText}>
                        View as Slideshow
                      </Text>
                      <MaterialIcons
                        name="slideshow"
                        size={16}
                        color="#297DB3"
                        style={{ marginLeft: 5 }}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.imagesSection}>
                    <TouchableOpacity
                      style={styles.imageWrapper}
                      onPress={() =>
                        foundImages.firstImage &&
                        openFullscreen(foundImages.firstImage)
                      }
                    >
                      <Text style={styles.imageLabel}>
                        {submittedDates.fromDate}
                      </Text>
                      <Image
                        source={{ uri: foundImages.firstImage }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.imageWrapper}
                      onPress={() =>
                        foundImages.secondImage &&
                        openFullscreen(foundImages.secondImage)
                      }
                    >
                      <Text style={styles.imageLabel}>
                        {submittedDates.toDate}
                      </Text>
                      <Image
                        source={{ uri: foundImages.secondImage }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Show no images found message if at least one image is missing */}
              {!bothImagesFound && (
                <View style={styles.noImagesFoundContainer}>
                  <Image
                    source={require("../../assets/images/workout/cam.png")}
                    style={{ width: 45, height: 45 }}
                  />

                  <Text style={styles.noImagesFoundText}>
                    No images found on selected date range
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.uploadSection}>
            <LinearGradient
              colors={["rgba(41,125,179,0.09)", "rgba(41,125,179,0.09)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.linearHeader}
            >
              <Text style={styles.mainHeader}>Upload Image for Today</Text>
            </LinearGradient>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setWorkoutCompletionVisible(true)}
            >
              <LinearGradient
                colors={["#F8F8F8", "#F8F8F8"]}
                style={styles.uploadGradient}
              >
                <View style={styles.uploadIconContainer}>
                  {/* <Ionicons name="camera" size={40} color="#fff" />
                  <View style={styles.plusIconOverlay}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </View> */}
                  <Image
                    source={require("../../assets/images/workout/camera.png")}
                    style={{ width: 38, height: 35 }}
                  />
                </View>
                <Text style={styles.uploadText}>Upload pictures</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={fullscreenVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullscreenVisible(false)}
        >
          <TouchableOpacity
            style={styles.fullscreenContainer}
            activeOpacity={1}
            onPress={() => setFullscreenVisible(false)}
          >
            <StatusBar hidden />
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullscreenVisible(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={slideshowActive}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSlideshowActive(false)}
        >
          <View style={styles.slideshowModalContainer}>
            <StatusBar hidden />
            <View style={styles.progressContainer}>
              {slideshowImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBarBackground,
                    index < currentSlideIndex
                      ? styles.progressBarCompleted
                      : null,
                  ]}
                >
                  {index === currentSlideIndex && (
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width: progressAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {slideshowImages.length > 0 &&
              currentSlideIndex < slideshowImages.length && (
                <View style={styles.slideshowContent}>
                  <Text style={styles.slideshowDate}>
                    {slideshowImages[currentSlideIndex].date}
                  </Text>
                  <Image
                    source={{ uri: slideshowImages[currentSlideIndex].uri }}
                    style={styles.slideshowImage}
                    resizeMode="contain"
                  />
                </View>
              )}

            <View style={styles.slideshowControls}>
              <TouchableOpacity
                style={styles.slideshowControlLeft}
                activeOpacity={1}
                onPress={() => {
                  if (currentSlideIndex > 0) {
                    setCurrentSlideIndex(currentSlideIndex - 1);
                  }
                }}
              />

              <TouchableOpacity
                style={styles.slideshowControlRight}
                activeOpacity={1}
                onPress={() => {
                  if (currentSlideIndex < slideshowImages.length - 1) {
                    setCurrentSlideIndex(currentSlideIndex + 1);
                  } else {
                    setSlideshowActive(false);
                  }
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSlideshowActive(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>

        <WorkoutCompletionModal
          visible={workoutCompletionVisible}
          onClose={() => {
            setWorkoutCompletionVisible(false);
            setImage(null);
          }}
          onAddImage={handleImageUpload}
          image={image}
          type={"transformation"}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const additionalStyles = StyleSheet.create({
  iosPickerContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  iosPickerModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  iosPickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#183243",
  },
  iosPickerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  iosPickerButtonText: {
    fontSize: 16,
    color: "#297DB3",
  },
  iosPickerDoneButton: {
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  contentWrapper: {
    flex: 1,
    alignItems: "center",
    // paddingHorizontal: width * 0.05,
    paddingTop: 30,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#183243",
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  linearHeader: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 15,
    borderRadius: 5,
  },
  mainHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: "#070707",
  },
  dateSelectionCard: {
    width: "100%",
    marginBottom: height * 0.02,
    paddingHorizontal: 16,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: height * 0.015,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: height * 0.016,
    paddingHorizontal: width * 0.03,
    marginHorizontal: width * 0.01,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    color: "#183243",
    fontSize: width * 0.035,
  },
  dateHelperText: {
    color: "#888",
    fontSize: width * 0.035,
    textAlign: "center",
    marginTop: 5,
  },
  selectedDatesContainer: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  selectedDatesText: {
    fontSize: width * 0.03,
    color: "#666",
    textAlign: "center",
  },
  selectedDatesHighlight: {
    color: "#297DB3",
    fontWeight: "600",
  },
  slideshowContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  slideshowText: {
    fontSize: 14,
    backgroundColor: "transparent",
    fontWeight: "500",
    color: "#297DB3",
  },
  arrowButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
  },
  submitButton: {
    width: width * 0.9,
    borderRadius: 8,
    paddingVertical: height * 0.015,
    alignItems: "center",
    marginBottom: 0,
  },
  submitButtonActive: {
    opacity: 1,
  },
  submitButtonInactive: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
  },
  imagesSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: height * 0.02,
  },
  imageWrapper: {
    width: "48%",
    borderRadius: 10,
    overflow: "hidden",
    height: height * 0.25,
  },
  imageLabel: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: width * 0.03,
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  noImageText: {
    color: "#666",
    textAlign: "center",
    fontSize: width * 0.035,
  },
  noImagesFoundContainer: {
    width: "100%",
    height: height * 0.22,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: height * 0.02,
    position: "relative",
  },
  noImagesIcon: {
    marginBottom: 0,
  },

  noImagesFoundText: {
    color: "#666",
    fontSize: width * 0.03,
    textAlign: "center",
    marginTop: 10,
  },
  uploadSection: {
    width: "100%",
    marginTop: height * 0.02,
    marginBottom: height * 0.04,
  },
  uploadTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#183243",
    marginBottom: 15,
  },
  uploadButton: {
    width: "70%",
    height: height * 0.2,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E9E9E9",
    margin: "auto",
    marginTop: 35,
  },
  uploadGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },
  uploadIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  plusIconOverlay: {
    position: "absolute",
    right: -3.5,
    top: -5,
    backgroundColor: "#297DB3",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    marginBottom: 8,
  },
  uploadText: {
    color: "#454545",
    fontSize: 14,
    fontWeight: "400",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  slideshowModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 5,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  progressBarCompleted: {
    backgroundColor: "#fff",
  },
  slideshowContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slideshowDate: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    fontSize: 16,
    zIndex: 2,
  },
  slideshowImage: {
    width: width,
    height: height * 0.8,
  },
  slideshowControls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  slideshowControlLeft: {
    width: "30%",
    height: "100%",
  },
  slideshowControlRight: {
    width: "70%",
    height: "100%",
  },
  ...additionalStyles,
});

export default TransformationPage;
