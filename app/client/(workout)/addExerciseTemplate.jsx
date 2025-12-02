import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { editClientWorkoutTemplateExerciseAPI } from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import { safeParseJSON } from "../../../utils/safeHelpers";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const scale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

const AddExerciseTemplate = () => {
  const { template, workouts } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Parse and validate exercise data
  const exerciseData = safeParseJSON(workouts, {});
  const parsedTemplate = safeParseJSON(template, {});
  const [templateExercises, setTemplateExercises] = useState(
    parsedTemplate.exercise_data || {}
  );
  const [currentTemplate, setCurrentTemplate] = useState(parsedTemplate);
  const router = useRouter();

  useEffect(() => {
    if (parsedTemplate) {
      setCurrentTemplate(parsedTemplate);
      setTemplateExercises(parsedTemplate.exercise_data || {});
    }
  }, [template]);

  const deleteExercise = (muscleGroup, exerciseIndex) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedExercises = { ...templateExercises };
            updatedExercises[muscleGroup].exercises.splice(exerciseIndex, 1);

            if (updatedExercises[muscleGroup].exercises.length === 0) {
              delete updatedExercises[muscleGroup];
            }

            setTemplateExercises(updatedExercises);
          },
        },
      ]
    );
  };

  const saveExercises = async () => {
    const payload = {
      id: currentTemplate.id,
      exercise_data: templateExercises,
    };
    // console.log(JSON.stringify(payload));

    try {
      const response = await editClientWorkoutTemplateExerciseAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message || "Workout saved successfully",
        });
        router.push("/client/personalTemplate");
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

  const handleAddWorkout = () => {
    router.push({
      pathname: "/client/AddExerciseToTemplate",
      params: {
        template: JSON.stringify(parsedTemplate),
        workouts: JSON.stringify(exerciseData),
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
          onPress={() => {
            router.push("/client/(workout)/personalTemplate");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>{parsedTemplate.name}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleAddWorkout} style={styles.addButton}>
        <MaskedView
          maskElement={
            <View style={styles.buttonContentWrapper}>
              <Text style={styles.addButtonText}>+ Add Workout</Text>
            </View>
          }
        >
          <LinearGradient
            colors={["#297DB3", "#183243"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBackground}
          >
            <View style={styles.buttonContentWrapper}>
              <Ionicons
                name="add-circle"
                size={20}
                color="#000"
                style={{ opacity: 0 }}
              />
              <Text style={[styles.addButtonText, { opacity: 0 }]}>
                + Add Workout
              </Text>
            </View>
          </LinearGradient>
        </MaskedView>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(templateExercises).map((muscleGroup) => (
          <View key={muscleGroup} style={styles.muscleGroupSection}>
            <Text style={styles.muscleGroupTitle}>{muscleGroup}</Text>
            {templateExercises[muscleGroup].exercises.map((exercise, index) => (
              <View
                key={`${exercise.name}-${index}`}
                style={styles.exerciseItem}
              >
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <TouchableOpacity
                  onPress={() => deleteExercise(muscleGroup, index)}
                >
                  <Ionicons name="trash" size={20} color="#297DB3" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveExercises}>
          <LinearGradient
            colors={["#297DB3", "#183243"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, { width: "60%" }]}
          >
            <Text style={styles.saveButtonText}>Save Exercises</Text>
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
  addButton: {
    paddingHorizontal: width * 0.05,
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  addButtonText: {
    fontSize: scale(14),
    color: "#3B82F6",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  muscleGroupSection: {
    backgroundColor: "white",
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 8,
    padding: 15,
  },
  muscleGroupTitle: {
    fontSize: scale(15),
    fontWeight: "600",
    marginBottom: height * 0.01,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    marginBottom: height * 0.01,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseName: {
    fontSize: scale(12),
    color: "#1A202C",
  },
  bottomSpace: {
    height: height * 0.1,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "600",
  },
});

export default AddExerciseTemplate;
