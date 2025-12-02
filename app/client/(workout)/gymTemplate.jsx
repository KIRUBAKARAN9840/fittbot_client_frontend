import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { getGymTemplateClientAPI } from "../../../services/clientApi";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../../../utils/Toaster";
import TemplateViewCard from "../../../components/ui/Workout/TemplateViewCard";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import SkeletonWorkout from "../../../components/ui/Workout/skeletonWorkout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const TemplateViewPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [gender, setGender] = useState(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const getGender = async () => {
    setGender(await AsyncStorage.getItem("gender"));
  };

  useEffect(() => {
    getGender();
  }, []);

  const getTemplates = async () => {
    setIsLoading(true);
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
      const response = await getGymTemplateClientAPI(clientId);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

  const handleTemplateSelect = (templateData) => {
    if (templateData && templateData.exercise_data) {
      router.push({
        pathname: "/client/exercise",
        params: {
          templateId: templateData.id,
          templateName: templateData.name,
          templateExercises: JSON.stringify(
            Object.keys(templateData.exercise_data)
          ),
          myTemplateExercise: JSON.stringify(templateData.exercise_data),
          isTemplate: true,
          gender: gender,
          isTrainerTemplate: true,
        },
      });
    }
  };

  const getIndividualTemplates = () => {
    const individualTemplates = [];

    templates.forEach((template) => {
      if (template.exercise_data) {
        Object.keys(template.exercise_data).forEach((dayOrVariant) => {
          const dayData = template.exercise_data[dayOrVariant];
          if (dayData && Object.keys(dayData).length > 0) {
            individualTemplates.push({
              id: `${template.id}_${dayOrVariant}`,
              name:
                dayOrVariant.charAt(0).toUpperCase() + dayOrVariant.slice(1),
              originalId: template.id,
              exercise_data: dayData,
            });
          }
        });
      }
    });

    return individualTemplates;
  };

  if (isLoading) {
    return <SkeletonWorkout header={true} priority="high" />;
  }

  const individualTemplates = getIndividualTemplates();

  if (individualTemplates.length === 0) {
    return (
      <View style={[styles.sectionContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            router.push("/client/home");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Trainer Templates</Text>
        </TouchableOpacity>
        <EmptyStateCard
          imageSource={require("../../../assets/images/workout/WORKOUT_CAT_V001.png")}
          message={
            "No workout templates available at the moment. \nCheck back later for new templates."
          }
          buttonText="Go Back"
          onButtonPress={() => router.push("/client/home")}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.sectionContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <HardwareBackHandler routePath="/client/home" />
      <TouchableOpacity
        style={styles.backButtonContainer}
        onPress={() => {
          router.push("/client/home");
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backButtonText}>Trainer Assigned Workout Plan</Text>
      </TouchableOpacity>
      <Animated.ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: width * 0.04 }}>
          {individualTemplates.map((template) => (
            <TemplateViewCard
              key={template.id}
              template={template}
              handleTemplateSelect={() => handleTemplateSelect(template)}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default TemplateViewPage;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: Platform.OS === "ios" ? 30 : 0,
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
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
});
