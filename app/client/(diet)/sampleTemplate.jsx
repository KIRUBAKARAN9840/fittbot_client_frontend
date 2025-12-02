import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import TemplateFoodCard from "../../../components/ui/Diet/TemplateFoodCard";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { getDefaultDietTemplate } from "../../../services/clientApi";
import RenderFoodCards from "./todayFoodLogPage";
import { showToast } from "../../../utils/Toaster";
import SkeletonDiet from "../../../components/ui/Diet/skeletonDiet";
const { width, height } = Dimensions.get("window");

const SampleTemplate = (props) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [report, setReport] = useState(null);
  const [consumedFoods, setConsumedFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { scrollEventThrottle, onScroll, headerHeight } = props;
  const [openCreateTemplateModal, setOpenCreateTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState([]);

  const [newTemplateName, setNewTemplateName] = useState("");
  const [isEditNameModalVisible, setEditNameModalVisible] = useState(false);
  const [templateId, setTemplateId] = useState(null);
  const [rawTemplates, setRawTemplates] = useState([]);

  // Memoize the heavy calculation
  const processedTemplates = useMemo(() => {
    return rawTemplates.map((template) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalSugar = 0;

      template.template_json.forEach((meal) => {
        meal.foodList.forEach((food) => {
          const qty = food.quantity || 0;
          totalCalories += (food.calories || 0) * qty;
          totalProtein += (food.protein || 0) * qty;
          totalCarbs += (food.carbs || 0) * qty;
          totalFat += (food.fat || 0) * qty;
          totalFiber += (food.fiber || 0) * qty;
          totalSugar += (food.sugar || 0) * qty;
        });
      });

      return {
        ...template,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        fiber: totalFiber,
        sugar: totalSugar,
        quantity: template.template_json.length,
      };
    });
  }, [rawTemplates]);

  const fetchTemplates = async () => {
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

      const response = await getDefaultDietTemplate();

      if (response?.status === 200) {
        setRawTemplates(response.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail ||
            response?.message ||
            "Something went wrong. Please try again later",
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
    fetchTemplates();
  }, []);

  if (isLoading) {
    return <SkeletonDiet priority="high" type="home" />;
  }

  return (
    <>
      <SafeAreaView style={styles.sectionContainer}>
        <TouchableOpacity
          style={[styles.backButtonContainer, { padding: width * 0.04 }]}
          onPress={() => {
            router.push("/client/diet");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Default Templates</Text>
        </TouchableOpacity>

        {consumedFoods?.length > 0 && (
          <RenderFoodCards mockData={consumedFoods} />
        )}

        {templates?.length === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() =>
              setOpenCreateTemplateModal(!openCreateTemplateModal)
            }
            // buttonText={'Start Fresh'}
            message={
              "Looksss like you have not created any template yet!\nTap below to Create your own Template and add food in a single tap!"
            }
            belowButtonText={""}
            onButtonPress2={() => {}}
          />
        )}

        {/* {templates?.length > 0 && ( */}
        <View style={styles.foodList}>
          <FlatList
            data={processedTemplates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TemplateFoodCard
                id={item.id}
                image={item.pic}
                title={item.template_name}
                calories={item.calories}
                carbs={item.carbs}
                fat={item.fat}
                fiber={item.fiber}
                sugar={item.sugar}
                protein={item.protein}
                quantity={item.quantity}
                defaultTemplate={true}
              />
            )}
            contentContainerStyle={{ paddingBottom: 10, paddingTop: 0 }}
            initialNumToRender={5}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>
        {/* )} */}
      </SafeAreaView>
    </>
  );
};

export default SampleTemplate;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  foodList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
});
