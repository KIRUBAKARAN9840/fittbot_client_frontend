import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Color, FontFamily } from "../GlobalStyles";
import { changePasswordAPI } from "../services/Api";
import { showToast } from "../utils/Toaster";

const { width, height } = Dimensions.get("window");

const ChangePassword = () => {
  // Always call hooks at the top level
  const params = useLocalSearchParams();
  const router = useRouter();

  // Extract values
  const mail = params?.mail;
  const mobile = params?.mobile;

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Input handlers
  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    if (errors.newPassword) {
      setErrors((prev) => ({ ...prev, newPassword: null }));
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  // Toggle password visibility
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Validate passwords
  const validatePasswords = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle keyboard dismiss
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Submit form
  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        type: mail ? "email" : "mobile",
        data: mail ? mail : mobile,
        password: newPassword,
        role: "client",
      };

      const response = await changePasswordAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Password changed successfully",
        });
        setTimeout(() => {
          router.push("/");
        }, 2000);
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
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#FFFFFF", "#FFFFFF"]} style={styles.background}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>
                <Text style={styles.logoFirstPart}>Fitt</Text>
                <Text style={styles.logoSecondPart}>bot</Text>
              </Text>
              <View style={styles.logoUnderline} />
              <Text style={styles.tagline}>
                Your Personal Fitness Companion
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.heading}>Change Password</Text>

              <View style={styles.formContainer}>
                {/* New Password Field */}
                <View
                  style={[
                    styles.inputWrapper,
                    errors.newPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888888"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="rgba(0, 0, 0, 0.5)"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIconContainer}
                    onPress={toggleNewPasswordVisibility}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#888888"
                    />
                  </TouchableOpacity>
                </View>

                {errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}

                {/* Confirm Password Field */}
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888888"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(0, 0, 0, 0.5)"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIconContainer}
                    onPress={toggleConfirmPasswordVisibility}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color="#888888"
                    />
                  </TouchableOpacity>
                </View>

                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer - only visible when keyboard is hidden */}
            {!keyboardVisible && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 NFCTech Fitness Private Limited
                </Text>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: height * 0.08,
    marginBottom: height * 0.04,
  },
  logoText: {
    fontSize: 45,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#263148",
  },
  logoUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#FF5757",
    borderRadius: 2,
    marginTop: 5,
  },
  tagline: {
    color: "#263148",
    fontSize: 12,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    padding: 24,
  },
  heading: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    color: "#767676",
    marginBottom: 24,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.urbanistMedium || "sans-serif",
    color: "#333333",
    height: 54,
  },
  eyeIconContainer: {
    padding: 10,
    marginLeft: 5,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  submitButton: {
    backgroundColor: "#FF5757",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    color: Color.white || "#FFFFFF",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  footerText: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
});

export default ChangePassword;
