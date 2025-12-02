import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWeightJourneyAPI } from "../../services/clientApi";
import SkeletonHome from "../../components/ui/Home/skeletonHome";

const screenWidth = Dimensions.get("window").width;

const ViewJourney = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAllJourneys, setShowAllJourneys] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [weightData, setWeightData] = useState({
    currentWeight: 0,
    startWeight: 0,
    targetWeight: 0,
    chartLabels: [],
    chartData: [],
    journeys: [],
    history: [],
  });
  const insets = useSafeAreaInsets();
  // Function to format date strings to month names
  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "short" });
  };

  // Function to process weight data from API
  const processWeightData = (journeyList, recordList, weightHistory) => {
    // Get current journey (the one without an end date or the most recent)
    const currentJourney = journeyList.find((j) => j.end_date === null);

    // Get current weight (most recent record)
    const sortedRecords = [...recordList].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Fix: Use actual_weight from current journey if available, otherwise use most recent record
    let currentWeight = 0;
    if (currentJourney && currentJourney.actual_weight) {
      currentWeight = currentJourney.actual_weight;
    } else if (sortedRecords.length > 0) {
      currentWeight = sortedRecords[0].weight;
    }

    // Process chart data
    const chartData = [];
    const chartLabels = [];

    if (weightHistory && weightHistory.length > 0) {
      // Sort weight history by date
      const sortedHistory = [...weightHistory].sort(
        (a, b) => new Date(a.label) - new Date(b.label)
      );

      // Add data points to chart
      sortedHistory.forEach((item) => {
        chartLabels.push(getMonthName(item.label));
        chartData.push(item.value);
      });
    } else {
      // Handle no data case
      chartLabels.push("No Data");
      chartData.push(0);
    }

    // Format history for display
    const formattedHistory = [];
    sortedRecords.forEach((record) => {
      const date = new Date(record.date);
      formattedHistory.push({
        date: date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        weight: record.weight,
        status: record.status,
      });
    });

    // Format journeys for display
    const formattedJourneys = (journeyList || []).map((journey, index) => {
      const startDate = new Date(journey.start_date).toLocaleDateString(
        "en-IN",
        { day: "2-digit", month: "2-digit", year: "2-digit" }
      );
      const endDate = journey.end_date
        ? new Date(journey.end_date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
        : "";

      return {
        id: journey.id,
        status: journey.end_date === null ? "Active" : "Completed",
        target: journey.target_weight,
        start: journey.start_weight,
        current: journey.actual_weight,
        startDate,
        endDate,
        daysDiff: journey.days_diff,
        isActive: journey.end_date === null, // Add this to distinguish active vs completed
      };
    });

    return {
      currentWeight,
      startWeight: currentJourney ? currentJourney.start_weight : 0,
      targetWeight: currentJourney ? currentJourney.target_weight : 0,
      startDate: currentJourney
        ? new Date(currentJourney.start_date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
        : "",
      chartLabels,
      chartData,
      journeys: formattedJourneys,
      history: formattedHistory,
      daysDiff: currentJourney ? currentJourney.days_diff : 1,
    };
  };

  const renderProgressBar = (
    start,
    current,
    target,
    startDate = "",
    endDate = "",
    isActive = true // Add parameter to determine if it's an active journey
  ) => {
    if (start === target) return null;

    const total = Math.abs(start - target);
    const progress = Math.abs(start - current);
    const progressPercent = Math.min(
      Math.max((progress / total) * 100, 0),
      100
    );

    return (
      <View style={styles.progressContainer}>
        {startDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{startDate}</Text>
            {endDate && <Text style={styles.dateText}>{endDate}</Text>}
          </View>
        )}
        <LinearGradient
          colors={["#FF5757", "#FFA6A6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressGradient, { width: `${progressPercent}%` }]}
        />
        <View
          style={
            startDate
              ? styles.progressBackgroundDate
              : styles.progressBackground
          }
        />

        <View style={styles.markersContainer}>
          <View style={styles.markerItem}>
            <View style={[styles.markerDot, { backgroundColor: "#FF5757" }]} />
            <Text style={styles.weightText}>{start} kg</Text>
            <Text style={styles.weightLabel}>Start</Text>
          </View>

          <View style={styles.markerItem}>
            <View style={[styles.markerDot, { backgroundColor: "#FFA6A6" }]} />
            <Text style={styles.weightText}>{current} kg</Text>
            {/* Fix: Show "Current" for active journeys, "Final" for completed ones */}
            <Text style={styles.weightLabel}>
              {isActive ? "Current" : "Final"}
            </Text>
          </View>

          <View style={styles.markerItem}>
            <View style={[styles.markerDot, { backgroundColor: "#E0E0E0" }]} />
            <Text style={styles.weightText}>{target} kg</Text>
            <Text style={styles.weightLabel}>Target</Text>
          </View>
        </View>
      </View>
    );
  };

  const getAllJourneys = async () => {
    setLoading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        Alert.alert("Error", "An Error Occurred. Please try again later.");
        return;
      }

      const response = await getWeightJourneyAPI(clientId);
      if (response?.status === 200) {
        const { journey_list, record_list, weight } = response.data;
        const processedData = processWeightData(
          journey_list,
          record_list,
          weight
        );
        setWeightData(processedData);
      } else {
        Alert.alert("Error", response?.detail || "An error occurred");
      }
    } catch (error) {
      Alert.alert("Error", "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllJourneys();
  }, []);

  if (loading) {
    return <SkeletonHome type="home" header={false} />;
  }

  // Separate current journey from historical journeys
  const currentJourney = weightData.journeys.find((j) => j.status === "Active");
  const historicalJourneys = weightData.journeys
    .filter((j) => j.status === "Completed")
    .reverse();
  const displayedHistoricalJourneys = historicalJourneys.slice(0, 2);
  const displayedHistory = weightData.history.slice(0, 3);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/client/home")}
        >
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Weight journey</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Current Weight Journey */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Weight Journey</Text>
          <Text style={styles.currentWeightValue}>
            {weightData.daysDiff} days
          </Text>
          <Text style={styles.targetWeightLabel}>Journey Duration</Text>

          {renderProgressBar(
            weightData.startWeight,
            weightData.currentWeight,
            weightData.targetWeight,
            weightData.startDate,
            "",
            true // This is always an active journey
          )}
        </View>

        {/* Historical Journeys */}
        {historicalJourneys.length > 0 && (
          <View>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeaderTitle}>Historical Journey</Text>
              {historicalJourneys.length > 2 && (
                <TouchableOpacity onPress={() => setShowAllJourneys(true)}>
                  <Text style={styles.viewMoreText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {(displayedHistoricalJourneys || []).map((journey, index) => (
              <View key={journey.id} style={styles.card}>
                <View style={styles.journeyHeader}>
                  <Text style={styles.sectionTitle}>Journey {journey.id}</Text>
                </View>

                <Text style={styles.targetWeightValue}>
                  {journey.daysDiff} days
                </Text>
                <Text style={styles.targetWeightLabel}>Journey Duration</Text>

                {renderProgressBar(
                  journey.start,
                  journey.current,
                  journey.target,
                  journey.startDate,
                  journey.endDate,
                  journey.isActive // Pass the isActive flag
                )}
              </View>
            ))}
          </View>
        )}

        {/* Status Bar / Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status Bar</Text>

          {weightData.chartData.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <LineChart
                data={{
                  labels: weightData.chartLabels,
                  datasets: [
                    {
                      data:
                        weightData.chartData.length > 0
                          ? weightData.chartData
                          : [0],
                      color: (opacity = 1) => `rgba(91, 43, 155, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={Math.max(
                  screenWidth - 40,
                  weightData.chartLabels.length * 80
                )}
                height={200}
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(91, 43, 155, ${opacity})`,
                  labelColor: (opacity = 1) => "#1a1a1a",
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#FF5757",
                    fill: "#FFFFFF",
                  },
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: "600",
                  },
                  formatYLabel: (value) => `${value} kg`,
                }}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={false}
                yAxisLabel=""
                yAxisSuffix=" kg"
              />
            </ScrollView>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No weight data available</Text>
            </View>
          )}
        </View>

        {/* Weight History */}
        <View style={styles.historyContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Weight History</Text>
            {weightData.history.length > 3 && (
              <TouchableOpacity onPress={() => setShowAllHistory(true)}>
                <Text style={styles.viewMoreText}>View More</Text>
              </TouchableOpacity>
            )}
          </View>

          {displayedHistory.length > 0 ? (
            (displayedHistory || []).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyWeight}>{item.weight} kg</Text>
                </View>
                <View style={styles.downArrow}>
                  <Ionicons
                    name={item.status ? "arrow-up" : "arrow-down"}
                    size={16}
                    color={item.status ? "#4CAF50" : "#FF3C7B"}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No weight history available</Text>
          )}
        </View>
      </ScrollView>

      {/* Full Page Modal for Historical Journeys */}
      <Modal
        visible={showAllJourneys}
        animationType="slide"
        onRequestClose={() => setShowAllJourneys(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle]}>All Historical Journeys</Text>
            <TouchableOpacity onPress={() => setShowAllJourneys(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.modalContent, { paddingBottom: insets.bottom }]}
          >
            {(historicalJourneys || []).map((journey) => (
              <View key={journey.id} style={styles.card}>
                <View style={styles.journeyHeader}>
                  <Text style={styles.sectionTitle}>Journey {journey.id}</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: "#FFE6F0" }]}
                  >
                    <Text style={[styles.statusText, { color: "#FF3C7B" }]}>
                      {journey.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.targetWeightValue}>
                  {journey.daysDiff} days
                </Text>
                <Text style={styles.targetWeightLabel}>Journey Duration</Text>

                {renderProgressBar(
                  journey.start,
                  journey.current,
                  journey.target,
                  journey.startDate,
                  journey.endDate,
                  journey.isActive // Pass the isActive flag
                )}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Sheet Modal for Weight History */}
      <Modal
        visible={showAllHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllHistory(false)}
      >
        <View style={styles.bottomModalOverlay}>
          <View
            style={[
              styles.bottomModalContent,
              { paddingBottom: insets.bottom },
            ]}
          >
            <View style={styles.bottomModalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.bottomModalTitle}>
                <Text style={styles.modalTitle}>All Weight History</Text>
                <TouchableOpacity onPress={() => setShowAllHistory(false)}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.bottomModalScroll}>
              {(weightData?.history || []).map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyWeight}>{item.weight} kg</Text>
                  </View>
                  <View style={styles.downArrow}>
                    <Ionicons
                      name={item.status ? "arrow-up" : "arrow-down"}
                      size={16}
                      color={item.status ? "#4CAF50" : "#FF3C7B"}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#F5F5F5",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentWeightValue: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  currentWeightLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginVertical: 3,
  },
  targetWeightValue: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  targetWeightLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginVertical: 3,
  },
  dateLabel: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 15,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#FF5757",
    fontWeight: "500",
  },
  progressContainer: {
    borderRadius: 5,
    marginVertical: 3,
    position: "relative",
  },
  progressBackgroundDate: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 21,
    height: 6,
    borderRadius: 5,
    backgroundColor: "#F0F0F0",
    zIndex: 1,
  },
  progressBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 5,
    backgroundColor: "#F0F0F0",
    zIndex: 1,
  },
  progressGradient: {
    height: 6,
    borderRadius: 5,
    zIndex: 2,
  },
  markersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  markerItem: {
    alignItems: "center",
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  weightText: {
    fontSize: 12,
    fontWeight: "500",
  },
  weightLabel: {
    fontSize: 10,
    color: "#999",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  journeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: "#1A1A1A",
  },
  historyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    margin: 10,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  historyDate: {
    fontSize: 12,
  },
  historyWeight: {
    fontSize: 12,
    fontWeight: "500",
  },
  downArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  noDataContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
  },
  // Bottom modal styles
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  bottomModalHeader: {
    alignItems: "center",
    paddingTop: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 15,
  },
  bottomModalTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  bottomModalScroll: {
    padding: 15,
  },
});

export default ViewJourney;
