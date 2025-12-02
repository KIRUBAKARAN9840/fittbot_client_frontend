import React, { useCallback } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  BackHandler,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
const { width } = Dimensions.get("window");

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.getDate().toString();
};

const getCurrentMonthName = () => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentDate = new Date();
  return months[currentDate.getMonth()];
};

const ChartCard = ({ title, data = [], color, unit }) => {
  // Added a default empty array for data to prevent undefined errors

  // Check if data exists and has at least one item
  // if (!data || data.length === 0) {
  //   return (
  //     <View style={styles.chartCard}>
  //       <Text style={styles.chartTitle}>{title}</Text>
  //       <View>
  //         <Text style={styles.warn}>No data available to analyze</Text>
  //       </View>
  //     </View>
  //   );
  // }

  const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
  const formattedDates = (sortedData || []).map((item) => formatDate(item.date));

  const values = (sortedData || []).map((item) => {
    const value = Object.values(item)[1];
    return value === null ? 0 : value;
  });

  // Calculate max value and add padding for professional chart look
  const maxValue = Math.max(...values);
  const paddedMax = maxValue * 1.2; // Add 20% padding at top

  // Add a 0 value at start to ensure proper Y-axis scaling
  const chartValues = [0, ...values];
  const chartLabels = ["", ...formattedDates];

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => color(opacity),
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "2",
      strokeWidth: "2",
      stroke: color(0.8),
    },
  };

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>

      <LineChart
        data={{
          labels: chartLabels,
          datasets: [{ data: chartValues }],
        }}
        width={width - 60}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
        yAxisSuffix={` ${unit}`}
        fromZero={true}
        segments={5}
        yAxisInterval={1}
        formatYLabel={(value) => {
          const num = parseFloat(value);
          return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toFixed(0);
        }}
      />
    </View>
  );
};

const HomeCharts = () => {
  const { chartDatas } = useLocalSearchParams();
  const router = useRouter();
  const currentMonth = getCurrentMonthName();
  const insets = useSafeAreaInsets();
  // Safely parse the JSON data, with error handling
  let parsedChartData;
  try {
    parsedChartData = JSON.parse(chartDatas);
  } catch (_error) {
    parsedChartData = {
      weight: [],
      calories: [],
      calories_burnt: [],
      protein: [],
      fat: [],
      carbs: [],
      water_intake: [],
    };
  }

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          router.push("/client/home");
          return true;
        }
      );

      return () => backHandler.remove();
    }, [])
  );

  const chartConfigs = [
    {
      title: "Weight Progress",
      data: Array.isArray(parsedChartData?.weight)
        ? parsedChartData.weight
        : [],
      color: (opacity = 1) => `rgba(255, 87, 87, ${opacity})`,
      unit: "kg",
    },
    {
      title: "Calories Intake",
      data: Array.isArray(parsedChartData?.calories)
        ? parsedChartData.calories
        : [],
      color: (opacity = 1) => `rgba(71, 144, 233, ${opacity})`,
      unit: "cal",
    },
    {
      title: "Calories Burnt",
      data: Array.isArray(parsedChartData?.calories_burnt)
        ? parsedChartData.calories_burnt
        : [],
      color: (opacity = 1) => `rgba(71, 144, 233, ${opacity})`,
      unit: "cal",
    },
    {
      title: "Protein Intake",
      data: Array.isArray(parsedChartData?.protein)
        ? parsedChartData.protein
        : [],
      color: (opacity = 1) => `rgba(106, 176, 76, ${opacity})`,
      unit: "g",
    },
    {
      title: "Fat Intake",
      data: Array.isArray(parsedChartData?.fat) ? parsedChartData.fat : [],
      color: (opacity = 1) => `rgba(235, 169, 83, ${opacity})`,
      unit: "g",
    },
    {
      title: "Carbs Intake",
      data: Array.isArray(parsedChartData?.carbs) ? parsedChartData.carbs : [],
      color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
      unit: "g",
    },
    {
      title: "Water Intake",
      data: Array.isArray(parsedChartData?.water_intake)
        ? parsedChartData.water_intake
        : [],
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      unit: "L",
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/client/home")}
        >
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Health Dashboard - {currentMonth}
        </Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.chartsContainer}>
          {chartConfigs.map((config, index) => (
            <ChartCard key={index} {...config} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#333",
  },
  chartsContainer: {
    gap: 20,
    paddingBottom: 20,
    marginTop: 20,
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  warn: {
    color: "red",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

export default HomeCharts;
