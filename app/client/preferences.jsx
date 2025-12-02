import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { registerForPushNotificationsAsync } from "../../components/usePushNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NotificationPreferences = () => {
  const router = useRouter();
  // State for all toggle switches
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  const [newslettersEnabled, setNewslettersEnabled] = useState(false);
  const [promosEnabled, setPromosEnabled] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    setNotificationsEnabled(data.notifications || false);
    setRemindersEnabled(data.reminders || false);
    setDataSharingEnabled(data.data_sharing || false);
    setNewslettersEnabled(data.newsletters || false);
    setPromosEnabled(data.promos || false);
    // try {
    // //   Replace with your actual API call
    //     const response = await fetch(
    //       `YOUR_API_ENDPOINT/notification-preferences/${client_id}`
    //     );
    //     const data = await response.json();

    //   Update state with fetched preferences
    //   setNotificationsEnabled(data.notifications || false);
    //   setRemindersEnabled(data.reminders || false);
    //   setDataSharingEnabled(data.data_sharing || false);
    //   setNewslettersEnabled(data.newsletters || false);
    //   setPromosEnabled(data.promos || false);
    // } catch (error) {
    //   console.error("Failed to fetch notification preferences:", error);
    // }
  };

  const updatePreference = async (preferenceName, value) => {
    try {
      // Replace with your actual API call
      const response = await fetch("YOUR_API_ENDPOINT/update-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: client_id,
          preference_name: preferenceName,
          value: value,
        }),
      });

      if (!response.ok) {
        // Handle error
        throw new Error("Failed to update preference");
      }

      // If we need to handle push notifications
      if (preferenceName === "notifications" && value === true) {
        const client_id = await AsyncStorage.getItem("client_id");

        const token = await registerForPushNotificationsAsync(client_id);
      }
    } catch (error) {
      console.error("Failed to update preference:", error);
      // Revert the switch if the API call failed
      switch (preferenceName) {
        case "notifications":
          setNotificationsEnabled(!value);
          break;
        case "reminders":
          setRemindersEnabled(!value);
          break;
        case "data_sharing":
          setDataSharingEnabled(!value);
          break;
        case "newsletters":
          setNewslettersEnabled(!value);
          break;
        case "promos":
          setPromosEnabled(!value);
          break;
      }
    }
  };

  const handleNotificationsToggle = (value) => {
    setNotificationsEnabled(value);
    // updatePreference("notifications", value);
  };

  const handleRemindersToggle = (value) => {
    setRemindersEnabled(value);
    // updatePreference("reminders", value);
  };

  const handleDataSharingToggle = (value) => {
    setDataSharingEnabled(value);
    // updatePreference("data_sharing", value);
  };

  const handleNewslettersToggle = (value) => {
    setNewslettersEnabled(value);
    // updatePreference("newsletters", value);
  };

  const handlePromosToggle = (value) => {
    setPromosEnabled(value);
    // updatePreference("promos", value);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/client/home")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
      </View>

      <View style={styles.preferencesContainer}>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </View>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Receive workout, diet, water and other useful notifications
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#f4f4f4", true: "#ff6b6b" }}
            thumbColor={notificationsEnabled ? "#fff" : "#fff"}
            ios_backgroundColor="#f4f4f4"
            onValueChange={handleNotificationsToggle}
            value={notificationsEnabled}
            style={styles.switch}
          />
        </View>

        {/* Data Sharing */}
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceIconContainer}>
            <Feather name="share-2" size={24} color="#666" />
          </View>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>Data Sharing</Text>
            <Text style={styles.preferenceDescription}>
              Allow your gym administrator to access your workout and diet data
              for personal training
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#f4f4f4", true: "#ff6b6b" }}
            thumbColor={dataSharingEnabled ? "#fff" : "#fff"}
            ios_backgroundColor="#f4f4f4"
            onValueChange={handleDataSharingToggle}
            value={dataSharingEnabled}
            style={styles.switch}
          />
        </View>

        {/* Newsletters */}
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceIconContainer}>
            <MaterialIcons name="mail-outline" size={24} color="#666" />
          </View>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>Newsletters</Text>
            <Text style={styles.preferenceDescription}>
              Receive monthly newsletters with fitness tips and gym updates
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#f4f4f4", true: "#ff6b6b" }}
            thumbColor={newslettersEnabled ? "#fff" : "#fff"}
            ios_backgroundColor="#f4f4f4"
            onValueChange={handleNewslettersToggle}
            value={newslettersEnabled}
            style={styles.switch}
          />
        </View>

        {/* Promos and offers */}
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceIconContainer}>
            <FontAwesome name="gift" size={22} color="#666" />
          </View>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>Promos and offers</Text>
            <Text style={styles.preferenceDescription}>
              Get exclusive discounts and special promotional offers
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#f4f4f4", true: "#ff6b6b" }}
            thumbColor={promosEnabled ? "#fff" : "#fff"}
            ios_backgroundColor="#f4f4f4"
            onValueChange={handlePromosToggle}
            value={promosEnabled}
            style={styles.switch}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    marginTop: Platform.OS === "ios" ? 10 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    marginTop: 25,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
  },
  preferencesContainer: {
    marginTop: 15,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    marginHorizontal: 15,
  },
  preferenceIconContainer: {
    width: 40,
    alignItems: "center",
  },
  preferenceTextContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  preferenceDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default NotificationPreferences;
