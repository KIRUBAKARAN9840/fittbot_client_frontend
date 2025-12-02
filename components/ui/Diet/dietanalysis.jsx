import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Image, ImageBackground } from "expo-image";
import { clientDietAnalysisAPI } from "../../../services/clientApi";
import StreakSummaryCard from "./StreakSummaryCard";
import TopPageBar from "../TopPageBar";
import GradientBackgroundTopPageBar from "../GradientBackgroundTopPageBar";
import WorkoutDistributionChart from "./WorkoutDistributionChart";
import WeightLossCard from "./WeightLossCard";
import { showToast } from "../../../utils/Toaster";
import SkeletonDiet from "./skeletonDiet";
import KyraAIFloatingButton from "../Workout/kyraAI";
import { useUser } from "../../../context/UserContext";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const DietAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [dietAnalysisData, setDietAnalysisData] = useState(null);
  const [showKyraMessage, setShowKyraMessage] = useState(false);
  const { sideBarData, profile } = useUser();
  const router = useRouter();

  const getDietAnalysis = async () => {
    setLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const response = await clientDietAnalysisAPI(clientId);

      if (response?.status === 200) {
        setDietAnalysisData(response.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to load diet analysis data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkKyraMessageDisplay = async () => {
    try {
      const lastShownTime = await AsyncStorage.getItem(
        "kyra_diet_analysis_message_time"
      );
      const currentTime = Date.now();
      const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      if (!lastShownTime || currentTime - parseInt(lastShownTime) > sixHours) {
        setShowKyraMessage(true);
        await AsyncStorage.setItem(
          "kyra_diet_analysis_message_time",
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

  const handleKyraAIPress = () => {
    router.push({
      pathname: "/client/(workout)/kyraAI",
      params: {
        profileImage: profile,
        userName: sideBarData?.userName,
        source: "analysis",
      },
    });
  };

  useFocusEffect(
    useCallback(() => {
      getDietAnalysis();
      checkKyraMessageDisplay();
    }, [])
  );

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 87, 87, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.8,
  };

  const renderWeeklyTrends = () => {
    const calculateChartWidth = (dataPoints) => {
      const minWidthPerPoint = 70;
      const calculatedWidth = Math.max(dataPoints, 1) * minWidthPerPoint;
      return Math.max(calculatedWidth, Dimensions.get("window").width - 40);
    };

    const NoDataMessage = () => (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data available yet</Text>
        <Text style={styles.noDataSubText}>
          Your nutritional data will appear here
        </Text>
      </View>
    );

    return (
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Weekly Trends</Text>
        <View style={styles.trendsContainer}>
          {Object?.entries(dietAnalysisData?.weekly_data)?.map(
            ([key, data]) => {
              const hasData = Array.isArray(data) && data.length > 0;

              return (
                <View key={key} style={styles.trendChartContainer}>
                  <Text style={styles.trendTitle}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>

                  {hasData ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={styles.chartScrollContainer}
                    >
                      <LineChart
                        data={{
                          labels: data.map((item) =>
                            item?.date
                              ? new Date(item.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : ""
                          ),
                          datasets: [
                            {
                              data: data.map((item) => item?.value || 0),
                              color: (opacity = 1) => {
                                const colors = {
                                  calories: `rgba(255, 87, 87, ${opacity})`,
                                  protein: `rgba(255, 167, 38, ${opacity})`,
                                  carbs: `rgba(76, 175, 80, ${opacity})`,
                                  fats: `rgba(33, 150, 243, ${opacity})`,
                                  fiber: `rgba(156, 39, 176, ${opacity})`,
                                  sugar: `rgba(255, 193, 7, ${opacity})`,
                                };
                                return colors[key] || colors.calories;
                              },
                              strokeWidth: 2,
                            },
                          ],
                        }}
                        width={calculateChartWidth(data.length)}
                        height={180}
                        chartConfig={{
                          // backgroundColor: '#e97979',
                          backgroundGradientFrom: "#ffffff",
                          backgroundGradientTo: "#ffffff",
                          decimalPlaces: 0,
                          color: (opacity = 1) => {
                            const colors = {
                              calories: `rgba(255, 87, 87, ${opacity})`,
                              protein: `rgba(255, 167, 38, ${opacity})`,
                              carbs: `rgba(76, 175, 80, ${opacity})`,
                              fats: `rgba(33, 150, 243, ${opacity})`,
                              fiber: `rgba(156, 39, 176, ${opacity})`,
                              sugar: `rgba(255, 193, 7, ${opacity})`,
                            };
                            return colors[key] || colors.calories;
                          },
                          labelColor: (opacity = 1) =>
                            `rgba(0, 0, 0, ${opacity})`,
                          propsForLabels: {
                            fontSize: 12,
                          },
                          propsForDots: {
                            r: "4",
                            strokeWidth: "2",
                          },
                          propsForBackgrounds: {
                            fill: "none",
                          },
                        }}
                        bezier
                        style={styles.chart}
                        withDots={true}
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLines={true}
                        withHorizontalLines={true}
                        segments={5}
                      />
                    </ScrollView>
                  ) : (
                    <NoDataMessage />
                  )}
                </View>
              );
            }
          )}
        </View>
      </View>
    );
  };

  const renderMacroChart = () => {
    if (!dietAnalysisData) return null;

    const macroData = [
      {
        name: "Protein",
        percentage: dietAnalysisData.macro_split?.protein_percentage,
        color: "#FF5757",
      },
      {
        name: "Carbs",
        percentage: dietAnalysisData.macro_split?.carbs_percentage,
        color: "#FFA726",
      },
      {
        name: "Fats",
        percentage: dietAnalysisData.macro_split?.fats_percentage,
        color: "#4CAF50",
      },
      {
        name: "Fiber",
        percentage: dietAnalysisData.macro_split?.fiber_percentage,
        color: "#2196F3",
      },
      {
        name: "Sugar",
        percentage: dietAnalysisData.macro_split?.sugar_percentage,
        color: "#9C27B0",
      },
    ];

    const hasMacroData = macroData?.some((item) => item.percentage > 0);

    if (hasMacroData) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Macro Nutrients</Text>
          <View style={styles.macroContainer}>
            <PieChart
              data={macroData}
              width={width - 60}
              height={200}
              chartConfig={chartConfig}
              accessor="percentage"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              avoidFalseZero={true}
            />
            <View style={styles.macroLegend}></View>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitleMacro}>Macro Nutrient Analysis</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available yet</Text>
            <Text style={styles.noDataSubText}>
              Your nutritional data will appear here
            </Text>
          </View>
        </View>
      );
    }
  };

  const renderDietAnalysis = () => {
    return (
      <Animated.ScrollView contentContainerStyle={[styles.scrollViewContent]}>
        {renderWeeklyTrends()}
      </Animated.ScrollView>
    );
  };

  const nutrients = [
    {
      label: "Calories",
      //   value: calories,
      width: 13,
      icon: require("../../../assets/images/diet/calorie.png"),
    },
    {
      label: "Proteins",
      value: dietAnalysisData?.macro_split.protein_percentage,
      width: 22,
      icon: require("../../../assets/images/diet/protein.png"),
    },
    {
      label: "Carbs",
      value: dietAnalysisData?.macro_split.carbs_percentage,
      width: 22,
      icon: require("../../../assets/images/diet/carb.png"),
    },
    {
      label: "Fats",
      value: dietAnalysisData?.macro_split.fats_percentage,
      width: 17,
      icon: require("../../../assets/images/diet/fat.png"),
    },
    {
      label: "Fiber",
      value: dietAnalysisData?.macro_split.fiber_percentage,
      width: 21,
      icon: require("../../../assets/images/diet/fiber.png"),
    },
    {
      label: "Sugar",
      value: dietAnalysisData?.macro_split.sugar_percentage,
      width: 21,
      icon: require("../../../assets/images/diet/sugar.png"),
    },
  ];

  return (
    <>
      <ScrollView style={styles.container}>
        {loading ? (
          <SkeletonDiet priority="high" type="analysis" header={false} />
        ) : (
          <>
            <StreakSummaryCard
              streak={dietAnalysisData?.stats?.longest_streak}
              calories_met={dietAnalysisData?.stats?.no_of_days_calories_met}
              surplus_met={dietAnalysisData?.stats?.calories_surplus_days}
              deficit_days={dietAnalysisData?.stats?.calories_deficit_days}
            />

            <GradientBackgroundTopPageBar title={"Macronutrients"} />

            {/* <View style={styles.nutri}>
            <LinearGradient
              colors={['#fff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nutrition_2}
            >
              {nutrients?.map((item, index) => (
                <View style={styles.row} key={index}>
                  <Image
                    source={item.icon}
                    style={[styles.icon, { width: item.width }]}
                  />
                  <Text style={styles.label}>{item?.label}</Text>
                  <Text style={styles.value}>{item?.value}</Text>
                </View>
              ))}
            </LinearGradient>
          </View> */}

            {/* <GradientBackgroundTopPageBar title={'Weekly Trends'} /> */}

            <WorkoutDistributionChart
              // streak={dietAnalysisData?.stats?.longest_streak}
              // calories_met={dietAnalysisData?.stats?.no_of_days_calories_met}
              // surplus_met={dietAnalysisData?.stats?.calories_surplus_days}
              // deficit_days={dietAnalysisData?.stats?.calories_deficit_days}
              protein={dietAnalysisData?.macro_split?.protein_percentage}
              carbs={dietAnalysisData?.macro_split?.carbs_percentage}
              fats={dietAnalysisData?.macro_split?.fats_percentage}
              fiber={dietAnalysisData?.macro_split?.fiber_percentage}
              sugar={dietAnalysisData?.macro_split?.sugar_percentage}
              calories={dietAnalysisData?.macro_split?.calories}
            />

            {dietAnalysisData && renderDietAnalysis()}
          </>
        )}
      </ScrollView>
      <KyraAIFloatingButton
        onPress={handleKyraAIPress}
        position="bottom-right"
        size="small"
        showBadge={false}
        colors={["#28A745", "#007BFF"]}
        style={{ bottom: Platform.OS === "ios" ? 100 : 100 }}
        message={
          showKyraMessage
            ? "Hi, I'm KyraAI\nI can analyze your diet data instantly"
            : ""
        }
        boxColor={["#28A745", "#007BFF"]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  // Stats cards
  statsGridContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    flex: 1,
    margin: 5,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCardWide: {
    flex: 1,
    marginHorizontal: 5,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF5757",
  },
  statsLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "500",
  },
  // Macro chart
  macroContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  macroLegend: {
    marginTop: 15,
    width: "100%",
  },
  // Weekly trends
  trendsContainer: {
    // padding: 10,
  },
  trendChartContainer: {
    marginBottom: 30,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    // padding: 10,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    // marginLeft: 10,
  },
  chartScrollContainer: {
    // paddingRight: 20,
    padding: 0,
    // backgroundColor: 'pink',
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  chart: {
    // marginVertical: 8,
    borderRadius: 16,
    marginLeft: 0,
    // backgroundColor: 'pink',
  },
  // No data states
  noDataContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 20,
    width: "100%",
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: "#888",
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    // paddingHorizontal: 15,
    paddingVertical: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
    marginVertical: 12,
  },
  chartTitleMacro: {
    fontSize: 18,
    paddingBottom: 15,
    fontWeight: "600",
  },

  nutri: {
    paddingHorizontal: 15,
    paddingVertical: 40,
  },

  nutrition_2: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    borderRadius: 12,
    // marginTop: 10,
    paddingVertical: 8,

    backgroundColor: "#fff",
    borderRadius: 12,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  row: {
    alignItems: "center",
  },

  icon: {
    height: 21,
  },

  title: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 6,
  },

  label: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "400",
  },
});

export default DietAnalysis;
