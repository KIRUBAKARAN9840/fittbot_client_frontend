import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const scale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

const AddExerciseToTemplate = () => {
  const { template, workouts } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const parsedTemplate = template ? JSON.parse(template) : {};
  const router = useRouter();

  // Parse and validate muscle groups data
  let muscleGroupsData = {};
  try {
    muscleGroupsData = workouts ? JSON.parse(workouts) : {};
  } catch (error) {
    console.error("Error parsing workouts:", error);
    muscleGroupsData = {};
  }

  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedExercises, setSelectedExercises] = useState(() => {
    return parsedTemplate.exercise_data || {};
  });

  useEffect(() => {
    if (muscleGroupsData && typeof muscleGroupsData === "object" && Object.keys(muscleGroupsData).length > 0) {
      const groupNames = Object.keys(muscleGroupsData);
      setMuscleGroups(groupNames);
    } else {
      console.warn("No muscle groups data available");
      setMuscleGroups([]);
    }
  }, []);

  const filteredMuscleGroups = muscleGroups.filter((group) =>
    group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExerciseSelected = (muscleGroup, exerciseName) => {
    if (!selectedExercises[muscleGroup]) return false;

    return selectedExercises[muscleGroup].exercises.some(
      (exercise) => exercise.name === exerciseName
    );
  };

  const handleExerciseToggle = (exercise) => {
    if (!selectedMuscleGroup) return;

    setSelectedExercises((prev) => {
      const updatedExercises = { ...prev };

      if (!updatedExercises[selectedMuscleGroup]) {
        updatedExercises[selectedMuscleGroup] = {
          isCardio: muscleGroupsData[selectedMuscleGroup]?.isCardio || false,
          exercises: [],
          imagePath: muscleGroupsData[selectedMuscleGroup]?.imgPath || null,
          isMuscleGroup:
            muscleGroupsData[selectedMuscleGroup]?.isMuscleGroup || true,
        };
      }

      const existingExerciseIndex = updatedExercises[
        selectedMuscleGroup
      ].exercises.findIndex((ex) => ex.name === exercise.name);

      if (existingExerciseIndex >= 0) {
        updatedExercises[selectedMuscleGroup].exercises.splice(
          existingExerciseIndex,
          1
        );

        if (updatedExercises[selectedMuscleGroup].exercises.length === 0) {
          delete updatedExercises[selectedMuscleGroup];
        }
      } else {
        updatedExercises[selectedMuscleGroup].exercises.push(exercise);
      }

      return updatedExercises;
    });
  };

  const handleMuscleGroupSelect = (muscleGroup) => {
    setSelectedMuscleGroup(muscleGroup);
    setModalVisible(false);
    setSearchQuery("");
  };

  const saveSelectedExercises = () => {
    const updatedTemplate = {
      ...parsedTemplate,
      exercise_data: selectedExercises,
    };

    router.push({
      pathname: "/client/addExerciseTemplate",
      params: {
        template: JSON.stringify(updatedTemplate),
        workouts: JSON.stringify(muscleGroupsData),
      },
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <HardwareBackHandler
        routePath="/client/(workout)/personalTemplate"
        enabled={true}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => router.push("/client/(workout)/personalTemplate")}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {parsedTemplate.name || "Add Workout"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.muscleGroupSelector}
          onPress={() => {
            setModalVisible(true);
          }}
        >
          <Text
            style={[
              styles.muscleGroupText,
              !selectedMuscleGroup && styles.placeholderText,
            ]}
          >
            {selectedMuscleGroup || "Select the Muscle Group"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Muscle Group Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Muscle Group</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Muscle Group"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.sectionTitle}>Choose muscle group</Text>

            <ScrollView
              style={styles.muscleGroupList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredMuscleGroups.length > 0 ? (
                filteredMuscleGroups.map((muscleGroup, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.muscleGroupItem}
                    onPress={() => handleMuscleGroupSelect(muscleGroup)}
                  >
                    <Text style={styles.muscleGroupItemText}>
                      {muscleGroup}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    {searchQuery
                      ? "No muscle groups found"
                      : muscleGroups.length === 0
                      ? "No muscle groups available. Please try again."
                      : "Loading muscle groups..."}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.exerciseList}
        showsVerticalScrollIndicator={false}
      >
        {selectedMuscleGroup &&
          muscleGroupsData[selectedMuscleGroup]?.exercises.map(
            (exercise, index) => {
              const isSelected = isExerciseSelected(
                selectedMuscleGroup,
                exercise.name
              );

              return (
                <TouchableOpacity
                  key={`${exercise.name}-${index}`}
                  onPress={() => handleExerciseToggle(exercise)}
                >
                  <View style={styles.exerciseItem}>
                    <Image
                      source={exercise?.imgPath}
                      style={{
                        width: 75,
                        height: 75,
                        marginRight: 10,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleWorkoutButton,
                        isSelected
                          ? styles.removeWorkoutButton
                          : styles.addWorkoutButton,
                      ]}
                      onPress={() => handleExerciseToggle(exercise)}
                    >
                      <LinearGradient
                        colors={
                          !isSelected
                            ? ["#297DB3", "#183243"]
                            : ["#E63946", "#D90429"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.gradientButton,
                          {
                            width: "100%",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.toggleWorkoutText,
                            isSelected
                              ? styles.removeWorkoutText
                              : styles.addWorkoutText,
                          ]}
                        >
                          {isSelected ? "-" : "+"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        <View style={styles.bottomSpace} />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSelectedExercises}
        >
          <LinearGradient
            colors={["#297DB3", "#183243"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradientButton,
              {
                width: "60%",
                paddingVertical: 2,
                paddingHorizontal: 15,
                height: 40,
                borderRadius: 8,
              },
            ]}
          >
            <Text style={styles.saveButtonText}>Add Selected Exercises</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: width * 0.04,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: height * 0.02,
    paddingBottom: 15,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    paddingHorizontal: width * 0.05,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  dropdownContainer: {
    marginHorizontal: width * 0.05,
    marginVertical: height * 0.02,
  },
  muscleGroupSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  muscleGroupText: {
    fontSize: scale(16),
    color: "#1A202C",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: width * 0.85,
    height: height * 0.7,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A202C",
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 3,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A202C",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  muscleGroupList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  muscleGroupItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    minHeight: 50,
  },
  muscleGroupItemText: {
    fontSize: 16,
    color: "#1A202C",
    fontWeight: "500",
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // Existing styles continue...
  exerciseList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 1,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2980B917",
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    paddingLeft: 10,
    paddingVertical: height * 0.01,
    marginBottom: height * 0.01,
  },
  exerciseName: {
    fontSize: scale(14),
    color: "#1A202C",
    flex: 1,
    marginRight: width * 0.02,
  },
  toggleWorkoutButton: {
    width: width * 0.08,
    borderRadius: 50,
  },
  gradientButton: {
    borderRadius: 50,
    width: width * 0.08,
    height: width * 0.08,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleWorkoutText: {
    fontSize: scale(20),
    fontWeight: "600",
  },
  addWorkoutText: {
    color: "#FFFFFF",
  },
  removeWorkoutText: {
    color: "#FFFFFF",
  },
  buttonContainer: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  saveButton: {
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "600",
  },
  bottomSpace: {
    height: height * 0.1,
  },
});

export default AddExerciseToTemplate;
