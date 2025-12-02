import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const ProfileModalComponent = ({
  visible,
  onClose,
  onNavigateToProfile,
  onNavigateToActivate,
  onNavigateToSubscription,
  onLogout,
  joinedGym,
  onShowGymStudios,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.profileModalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.profileDivider} />
          <TouchableOpacity
            style={styles.profileOption}
            onPress={() => {
              onClose();
              onNavigateToProfile();
            }}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.profileOptionText}>My Profile</Text>
          </TouchableOpacity>
          {joinedGym && (
            <>
              <View style={styles.profileDivider} />

              <TouchableOpacity
                style={styles.profileOption}
                onPress={() => {
                  onClose();
                  onShowGymStudios();
                }}
              >
                <Ionicons name="barbell" size={24} color="#333" />
                <Text style={styles.profileOptionText}>Gym Studios</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.profileDivider} />
          <TouchableOpacity
            style={styles.profileOption}
            onPress={() => {
              onClose();
              onNavigateToActivate();
            }}
          >
            <View style={styles.statusContainer}>
              {joinedGym ? (
                <Ionicons name="fitness" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="fitness-outline" size={24} color="#F44336" />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.profileOptionTextNo}>
                Manage Gym Membership
              </Text>
              <Text
                style={[
                  styles.statusText,
                  { color: joinedGym ? "#4CAF50" : "#F44336" },
                ]}
              >
                {joinedGym ? "Active" : "Not joined"}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.profileDivider} />
          {Platform.OS === "ios" ? (
            ""
          ) : (
            <TouchableOpacity
              style={styles.profileOption}
              onPress={() => {
                onClose();
                onNavigateToSubscription();
              }}
            >
              <Ionicons name="card-outline" size={24} color="#333" />
              <Text style={styles.profileOptionText}>My Subscription</Text>
            </TouchableOpacity>
          )}

          <View style={styles.profileDivider} />
          <TouchableOpacity
            style={styles.profileOption}
            onPress={() => {
              onClose();
              onLogout();
            }}
          >
            <MaterialIcons name="logout" size={24} color="#333" />
            <Text style={styles.profileOptionText}>Log out</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  profileModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  profileOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  profileOptionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  profileOptionTextNo: {
    fontSize: 16,
    color: "#333",
  },
  profileDivider: {
    height: 1,
    backgroundColor: "#eee",
    width: "100%",
  },
  statusContainer: {
    width: 24,
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProfileModalComponent;
