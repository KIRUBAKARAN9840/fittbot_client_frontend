import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  ImageBackground,
  View,
  StyleSheet,
  Dimensions,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMachinesAPI } from "../../../services/clientApi";
import { useRouter } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const Machines = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    fetchMachines();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        router.push({
          pathname: "/client/workout",
          params: { workoutTab: "+Add" },
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const fetchMachines = async () => {
    setLoading(true);

    try {
      const response = await getMachinesAPI();
      if (response?.status === 200) {
        setMachines(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error fetching machines",
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

  const renderHeader = () => (
    <TouchableOpacity
      style={[styles.listHeader, { paddingTop: insets.top + 10 }]}
      onPress={() => {
        router.push("/client/workout");
      }}
    >
      <Ionicons name="arrow-back" size={20} color="#333" />
      <Text style={styles.headerTitle}>Know Your Machineries</Text>
    </TouchableOpacity>
  );

  const handleMachineSelect = (machine) => {
    router.push({
      pathname: "/client/exercise",
      params: {
        machineName: machine.name,
        isMachine: "true",
      },
    });
  };

  const renderItem = useCallback(({ item }) => (
    <View style={styles.workoutCardContainer}>
      <TouchableOpacity
        style={styles.workoutCard}
        activeOpacity={0.8}
        onPress={() => handleMachineSelect(item)}
      >
        <LinearGradient
          colors={["#5299DB66", "#FFFFFF"]}
          style={styles.imageBackground}
        >
          <ImageBackground
            source={{
              uri: item?.image || "https://via.placeholder.com/300x300",
            }}
            style={styles.imageBackground}
            resizeMode="contain"
            imageStyle={styles.backgroundImage}
          >
            <View style={styles.overlay} />
          </ImageBackground>
        </LinearGradient>
      </TouchableOpacity>
      <LinearGradient
        colors={["#FFFFFF", "#DCEFFF"]}
        style={styles.labelContainer}
      >
        <Text style={styles.workoutLabel}>
          {item?.name?.toUpperCase() || ""}
        </Text>
      </LinearGradient>
    </View>
  ), []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {renderHeader()}
      <FlatList
        data={machines}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        columnWrapperStyle={styles.row}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

export default Machines;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  flatListContent: {
    padding: 20,
    paddingBottom: height * 0.1,
  },
  listHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 15,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  workoutCardContainer: {
    width: (width - 60) / 2,
  },
  workoutCard: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  imageBackground: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  labelContainer: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  workoutLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
