import React, { useState, useEffect, use } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FetchBlockedUsersAPI, UnblockUserAPI } from "../../services/Api";

import { showToast } from "../../utils/Toaster";
import SkeletonFeeds from "../../components/ui/Feed/skeletonFeed";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardScreenWidth = 392;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const BlockedUsersScreen = ({
  onScroll,
  scrollEventThrottle,
  headerHeight,
}) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [selectedBlockedUser, setSelectedBlockedUser] = useState(null);
  const [unblockModalVisible, setUnblockModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const getBlockedUsers = async () => {
    setLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");
      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const role = "client";
      const response = await FetchBlockedUsersAPI(clientId, role);
      if (response?.status === 200) {
        setBlockedUsers(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to fetch blocked users",
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

  const handleUnblockUser = (user) => {
    setSelectedBlockedUser(user);
    setUnblockModalVisible(true);
  };

  const confirmUnblockUser = async () => {
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");
      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const payload = {
        user_id: clientId,
        gym_id: gymId,
        blocked_user_id:
          selectedBlockedUser.role == "client"
            ? selectedBlockedUser.client_id
            : selectedBlockedUser.gym_id,
        user_role: "client",
        blocked_user_role: selectedBlockedUser.role,
      };

      const response = await UnblockUserAPI(payload);
      if (response?.status === 200) {
        await getBlockedUsers();
        showToast({
          type: "success",
          title: "Success",
          desc: "User unblocked successfully",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setUnblockModalVisible(false);
      setSelectedBlockedUser(null);
    }
  };
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getBlockedUsers();
  }, []);

  if (loading) {
    return <SkeletonFeeds type="offers" priority="high" />;
  }

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      edges={["top"]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.push("/client/home")}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/client/home")}>
          <Text style={styles.headerTitle}>Blocked Users</Text>
        </TouchableOpacity>
      </View>
      {blockedUsers.length === 0 ? (
        <View style={styles.noBlockedUsersContainer}>
          <MaterialIcons name="block" size={50} color="#CBD5E0" />
          <Text style={styles.noBlockedUsersText}>No blocked users</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) =>
            item.role === "client"
              ? item.client_id.toString()
              : item.gym_id.toString()
          }
          renderItem={({ item }) => (
            <View style={styles.blockedUserItem}>
              <View>
                <Text style={styles.blockedUserName}>{item.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblockUser(item)}
              >
                <Text style={styles.unblockButtonText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={[
            styles.blockedUsersList,
            { paddingTop: headerHeight + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
        />
      )}

      {unblockModalVisible && (
        <TouchableWithoutFeedback onPress={() => setUnblockModalVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.confirmModalContainer}>
                <View style={styles.confirmHeader}>
                  <Text style={styles.confirmTitle}>Unblock User</Text>
                </View>
                <View style={styles.confirmContent}>
                  <Text style={styles.confirmQuestion}>
                    Are you sure you want to unblock {selectedBlockedUser?.name}
                    ? Their posts will appear in your feed again.
                  </Text>

                  <View style={styles.confirmButtonRow}>
                    <TouchableOpacity
                      style={[styles.confirmButton, styles.cancelButton]}
                      onPress={() => setUnblockModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        styles.confirmUnblockButton,
                      ]}
                      onPress={confirmUnblockUser}
                    >
                      <Text style={styles.confirmUnblockButtonText}>
                        Yes, Unblock
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    marginBottom: Platform.OS === "ios" ? 50 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: Platform.OS === "ios" ? 0 : 0,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },

  noBlockedUsersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noBlockedUsersText: {
    marginTop: 12,
    fontSize: 16,
    color: "#777",
  },
  blockedUsersList: {
    paddingBottom: 20,
    marginTop: 10,
  },
  blockedUserItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  blockedUserName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  blockedUserRole: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  unblockButton: {
    backgroundColor: "#024172",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unblockButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  confirmModalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  confirmContent: {
    padding: 16,
  },
  confirmQuestion: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "center",
    marginVertical: 20,
  },
  confirmButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  confirmUnblockButton: {
    backgroundColor: "#024172",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmUnblockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default BlockedUsersScreen;
