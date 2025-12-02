// GymStudiosComponent.js
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";

const gyms = [
  {
    id: "1",
    name: "Fittbot gym",
    location: "Jayanagar, Bengaluru",
    image: require("../../../assets/images/gym-image.jpg"),
    rating: 4.8,
    openHours: "5:00 AM - 11:00 PM",
    distance: "2.5 km",
  },
];

const GymStudiosComponent = ({ onSelectGym }) => {
  const GymItem = ({ item }) => {
    return (
      <Animatable.View
        animation="fadeInUp"
        style={styles.gymCard}
        useNativeDriver
      >
        <Image source={item.image} style={styles.gymImage} />
        <View style={styles.gymInfo}>
          <Text style={styles.gymName}>{item.name}</Text>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#FF5757" />
            <Text style={styles.gymLocation}>{item.location}</Text>
          </View>
          <View style={styles.gymDetails}>
            <View style={styles.gymDetailItem}>
              <Ionicons name="star" size={16} color="#FFC107" />
              <Text style={styles.gymDetailText}>{item.rating}</Text>
            </View>
            <View style={styles.gymDetailItem}>
              <Ionicons name="time-outline" size={16} color="#4CAF50" />
              <Text style={styles.gymDetailText}>{item.openHours}</Text>
            </View>
            <View style={styles.gymDetailItem}>
              <MaterialIcons name="directions-walk" size={16} color="#2196F3" />
              <Text style={styles.gymDetailText}>{item.distance}</Text>
            </View>
          </View>
          {Platform.OS === "ios" ? (
            ""
          ) : (
            <TouchableOpacity
              style={styles.prebookButton}
              onPress={() => onSelectGym(item)}
            >
              <Text style={styles.prebookButtonText}>Pre-book Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.contentContainer}>
      <FlatList
        data={gyms}
        renderItem={({ item }) => <GymItem item={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gymsList}
        ListHeaderComponent={
          <Animatable.View
            animation="fadeIn"
            style={styles.gymsHeader}
            useNativeDriver
          >
            <Text style={styles.gymsHeaderTitle}>
              Find Fittbot Partner Gyms Near You
            </Text>
            <Text style={styles.gymsHeaderSubtitle}>
              {Platform.OS === "ios"
                ? ""
                : "Pre-book via fittbot and enjoy exclusive benefits at our partner locations"}
            </Text>
          </Animatable.View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  gymsList: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  gymsHeader: {
    marginBottom: 20,
  },
  gymsHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  gymsHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
  },
  gymCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gymImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  gymInfo: {
    padding: 15,
  },
  gymName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  gymLocation: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  gymDetails: {
    flexDirection: "row",
    marginBottom: 15,
  },
  gymDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  gymDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  prebookButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  prebookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default GymStudiosComponent;
