import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import { editClientProfileAPI, getUUIDAPI } from "../../services/clientApi";
import * as SecureStore from "expo-secure-store";
import { showToast } from "../../utils/Toaster";
import SkeletonProfile from "../../components/ui/Home/skeletonProfile";
import { toIndianISOString } from "../../utils/basicUtilFunctions";

const ProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editData, setEditData] = useState({});
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => {
    getProfileData();
  }, []);

  const getProfileData = async () => {
    setLoading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to load user details",
        });
      }
      const response = await getUUIDAPI(clientId);
      if (response?.status === 200) {
        setProfileData(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to load user details",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to load user details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      name: profileData.name,
      email: profileData.email,
      contact: profileData.contact,
      dob: profileData.dob,
      gender: profileData.gender,
      height: profileData.height.toString(),
      goals: profileData.goals,
      lifestyle: profileData.lifestyle,
      medical_issues: profileData.medical_issues || "",
    });
    setEditModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmNewPassword
    ) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please fill in all the details",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Password must contain atleast 8 characters",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToast({
        type: "error",
        title: "Error",
        desc: "New passwords do not match",
      });
      return;
    }

    try {
      const client_id = await AsyncStorage.getItem("client_id");
      delete passwordData.confirmNewPassword;
      const payload = {
        ...passwordData,
        role: "client",
        method: "password",
        client_id,
      };

      const response = await editClientProfileAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Password Changed Successfully",
        });
        setPasswordModalVisible(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
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
    }
  };

  const handleEditSubmit = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      if (
        !editData.name ||
        !editData.email ||
        !editData.contact ||
        !editData.height ||
        !editData.dob ||
        !editData.gender ||
        !editData.goals ||
        !editData.lifestyle
      ) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Please fill all the required fields",
        });
        return;
      }
      if (editData.contact.length < 10) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Please Enter Valid Mobile Number",
        });
      }

      const payload = {
        ...editData,
        role: "client",
        method: "profile",
        client_id: clientId,
      };

      const response = await editClientProfileAPI(payload);
      if (response?.status === 200) {
        if (response?.is_changed) {
          await AsyncStorage.removeItem("gym_id");
          await AsyncStorage.removeItem("client_id");
          await AsyncStorage.removeItem("gym_name");
          await AsyncStorage.removeItem("role");
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          router.push({
            pathname: "/verification",
            params: {
              verification: JSON.stringify(response.data.verification),
              contact: response.data.contact,
              id: response.data.id,
            },
          });
        } else {
          showToast({
            type: "success",
            title: "Success",
            desc: "Profile Updated Successfully",
          });
          setEditModalVisible(false);
          await getProfileData();
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to update profile",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to update profile",
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = toIndianISOString(selectedDate).split("T")[0];
      setEditData({ ...editData, dob: formattedDate });
    }
  };

  const handleDeleteAccount = () => {
    router.push("/client/deleteaccount");
  };

  const renderGoalText = (goal) => {
    switch (goal) {
      case "weight_loss":
        return "Weight Loss";
      case "weight_gain":
        return "Weight Gain";
      case "muscle_gain":
        return "Muscle Gain";
      case "maintain":
        return "Body Recomposition";
      default:
        return goal;
    }
  };

  const renderLifestyleText = (lifestyle) => {
    switch (lifestyle) {
      case "sedentary":
        return "Sedentary";
      case "lightly_active":
        return "Lightly Active";
      case "moderately_active":
        return "Moderately Active";
      case "very_active":
        return "Very Active";
      case "extremely_active":
        return "Extremely Active";
      default:
        return lifestyle;
    }
  };

  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      color: "black",
      backgroundColor: "#f9f9f9",
      paddingRight: 30,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      color: "black",
      backgroundColor: "#f9f9f9",
      paddingRight: 30,
    },
    iconContainer: {
      top: 10,
      right: 12,
    },
  });

  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  const goalsOptions = [
    { label: "Weight Loss", value: "weight_loss" },
    { label: "Weight Gain", value: "weight_gain" },
    { label: "Muscle Gain", value: "muscle_gain" },
    { label: "Body Recomposition", value: "maintain" },
  ];

  const lifestyleOptions = [
    { label: "Sedentary", value: "sedentary" },
    { label: "Lightly Active", value: "lightly_active" },
    { label: "Moderately Active", value: "moderately_active" },
    { label: "Very Active", value: "very_active" },
    { label: "Extremely Active", value: "extremely_active" },
  ];

  if (loading) {
    return <SkeletonProfile type="profile" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View
          animation="fadeIn"
          style={styles.profileHeader}
          useNativeDriver
        >
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileData.profile }}
              style={styles.profileImage}
            />
          </View>

          <Text style={styles.profileName}>{profileData.name}</Text>
          <Text style={styles.profileEmail}>{profileData.email}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.height} cm</Text>
              <Text style={styles.statLabel}>Height</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.weight} kg</Text>
              <Text style={styles.statLabel}>Weight</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.bmi.toFixed(1)}</Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
          </View>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={300}
          style={styles.infoSection}
          useNativeDriver
        >
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#FF5757" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{profileData.dob}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person-outline" size={20} color="#FF5757" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{profileData.gender}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="call-outline" size={20} color="#FF5757" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{profileData.contact}</Text>
            </View>
          </View>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={600}
          style={styles.infoSection}
          useNativeDriver
        >
          <Text style={styles.sectionTitle}>Fitness Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="fitness-center" size={20} color="#FF5757" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fitness Goal</Text>
              <Text style={styles.infoValue}>
                {renderGoalText(profileData.goals)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <FontAwesome5 name="running" size={20} color="#FF5757" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Lifestyle</Text>
              <Text style={styles.infoValue}>
                {renderLifestyleText(profileData.lifestyle)}
              </Text>
            </View>
          </View>

          {profileData.medical_issues && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <FontAwesome5 name="notes-medical" size={20} color="#FF5757" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Medical Issues</Text>
                <Text style={styles.infoValue}>
                  {profileData.medical_issues}
                </Text>
              </View>
            </View>
          )}
        </Animatable.View>

        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEdit}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setPasswordModalVisible(true)}
          >
            <MaterialIcons name="lock" size={20} color="#fff" />
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.name}
                    onChangeText={(text) =>
                      setEditData({ ...editData, name: text })
                    }
                    placeholder="Your name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.email}
                    onChangeText={(text) =>
                      setEditData({ ...editData, email: text })
                    }
                    placeholder="Your email"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.contact}
                    onChangeText={(text) =>
                      setEditData({ ...editData, contact: text })
                    }
                    placeholder="Your contact number"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text>{editData.dob || "Select date"}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(editData.dob || "2000-01-01")}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      themeVariant="light"
                      textColor="#000000"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <RNPickerSelect
                    onValueChange={(value) =>
                      setEditData({ ...editData, gender: value })
                    }
                    value={editData.gender}
                    items={genderOptions}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={pickerSelectStyles}
                    placeholder={{ label: "Select gender...", value: null }}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.height}
                    onChangeText={(text) =>
                      setEditData({ ...editData, height: text })
                    }
                    placeholder="Your height in cm"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fitness Goals</Text>
                  <RNPickerSelect
                    onValueChange={(value) =>
                      setEditData({ ...editData, goals: value })
                    }
                    value={editData.goals}
                    items={goalsOptions}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={pickerSelectStyles}
                    placeholder={{
                      label: "Select fitness goal...",
                      value: null,
                    }}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Lifestyle</Text>
                  <RNPickerSelect
                    onValueChange={(value) =>
                      setEditData({ ...editData, lifestyle: value })
                    }
                    value={editData.lifestyle}
                    items={lifestyleOptions}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={pickerSelectStyles}
                    placeholder={{ label: "Select lifestyle...", value: null }}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Medical Issues (optional)
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={editData.medical_issues}
                    onChangeText={(text) =>
                      setEditData({ ...editData, medical_issues: text })
                    }
                    placeholder="Any medical issues we should know about"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleEditSubmit}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.passwordModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={passwordData.oldPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, oldPassword: text })
                      }
                      placeholder="Enter current password"
                      secureTextEntry={!showOldPassword}
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setShowOldPassword(!showOldPassword)}
                    >
                      <Ionicons
                        name={
                          showOldPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={passwordData.newPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, newPassword: text })
                      }
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={passwordData.confirmNewPassword}
                      onChangeText={(text) =>
                        setPasswordData({
                          ...passwordData,
                          confirmNewPassword: text,
                        })
                      }
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveButtonPassword}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.saveButtonText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    marginTop: Platform.OS === "ios" ? 0 : 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  profileHeader: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF5757",
    borderRadius: 15,
    padding: 5,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  statDivider: {
    height: 30,
    width: 1,
    backgroundColor: "#eaeaea",
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 15,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 87, 87, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  editProfileButton: {
    backgroundColor: "#FF5757",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 10,
  },
  changePasswordButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginHorizontal: 20,
    maxHeight: "90%",
  },
  passwordModalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FF5757",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    padding: 20,
  },
  passwordForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 55,
    width: "100%",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonPassword: {
    backgroundColor: "#FF5757",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  visibilityToggle: {
    padding: 10,
  },
  deleteAccountButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ProfileScreen;
