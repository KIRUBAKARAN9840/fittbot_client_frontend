import { useRouter } from "expo-router";
import React, { useMemo, useCallback } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { Ionicons } from "@expo/vector-icons";
// import TopPageBar from './TopPageBar';
import { FlatList } from "react-native-gesture-handler";
import FoodCard from "../../../components/ui/Diet/FoodCard";
import GradientButton from "../../../components/ui/GradientButton";
const { width, height } = Dimensions.get("window");
import TopPageBar from "../../../components/ui/TopPageBar";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const RenderFoodCards = ({ mockData, showTopBar = true }) => {
  const router = useRouter();

  // Memoize reversed data to prevent recreation on every render
  const reversedData = useMemo(() => [...mockData].reverse(), [mockData]);

  // Memoize renderItem function
  const renderItem = useCallback(({ item }) => (
    <FoodCard
      id={item.id}
      image={item.pic}
      title={item.name}
      calories={item.calories}
      carbs={item.carbs}
      fat={item.fat}
      fiber={item.fiber}
      sugar={item.sugar}
      protein={item.protein}
      quantity={item.quantity}
      onAdd={() => {}}
      time={item.timeAdded}
    />
  ), []);

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler routePath="/client/diet" enabled={true} />

        {showTopBar && (
          <TopPageBar
            title="Today's Food Log"
            navigateTo="/client/addFoodListPage"
            textStyle={{ fontSize: 12 }}
          />
        )}

        <FlatList
          data={reversedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />

        <View style={{ marginBottom: 20 }}>
          <GradientButton
            title="View Full Report"
            fromColor="#28A745"
            toColor="#007BFF"
            onPress={() => {}}
            navigateTo="/client/diet"
            params={{ selectedTab: "Reports" }}
            containerStyle={{ marginTop: 0 }}
            textStyle={{ fontSize: 12 }}
            belowButtonText={"Forgot to Log? Tap Here "}
            onButtonPress2={() =>
              router.push({
                pathname: "/client/addFoodListPage",
                params: { date: new Date() },
              })
            }
          />
        </View>
      </View>
    </>
  );
};

export default RenderFoodCards;

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
    padding: width * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
});
