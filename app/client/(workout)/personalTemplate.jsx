import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  FlatList,
  Modal,
  Platform,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import {
  addClientWrokoutTemplateAPI,
  deleteClientWorkoutTemplateAPI,
  editClientWorkoutTemplateNameAPI,
  getWorkoutTemplateClientAPI,
  getFittbotWorkoutAPI,
} from "../../../services/clientApi";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import TemplateModal from "../../../components/ui/Workout/templateModal";
import TemplateList from "../../../components/ui/Workout/templateList";
import { showToast } from "../../../utils/Toaster";
import SkeletonWorkout from "../../../components/ui/Workout/skeletonWorkout";
import KyraAIFloatingButton from "../../../components/ui/Workout/kyraAI";
import { useUser } from "../../../context/UserContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const scale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

const personalTemplate = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTemplateModal, setEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [exerciseData, setExerciseData] = useState({});
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState(null);
  const [gender, setGender] = useState(null);
  const [showKyraMessage, setShowKyraMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sideBarData, profile } = useUser();

  const fetchFittbotWorkouts = async () => {
    const clientId = await AsyncStorage.getItem("client_id");
    if (!clientId) {
      console.error("No client_id found");
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
      return;
    }
    try {
      const response = await getFittbotWorkoutAPI(clientId);

      if (response?.status === 200) {
        const exerciseData = response.data.exercise_data;

        setExerciseData(exerciseData);
        setMuscleGroups(Object.keys(exerciseData));
      } else {
        console.error("Failed to fetch workouts:", response?.detail);
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const getGender = async () => {
    setGender(await AsyncStorage.getItem("gender"));
  };

  useEffect(() => {
    getGender();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        router.push({
          pathname: "/client/workout",
          params: { workoutTab: "+Add" },
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const createTemplate = async (templateName) => {
    if (!templateName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter template name",
      });
      return;
    }
    const clientId = await AsyncStorage.getItem("client_id");
    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
    const newTemplate = {
      template_name: templateName,
      exercise_data: {},
      client_id: clientId,
    };
    try {
      const response = await addClientWrokoutTemplateAPI(newTemplate);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message,
        });
        getTemplates();
        setModalVisible(false);
        router.push({
          pathname: "/client/AddExerciseToTemplate",
          params: {
            template: JSON.stringify(response?.data),
            workouts: JSON.stringify(exerciseData),
          },
        });
      } else {
        alert(
          response?.detail || "Something went wrong. Please try again later"
        );
        // showToast({
        //   type: "error",
        //   title: "Error",
        //   desc:
        //     response?.detail || "Something went wrong. Please try again later",
        // });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const editTemplate = async (templateName) => {
    if (!templateName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter template name",
      });
      return;
    }
    const payload = {
      id: editingTemplate.id,
      template_name: templateName,
    };

    try {
      const response = await editClientWorkoutTemplateNameAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message,
        });
        getTemplates();
        setEditTemplateModal(false);
        setEditingTemplate(null);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
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

  const showCustomAlert = (title, message, onConfirm = null) => {
    setConfirmAction({
      title,
      message,
      onConfirm,
    });
    setShowConfirmModal(true);
  };

  const handleDeleteTemplate = (templateId, templateName) => {
    showCustomAlert(
      "Delete Template",
      `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
      () => confirmDeleteTemplate(templateId)
    );
  };

  const confirmDeleteTemplate = async (templateId) => {
    try {
      const response = await deleteClientWorkoutTemplateAPI(templateId);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Template Deleted Successfully",
        });
        setCurrentTemplate(null);
        getTemplates();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
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

  const getTemplates = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const response = await getWorkoutTemplateClientAPI(clientId);

      if (response?.status === 200) {
        setTemplates(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
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

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Use Promise.allSettled to ensure all promises complete even if some fail
        const results = await Promise.allSettled([
          getTemplates(),
          fetchFittbotWorkouts(),
          checkKyraMessageDisplay(),
        ]);

        // Log results for debugging
        results.forEach((result, index) => {
          const names = [
            "getTemplates",
            "fetchFittbotWorkouts",
            "checkKyraMessageDisplay",
          ];
          if (result.status === "rejected") {
            console.error(`${names[index]} failed:`, result.reason);
          } else {
          }
        });
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const checkKyraMessageDisplay = async () => {
    try {
      const lastShownTime = await AsyncStorage.getItem(
        "kyra_workout_template_message_time"
      );
      const currentTime = Date.now();
      const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      if (!lastShownTime || currentTime - parseInt(lastShownTime) > sixHours) {
        setShowKyraMessage(true);
        await AsyncStorage.setItem(
          "kyra_workout_template_message_time",
          currentTime.toString()
        );
      } else {
        setShowKyraMessage(false);
      }
    } catch (error) {
      console.error("Error checking Kyra message display:", error);
      setShowKyraMessage(true);
    }
  };

  const handleTemplateSelect = useCallback(
    (currentTemplate) => {
      if (currentTemplate && currentTemplate.exercise_data) {
        router.push({
          pathname: "/client/exercise",
          params: {
            templateId: currentTemplate.id,
            templateName: currentTemplate.name,
            templateExercises: JSON.stringify(
              Object.keys(currentTemplate.exercise_data)
            ),
            myTemplateExercise: JSON.stringify(currentTemplate.exercise_data),
            isTemplate: true,
            gender: gender,
          },
        });
      }
    },
    [gender, router]
  );

  const handleKyraAIPress = useCallback(() => {
    router.push({
      pathname: "/client/(workout)/kyraAI",
      params: {
        profileImage: profile,
        userName: sideBarData?.userName,
        source: "workoutTemplate",
      },
    });
  }, [profile, sideBarData?.userName, router]);

  const handleAddWorkout = useCallback(
    async (newtemplate) => {
      // Check if exerciseData is available BEFORE setting isNavigating
      if (!exerciseData || Object.keys(exerciseData).length === 0) {
        console.warn("Exercise data not loaded, fetching now...");
        showToast({
          type: "info",
          title: "Loading",
          desc: "Loading exercise data...",
        });

        // Wait for the data to be fetched - use API response directly
        const clientId = await AsyncStorage.getItem("client_id");
        if (!clientId) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Unable to load exercise data. Please try again.",
          });
          return;
        }

        try {
          const response = await getFittbotWorkoutAPI(clientId);
          if (response?.status === 200 && response.data.exercise_data) {
            const freshExerciseData = response.data.exercise_data;

            // Set isNavigating only right before navigation
            setIsNavigating(true);

            // Navigate with the fresh data
            const targetPath = Object.keys(newtemplate.exercise_data)?.length !== 0
              ? "/client/addExerciseTemplate"
              : "/client/AddExerciseToTemplate";

            router.push({
              pathname: targetPath,
              params: {
                template: JSON.stringify(newtemplate),
                workouts: JSON.stringify(freshExerciseData),
              },
            });

            // Reset immediately after navigation call
            setIsNavigating(false);
            return;
          } else {
            showToast({
              type: "error",
              title: "Error",
              desc: "Unable to load exercise data. Please try again.",
            });
            return;
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Something went wrong. Please try again.",
          });
          return;
        }
      }

      // Data is already available - set isNavigating only right before navigation
      setIsNavigating(true);

      // Navigate with available data
      const targetPath = Object.keys(newtemplate.exercise_data)?.length !== 0
        ? "/client/addExerciseTemplate"
        : "/client/AddExerciseToTemplate";

      router.push({
        pathname: targetPath,
        params: {
          template: JSON.stringify(newtemplate),
          workouts: JSON.stringify(exerciseData),
        },
      });

      // Reset immediately after navigation call
      setIsNavigating(false);
    },
    [exerciseData, router]
  );

  const handleDeleteTemplateCallback = useCallback(
    (templateId, templateName) => {
      handleDeleteTemplate(templateId, templateName);
    },
    []
  );

  const renderTemplateItem = useCallback(
    ({ item: template }) => (
      <TemplateList
        template={template}
        setCurrentTemplate={setCurrentTemplate}
        openEditModal={(templateToEdit) => {
          setEditingTemplate(templateToEdit);
          setEditTemplateModal(true);
        }}
        deleteTemplate={() =>
          handleDeleteTemplateCallback(template.id, template.name)
        }
        handleAddWorkout={() => handleAddWorkout(template)}
        handleTemplateSelect={() => handleTemplateSelect(template)}
      />
    ),
    [handleDeleteTemplateCallback, handleAddWorkout, handleTemplateSelect]
  );

  if (isLoading) {
    return <SkeletonWorkout header={false} priority="high" />;
  }

  if (templates.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={[styles.backButtonContainer, { paddingTop: insets.top + 10 }]}
          onPress={() => {
            router.push("/client/(tabs)/workout");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Personal Workout</Text>
        </TouchableOpacity>
        <EmptyStateCard
          imageSource={require("../../../assets/images/workout/WORKOUT_CAT_V001.png")}
          onButtonPress={() => setModalVisible(true)}
          message={
            "You haven't created any workout template yet! \nTap below to create your routine and own the day."
          }
          buttonText="Start Fresh"
        />

        <TemplateModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={createTemplate}
          mode="create"
        />

        <KyraAIFloatingButton
          onPress={handleKyraAIPress}
          position="bottom-right"
          size="small"
          showBadge={false}
          colors={["#78CAFF", "#297DB3"]}
          style={{ bottom: Platform.OS === "ios" ? 190 : 130 }}
          message={
            showKyraMessage
              ? "Hi, I'm KyraAI\nI can help you create personalized templates instantly"
              : ""
          }
          boxColor={["#78CAFF", "#297DB3"]}
        />
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.sectionContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            router.push("/client/(tabs)/workout");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Personal Workout</Text>
        </TouchableOpacity>
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: width * 0.04 }}
          renderItem={renderTemplateItem}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />

        {/* Loading Overlay */}
        {isNavigating && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#297DB3" />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          </View>
        )}
        <TemplateModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={createTemplate}
          mode="create"
        />

        <TemplateModal
          visible={editTemplateModal}
          onClose={() => {
            setEditTemplateModal(false);
            setEditingTemplate(null);
          }}
          onSubmit={(newName) => {
            editTemplate(newName);
          }}
          initialValue={editingTemplate?.name}
          mode="edit"
        />

        {/* Custom Confirmation Modal */}
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <View style={styles.confirmIconContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={48}
                  color="#DC2626"
                />
              </View>

              <Text style={styles.confirmTitle}>{confirmAction?.title}</Text>
              <Text style={styles.confirmMessage}>
                {confirmAction?.message}
              </Text>

              <View style={styles.confirmButtonsContainer}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelConfirmButton]}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.cancelConfirmButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmConfirmButton]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    confirmAction?.onConfirm();
                  }}
                >
                  <Text style={styles.confirmConfirmButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <KyraAIFloatingButton
          onPress={handleKyraAIPress}
          position="bottom-right" // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
          size="small" // 'small', 'medium', 'large'
          showBadge={false}
          // badgeText="NEW"
          colors={["#78CAFF", "#297DB3"]} // Custom gradient colors
          style={{ bottom: Platform.OS === "ios" ? 190 : 130 }} // Additional custom positioning
          message={
            showKyraMessage
              ? "Hi, I'm KyraAI\nI can help you create personalized templates instantly"
              : ""
          }
          boxColor={["#78CAFF", "#297DB3"]}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={["#297DB3", "#183243"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveButton, { width: "60%" }]}
            >
              <Text style={styles.saveButtonText}>+ Add Template Manually</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default personalTemplate;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: height * 0.02,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  templateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  templateTitle: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: "#183243",
  },
  muscleGroupText: {
    marginTop: 8,
    color: "#888",
    fontSize: 13,
  },
  dropdown: {
    backgroundColor: "#f9f9f9",
    position: "absolute",
    top: 40,
    right: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 6,
    zIndex: 99,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: scale(15),
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 8,
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    marginBottom: scale(15),
    textAlign: "center",
    color: "#FF5757",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    marginBottom: scale(10),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(10),
    fontSize: scale(14),
  },
  modalButton: {
    backgroundColor: "#FF5757",
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: scale(10),
  },
  modalButtonText: {
    color: "white",
    fontSize: scale(16),
    fontWeight: "600",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "85%",
    maxWidth: 380,
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmButtonsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelConfirmButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  confirmConfirmButton: {
    backgroundColor: "#DC2626",
  },
  cancelConfirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  confirmConfirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#297DB3",
  },
});
