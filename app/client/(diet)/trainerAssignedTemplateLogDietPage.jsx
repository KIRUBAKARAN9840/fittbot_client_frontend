import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MealsCategoryCard from "../../../components/ui/Diet/MealsCategoryCard";
import MissedLogCard from "../../../components/ui/Diet/MissedLogCard";
import MissedMealsModal from "../../../components/ui/Diet/MissedMealsModal";
import GradientButton from "../../../components/ui/GradientButton";
import GradientButton2 from "../../../components/ui/GradientButton2";
import { toIndianISOString } from "../../../utils/basicUtilFunctions";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { getSingleDietTemplateAPI } from "../../../services/clientApi";
import { addClientDietAPI } from "../../../services/clientApi";
import { safeParseJSON } from "../../../utils/safeHelpers";
import { showToast } from "../../../utils/Toaster";
import GrainConfettiAnimation from "../../../components/ui/ConfettiAnimation";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import SkeletonWorkout from "../../../components/ui/Workout/skeletonWorkout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");

const mockData = [
  {
    id: "1",
    title: "Pre workout",
    tagline: "Energy boost",
    foodList: [],
    timeRange: "6:30-7:00 AM",
    itemsCount: 1,
  },
  {
    id: "2",
    title: "Post workout",
    tagline: "Recovery fuel",
    foodList: [],
    timeRange: "7:30-8:00 AM",
    itemsCount: 0,
  },
  {
    id: "3",
    title: "Early morning Detox",
    tagline: "Early morning nutrition",
    foodList: [],
    timeRange: "5:30-6:00 AM",
    itemsCount: 0,
  },
  {
    id: "4",
    title: "Pre-Breakfast / Pre-Meal Starter",
    tagline: "Pre-breakfast fuel",
    foodList: [],
    timeRange: "7:00-7:30 AM",
    itemsCount: 0,
  },
  {
    id: "5",
    title: "Breakfast",
    tagline: "Start your day right",
    foodList: [],
    timeRange: "8:30-9:30 AM",
    itemsCount: 1,
  },
  {
    id: "6",
    title: "Mid-Morning snack",
    tagline: "Healthy meal",
    foodList: [],
    timeRange: "10:00-11:00 AM",
    itemsCount: 0,
  },
  {
    id: "7",
    title: "Lunch",
    tagline: "Nutritious midday meal",
    foodList: [],
    timeRange: "1:00-2:00 PM",
    itemsCount: 0,
  },
  {
    id: "8",
    title: "Evening snack",
    tagline: "Healthy meal",
    foodList: [],
    timeRange: "4:00-5:00 PM",
    itemsCount: 0,
  },
  {
    id: "9",
    title: "Dinner",
    tagline: "End your day well",
    foodList: [],
    timeRange: "7:30-8:30 PM",
    itemsCount: 2,
  },
  {
    id: "10",
    title: "Bed time",
    tagline: "Rest well",
    foodList: [],
    timeRange: "9:30-10:00 PM",
    itemsCount: 0,
  },
];

const trainerAssignedTemplateLogDietPage = (props) => {
  const router = useRouter();
  const [templateData, setTemplateData] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateAdd, setDateAdd] = useState(new Date());
  const [missedMealsModalVisible, setMissedMealsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
  });
  const insets = useSafeAreaInsets();
  const {
    templateTitle,
    templateId,
    defaultTemplateId,
    defaultTemplateTitle,
    method,
    templateData: templateData2,
  } = useLocalSearchParams();

  // Handle date selection
  const handleDateSelect = (date) => {
    setDateAdd(date);
    setSelectedDate(date);
    setMissedMealsModalVisible(true);
  };

  useEffect(() => {
    if (templateData2) {
      const parsedData = safeParseJSON(templateData2, {});
      setTemplateData(parsedData?.diet_data || []);
      setNutrition({
        calories: parsedData?.calories || 0,
        protein: parsedData?.protein || 0,
        fat: parsedData?.fat || 0,
        fiber: parsedData?.fiber || 0,
        sugar: parsedData?.sugar || 0,
        carbs: parsedData?.carbs || 0,
      });
    }

    return () => {};
  }, [templateData2]);

  useEffect(() => {
    const fetchParticularTemplateData = async (id) => {
      setIsLoading(true);
      try {
        const response = await getSingleDietTemplateAPI(id);

        if (response?.status === 200) {
          if (
            response?.data?.diet_data &&
            Array.isArray(response.data.diet_data)
          ) {
            // Make sure each category and meal has a selected property
            const formattedData = response.data.diet_data.map((category) => ({
              ...category,
              selected: false,
              foodList: category.foodList.map((meal) => ({
                ...meal,
                selected: false,
              })),
            }));
            setTemplateData(formattedData);
          } else {
          }
        }
      } catch (error) {
        const errorMessage = "Something went wrong, please try again.";
        Alert.alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      fetchParticularTemplateData(templateId);
    } else {
      setIsLoading(false);
    }
  }, [templateId]);

  const handleSelection = ({ mealId, catId }) => {
    let updatedTemplateData = [...templateData];

    // Case 1: Category selection (toggle all meals in a category)
    if (catId && !mealId) {
      const categoryIndex = updatedTemplateData.findIndex(
        (cat) => cat.id === catId
      );

      if (categoryIndex !== -1) {
        // Toggle the category's selection state
        const isCategorySelected = !updatedTemplateData[categoryIndex].selected;

        // Update category and all its meals
        updatedTemplateData[categoryIndex] = {
          ...updatedTemplateData[categoryIndex],
          selected: isCategorySelected,
          foodList: updatedTemplateData[categoryIndex].foodList.map((meal) => ({
            ...meal,
            selected: isCategorySelected,
          })),
        };
      }
    }
    // Case 2: Individual meal selection
    else if (catId && mealId) {
      const categoryIndex = updatedTemplateData.findIndex(
        (cat) => cat.id === catId
      );

      if (categoryIndex !== -1) {
        const mealIndex = updatedTemplateData[categoryIndex].foodList.findIndex(
          (meal) => meal.id === mealId
        );

        if (mealIndex !== -1) {
          // Toggle the meal's selection state
          const isMealSelected =
            !updatedTemplateData[categoryIndex].foodList[mealIndex].selected;

          // Update the meal
          updatedTemplateData[categoryIndex].foodList[mealIndex] = {
            ...updatedTemplateData[categoryIndex].foodList[mealIndex],
            selected: isMealSelected,
          };

          // Check if all meals in the category are now selected
          const areAllMealsSelected = updatedTemplateData[
            categoryIndex
          ].foodList.every((meal) => meal.selected);

          // Update the category selection state
          updatedTemplateData[categoryIndex] = {
            ...updatedTemplateData[categoryIndex],
            selected: areAllMealsSelected,
          };
        }
      }
    }

    setTemplateData(updatedTemplateData);
    updateSelectedMealsList(updatedTemplateData);
  };

  // Helper function to update the list of selected meals
  const updateSelectedMealsList = (updatedTemplateData) => {
    const allSelectedMeals = [];

    updatedTemplateData.forEach((category) => {
      category.foodList.forEach((meal) => {
        if (meal.selected) {
          allSelectedMeals.push({
            ...meal,
            categoryId: category.id,
            categoryTitle: category.title,
          });
        }
      });
    });

    setSelectedMeals(allSelectedMeals);
  };

  const saveFoods = async () => {
    if (!dateAdd) {
      return;
    }

    if (selectedMeals.length === 0) {
      showToast({
        type: "error",
        title: "No Food Selected",
      });
      return;
    }

    // Handle regular diet log
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

      // Group selected meals by category
      const mealsByCategory = selectedMeals.reduce((acc, food) => {
        const categoryId = food.categoryId || "5"; // Default to Breakfast
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }

        const quantity = parseInt(food.quantity) || 1;
        acc[categoryId].push({
          id: `${Date.now()}${Math.random()}`.replace(/\./g, ""),
          fat: Number(food.fat * quantity) || 0,
          name: food.title || food.name || "Unknown Food",
          carbs: Number(food.carbs * quantity) || 0,
          fiber: Number(food.fiber * quantity) || 0,
          sugar: Number(food.sugar * quantity) || 0,
          protein: Number(food.protein * quantity) || 0,
          calories: Number(food.calories * quantity) || 0,
          quantity: `${quantity} serving`,
          image_url: food.pic || "",
        });
        return acc;
      }, {});

      // Define meal categories structure
      const mealCategories = [
        {
          id: "1",
          title: "Pre workout",
          tagline: "Energy boost",
          timeRange: "6:30-7:00 AM",
        },
        {
          id: "2",
          title: "Post workout",
          tagline: "Recovery fuel",
          timeRange: "7:30-8:00 AM",
        },
        {
          id: "3",
          title: "Early morning Detox",
          tagline: "Early morning nutrition",
          timeRange: "5:30-6:00 AM",
        },
        {
          id: "4",
          title: "Pre-Breakfast / Pre-Meal Starter",
          tagline: "Pre-breakfast fuel",
          timeRange: "7:00-7:30 AM",
        },
        {
          id: "5",
          title: "Breakfast",
          tagline: "Start your day right",
          timeRange: "8:30-9:30 AM",
        },
        {
          id: "6",
          title: "Mid-Morning snack",
          tagline: "Healthy meal",
          timeRange: "10:00-11:00 AM",
        },
        {
          id: "7",
          title: "Lunch",
          tagline: "Nutritious midday meal",
          timeRange: "1:00-2:00 PM",
        },
        {
          id: "8",
          title: "Evening snack",
          tagline: "Healthy meal",
          timeRange: "4:00-5:00 PM",
        },
        {
          id: "9",
          title: "Dinner",
          tagline: "End your day well",
          timeRange: "7:30-8:30 PM",
        },
        {
          id: "10",
          title: "Bed time",
          tagline: "Rest well",
          timeRange: "9:30-10:00 PM",
        },
      ];

      // Create diet data with only categories that have food items
      const dietData = mealCategories
        .map((category) => {
          const categoryMeals = mealsByCategory[category.id] || [];
          return {
            id: category.id,
            title: category.title,
            tagline: category.tagline,
            foodList: categoryMeals,
            timeRange: category.timeRange,
            itemsCount: categoryMeals.length,
          };
        })
        .filter((category) => category.foodList.length > 0);

      const payload = {
        client_id: clientId,
        date: toIndianISOString(dateAdd).split("T")[0],
        diet_data: dietData,
        gym_id: gymId ? gymId : null,
      };

      const response = await addClientDietAPI(payload);

      if (response?.status === 200) {
        // setSelectedFoods([]);
        setDateAdd(new Date());
        const earnedXp = response?.reward_point || 0;
        const showFeedbackModal = response?.feedback || false;
        const showTargetModal = response?.target || false;
        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
        } else {
          setXpRewardVisible(false);
        }

        if (!earnedXp) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Diet Added Successfully.",
          });
          router.push({
            pathname: "/client/(diet)/myListedFoodLogs",
            params: {
              showTarget: showTargetModal ? "true" : "false",
              showFeedback:
                !showTargetModal && showFeedbackModal ? "true" : "false",
            },
          });

          setXpRewardVisible(false);
        } else {
          setTimeout(() => {
            router.push({
              pathname: "/client/(diet)/myListedFoodLogs",
              params: {
                showTarget: showTargetModal ? "true" : "false",
                showFeedback:
                  !showTargetModal && showFeedbackModal ? "true" : "false",
              },
            });
            setXpRewardVisible(false);
          }, 3000);
        }

        return response;
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error adding diet",
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

  if (isLoading) {
    return <SkeletonWorkout header={false} priority="high" />;
  }

  return (
    <>
      <View style={[styles.sectionContainer, { paddingBottom: insets.bottom }]}>
        <HardwareBackHandler
          routePath="/client/(diet)/personalTemplate"
          params={{ method: "gym" }}
          enabled={true}
        />
        {xpRewardVisible ? (
          <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
        ) : (
          ""
        )}

        <TouchableOpacity
          style={[
            styles.backButtonContainer,
            { padding: width * 0.04, paddingTop: insets.top },
          ]}
          onPress={() => {
            if (templateTitle) {
              router.push({
                pathname: "/client/personalTemplate",
                params: { method: method },
              });
            } else {
              if (method === "gym") {
                router.push({
                  pathname: "/client/personalTemplate",
                  params: { method: method },
                });
              } else {
                router.push({
                  pathname: "/client/sampleTemplate",
                  params: { method: method },
                });
              }
            }
            // router.push('/client/personalTemplate');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {templateTitle || defaultTemplateTitle}
          </Text>
        </TouchableOpacity>

        {/* <MissedLogCard
          onPress={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
        /> */}

        {selectedDate && (
          <View
            style={{
              marginTop: 5,
              marginBottom: 5,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GradientButton2
              title={
                selectedDate
                  ? format(selectedDate, "MMMM dd, yyyy")
                  : "yyyy-MM-dd"
              }
              fromColor="#28A745"
              toColor="#007BFF"
              containerStyle={{ marginTop: 0 }}
              textStyle={{ fontSize: 12 }}
              onPress={() =>
                setMissedMealsModalVisible(!missedMealsModalVisible)
              }
            />
          </View>
        )}

        {nutrition?.calories > 0 && (
          <FlatList
            data={templateData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.foodList && item.foodList.length > 0) {
                return (
                  <MealsCategoryCard
                    title={item.title}
                    timeRange={item.timeRange}
                    itemsCount={item.foodList?.length || 0}
                    foodList={item.foodList}
                    onPress={() => {
                      router.push({
                        pathname: "/client/addFoodListPage",
                        params: {
                          templateTitle: templateTitle,
                          mealTitle: item.title,
                          mealTimeRange: item.timeRange,
                          mealId: item.id,
                          templateId: templateId,
                          templateData: JSON.stringify(templateData),
                        },
                      });
                    }}
                    catSelected={item.selected}
                    categoryId={item.id}
                    templateTitle={templateTitle}
                    templateId={templateId}
                    updateDietTemplate={() => {}}
                    logFood={true}
                    handleSelection={(params) =>
                      handleSelection({
                        ...params,
                        catId: item.id,
                      })
                    }
                    defaultTemplateId={defaultTemplateId}
                    method={method}
                  />
                );
              }
              return null;
            }}
            contentContainerStyle={{ paddingBottom: 10, paddingTop: 0 }}
          />
        )}

        {nutrition?.calories > 0 && (
          <>
            <View style={styles.selectedCountContainer}>
              <Text style={styles.selectedCountText}>
                {`Log ${selectedMeals.length} selected meal${
                  selectedMeals.length !== 1 ? "s" : ""
                }`}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <GradientButton
                title={"Add to Food logs"}
                fromColor="#28A745"
                toColor="#007BFF"
                containerStyle={{ marginTop: 0 }}
                textStyle={{ fontSize: 12 }}
                onPress={saveFoods}
                disabled={isLoading || selectedMeals.length === 0}
              />
            </View>
          </>
        )}

        {nutrition?.calories === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() => router.push("/client/addFoodListPage")}
            // buttonText={'Add Food'}
            message={
              "Looks like you have not added anything today!\nTap below to add your favorite meals and track your intakes."
            }
            // belowButtonText={'Forgot to Log? Tap Here '}
            onButtonPress2={() => {}}
          />
        )}

        <MissedMealsModal
          onClose={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
          visible={missedMealsModalVisible}
          date={selectedDate}
          onChangeDate={(date) => setSelectedDate(date)}
          onSubmit={handleDateSelect}
        />
      </View>
    </>
  );
};

export default trainerAssignedTemplateLogDietPage;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.02,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  logButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: width * 0.05,
    marginVertical: 10,
    alignItems: "center",
  },
  logButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    marginBottom: 0,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "400",
  },
  buttonContainer: {
    marginBottom: 0,
  },
});
