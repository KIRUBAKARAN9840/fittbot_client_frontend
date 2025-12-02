import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientGeneralAnalysisAPI } from "../../../services/clientApi";
import WorkoutCard from "../Workout/WorkoutCard";
import DurationDisplay from "../TimeDisplay";
import MonthlyTrendChart from "../MonthlyTrendChart";
import { showToast } from "../../../utils/Toaster";
import SkeletonHome from "./skeletonHome";
import { useUser } from "../../../context/UserContext";

const { width } = Dimensions.get("window");

const GeneralAnalysis = () => {
  const [generalAnalysisData, setGeneralAnalysisData] = useState(null);
  const [gender, setGender] = useState(null);
  const [loading, setLoading] = useState(true);
  const { plan } = useUser();
  const getGeneralAnalysis = async () => {
    setLoading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const response = await clientGeneralAnalysisAPI(clientId);
      const gen = await AsyncStorage.getItem("gender");
      if (response?.status === 200) {
        setGender(gen);
        setGeneralAnalysisData(response.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Could not load general analysi data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
      console.error("Error fetching general analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getGeneralAnalysis();
    }, [])
  );

  const renderWeeklyTrends = () => {
    const NoDataMessage = () => (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data available yet</Text>
        <Text style={styles.noDataSubText}>
          Your nutritional data will appear here
        </Text>
      </View>
    );

    // Early return if no data is available
    if (
      !generalAnalysisData?.monthly_data ||
      Object.keys(generalAnalysisData.monthly_data).length === 0
    ) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Monthly Trends</Text>
          <NoDataMessage />
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Monthly Trends</Text>

        <View style={styles.trendsContainer}>
          {Object.entries(generalAnalysisData.monthly_data)
            .filter(([key]) => {
              // Skip burnt_calories and any other data you want to exclude
              return key.toLowerCase() !== "burnt_calories";
            })
            .map(([key, data]) => {
              // Skip if data is not valid
              if (!Array.isArray(data) || data.length === 0) {
                return null;
              }
              // Format the title properly
              const formattedTitle = key
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

              return (
                <View key={key} style={styles.trendChartContainer}>
                  <Text style={styles.trendTitle}>{formattedTitle}</Text>

                  {Array.isArray(data) && data.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={styles.chartScrollContainer}
                    >
                      <MonthlyTrendChart monthlyData={data} />
                    </ScrollView>
                  ) : (
                    <NoDataMessage />
                  )}
                </View>
              );
            })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <SkeletonHome type="analysis" header={false} />
      ) : (
        <Animated.ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={{ paddingTop: 15 }}>
            <WorkoutCard
              title={"Average Gym Time"}
              imagePath={
                gender?.toLowerCase() === "male"
                  ? require("../../../assets/images/workout/LOG_OUT 1.png")
                  : require("../../../assets/images/workout/LOG_OUT 1_female.png")
              }
              textColor={"#313131"}
              paraTextColor={"#00000081"}
              buttonTextColor={"#28A745"}
              bg1={"rgba(33, 142, 209, 0.281)"}
              bg2={"#ffffff1f"}
              border1={"#28a74629"}
              border2={"#297eb32f"}
              charWidth={140}
              childComponent={
                <DurationDisplay
                  hours={generalAnalysisData?.total_gym_time?.hour || 0}
                  minutes={generalAnalysisData?.total_gym_time?.minutes || 0}
                />
              }
            />
          </View>

          {/* <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeader}>Monthly Trend</Text>
            </View>
            <MonthlyTrendChart
              monthlyData={generalAnalysisData?.monthly_data}
              chartType="attendance"
              title="Monthly Attendance"
              emptyMessage={{
                title: 'No attendance data available',
                subText:
                  'Your gym attendance pattern will show here as you log workouts',
              }}
            />
          </View> */}

          {renderWeeklyTrends()}
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
  },
  // card: {
  //   backgroundColor: '#FFFFFF',
  //   borderRadius: 12,
  //   padding: 15,
  //   marginVertical: 12,
  //   elevation: 3,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  chartScrollContainer: {
    // paddingRight: 20,
    padding: 0,
    // backgroundColor: 'pink',
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    Top: 20,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
  },
  // card: {
  //   backgroundColor: '#FFFFFF',
  //   borderRadius: 12,
  //   padding: 15,
  //   marginVertical: 12,
  //   elevation: 3,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  chartScrollContainer: {
    // paddingRight: 20,
    padding: 0,
    // backgroundColor: 'pink',
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    Top: 20,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
  },
  // card: {
  //   backgroundColor: '#FFFFFF',
  //   borderRadius: 12,
  //   padding: 15,
  //   marginVertical: 12,
  //   elevation: 3,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  chartScrollContainer: {
    // paddingRight: 20,
    padding: 0,
    // backgroundColor: 'pink',
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    Top: 20,
  },
  cardHeader: {
    fontSize: 20,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
  },
  // card: {
  //   backgroundColor: '#FFFFFF',
  //   borderRadius: 12,
  //   padding: 15,
  //   marginVertical: 12,
  //   elevation: 3,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeader: {
    fontSize: 16,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  chartScrollContainer: {
    // paddingRight: 20,
    padding: 0,
    // backgroundColor: 'pink',
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
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
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 12,
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
    fontSize: 14,
    paddingBottom: 15,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    Top: 20,
  },
  cardHeader: {
    fontSize: 16,
    color: "black",
    marginRight: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  trendChartContainer: {
    marginBottom: 30,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    // padding: 10,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#313131",
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
  trendsContainer: {
    // padding: 10,
  },
});

export default GeneralAnalysis;
