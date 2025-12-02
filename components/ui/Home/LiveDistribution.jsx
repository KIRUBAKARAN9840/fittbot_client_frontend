import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";

const LiveDistribution = ({ USERS, onPress }) => {
  const renderUserCard = (item, index) => (
    <View key={index} style={styles.userCard}>
      <View style={styles.userInfo}>
        <Image
          source={item?.profile}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <Text style={styles.userName}>{item?.name}</Text>
      </View>
    </View>
  );
  const displayUsers = USERS?.slice(0, 4);

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        <Text style={styles.gymSectionTitle}>Active Members</Text>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listContent}>
          {displayUsers?.map((user, index) => renderUserCard(user, index))}
          {USERS?.length > 4 && (
            <View style={styles.moreUsersIndicator}>
              <TouchableOpacity style={styles.moreUsersText} onPress={onPress}>
                <Text> +{USERS?.length - 4} more users</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  gymSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  statusIndicator: {
    width: 11,
    height: 11,
    borderRadius: 8,
    backgroundColor: "#2ECC71",
  },
  listContainer: {
    width: "100%",
    paddingHorizontal: 5,
  },
  listContent: {
    padding: 10,
    paddingBottom: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 24,
    marginRight: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  moreUsersIndicator: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  moreUsersText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});

export default LiveDistribution;
