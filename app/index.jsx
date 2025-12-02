import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import WelcomeScreen from "../components/WelcomeScreen";
import { Color, FontFamily } from "../GlobalStyles";
import { loginAPI } from "../services/Api";
import apiConfig from "../services/apiConfig";
import { showToast } from "../utils/Toaster";
import { useFocusEffect } from "@react-navigation/native";
import SkeletonHome from "../components/ui/Home/skeletonHome";
import useBackHandler from "../components/UseBackHandler ";
const { width, height } = Dimensions.get("window");
const baseURL = apiConfig.API_URL;
const WELCOME_SCREEN_VIEWED_KEY = "welcome_screen_viewed";

const Login = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState("client");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const shakeAnimation = new Animated.Value(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  const register = () => {
    router.push("/register");
  };

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(WELCOME_SCREEN_VIEWED_KEY);
      if (value === "true") {
        setShowWelcome(false);
      } else {
        setShowWelcome(true);
      }
    } catch (error) {
      setShowWelcome(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkAuthentication();
    }, [])
  );

  useEffect(() => {
    logoOpacity.setValue(0);
    logoTranslateY.setValue(-20);

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const checkAuthentication = async () => {
    try {
      setInitializing(true);
      const accessToken = await SecureStore.getItemAsync("access_token");
      const clientId = await AsyncStorage.getItem("client_id");
      const role = (await AsyncStorage.getItem("role")) || "client";

      if (!accessToken) {
        setInitializing(false);
        return;
      }

      try {
        const response = await axios.get(`${baseURL}/auth/verify`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 200) {
          router.replace("/client/home");
        }
      } catch (error) {
        if (clientId) {
          try {
            const refreshResponse = await axios.post(
              `${baseURL}/auth/refresh`,
              {
                id: clientId,
                role: role,
              }
            );

            if (refreshResponse?.status === 200) {
              await SecureStore.setItemAsync(
                "access_token",
                refreshResponse.data.access_token
              );
              return checkAuthentication();
            } else {
              await clearTokens();
            }
          } catch (refreshError) {
            await clearTokens();
          }
        } else {
          await clearTokens();
        }
      }

      setInitializing(false);
    } catch (error) {
      await clearTokens();
      setInitializing(false);
    }
  };

  useBackHandler();

  const clearTokens = async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
      checkAuthentication();
    } catch (error) {}
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const login = async () => {
    if (!mobileNumber || !password) {
      shakeInputs();
      return;
    }

    setIsLoading(true);
    const payload = {
      mobile_number: mobileNumber,
      password: password,
      role: role,
    };

    try {
      const response = await loginAPI(payload);

      if (response?.status === 200) {
        router.push({
          pathname: "/OtpVerification",
          params: { mobile: mobileNumber },
        
        });
      } else if (response?.status === 201) {
        router.push({
          pathname: "/verification",
          params: {
            verification: JSON.stringify(response?.data?.verification),
            email: response?.data?.email,
            contact: response?.data?.contact,
            id: response?.data?.id,
          },
        });
      } else if (response?.status === 202) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Incomplete registration. Complete Few More Steps to Get Started!!",
        });
        router.push({
          pathname: "/register/second-step",
          params: {
            email: response?.data?.email,
            contact: response?.data?.contact,
            full_name: response?.data?.full_name,
          },
        });
      } else if (response?.status === 203) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Incomplete registration. Few more steps to get started !!",
        });
        router.push({
          pathname: "/register/age-selector",
          params: {
            email: response?.data?.email,
            contact: response?.data?.contact,
            full_name: response?.data?.full_name,
          },
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
        desc:
          error?.response?.detail ||
          "Something went wrong. Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (initializing) {
    return <SkeletonHome type="home" />;
  }

  return (
    <View style={styles.container}>
      {showWelcome ? (
        <WelcomeScreen setShowWelcome={setShowWelcome} />
      ) : (
        <LinearGradient
          colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
          style={styles.background}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ translateY: logoTranslateY }],
                },
              ]}
            >
              <Text style={styles.logoText}>
                <Text style={styles.logoFirstPart}>Fitt</Text>
                <Text style={styles.logoSecondPart}>bot</Text>
              </Text>
              <View style={styles.logoUnderline} />
              <Text style={styles.tagline}>
                Your Personal Fitness Companion
              </Text>
            </Animated.View>

            <Animatable.View
              animation="fadeInUp"
              duration={800}
              delay={300}
              style={styles.card}
            >
              {/* <Animatable.View
              animation="fadeInDown"
              duration={800}
              delay={400}
              style={styles.welcomeHeaderContainer}
            >
              <Text style={styles.welcomeTitle}>Welcome to Fittbot!!</Text>
              <View style={styles.welcomeBrandContainer}>
                <Text style={styles.gymAdminText}>GYM USER</Text>
              </View>
              <View style={styles.headerDivider} />
            </Animatable.View> */}

              <Animated.View
                style={[
                  styles.formContainer,
                  { transform: [{ translateX: shakeAnimation }] },
                ]}
              >
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#888888"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Mobile Number"
                    style={styles.input}
                    placeholderTextColor="#767676"
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888888"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    style={styles.input}
                    placeholderTextColor="#888888"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={styles.eyeIconContainer}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#888888"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push("/forgotpassword")}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={login}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Animatable.View
                      animation="pulse"
                      easing="ease-out"
                      iterationCount="infinite"
                    >
                      <Ionicons name="fitness" size={24} color="#FFFFFF" />
                    </Animatable.View>
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
                <View style={{ marginVertical: 25 }}>
                  <Text
                    style={{
                      color: "#263148",
                      fontSize: 8,
                      textAlign: "center",
                      lineHeight: 18,
                    }}
                  >
                    By continuing you are agreeing our{" "}
                    <Text
                      style={{ color: "#ff5757" }}
                      onPress={() =>
                        Linking.openURL(
                          "https://fittbot.com/terms-and-conditions/"
                        )
                      }
                    >
                      Terms & Conditions
                    </Text>{" "}
                    and{" "}
                    <Text
                      style={{ color: "#ff5757" }}
                      onPress={() =>
                        Linking.openURL("https://fittbot.com/privacy-policy/")
                      }
                    >
                      Privacy Policies
                    </Text>
                  </Text>
                </View>
                <View
                  style={{
                    marginVertical: 25,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#263148",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    Don't have an account yet?{" "}
                  </Text>
                  <TouchableOpacity onPress={register} disabled={isLoading}>
                    <Text
                      style={[styles.loginButtonText, { color: "#ff5757" }]}
                    >
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </Animatable.View>
          </ScrollView>

          {!keyboardVisible && (
            <Animatable.View
              animation="fadeIn"
              duration={1000}
              delay={600}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                © 2025 NFCTech Fitness Private Limited
              </Text>
            </Animatable.View>
          )}
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: height * 0.12,
    paddingBottom: height * 0.1,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.04,
  },
  logoText: {
    fontSize: 45,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontWeight: "500",
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
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: height * 0.02,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  selectedTabButton: {
    backgroundColor: "#FF5757",
  },
  tabButtonText: {
    marginLeft: 8,
    color: "#888888",
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
  },
  selectedTabButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    // borderWidth: 1,
    borderColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.urbanistMedium,
    color: "#767676",
  },
  eyeIconContainer: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
    color: "#888888",
  },
  loginButton: {
    backgroundColor: "#FF5757",
    width: "75%",
    maxWidth: "300",
    height: 45,
    margin: "auto",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.urbanistSemiBold,
    color: Color.white,
    fontWeight: "bold",
    // letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "#767676",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  createAccountContainer: {
    marginTop: 20,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#888888",
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
  },
  createAccountButton: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  createAccountGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  createAccountIcon: {
    marginRight: 10,
  },
  createAccountText: {
    fontSize: 14,
    fontFamily: FontFamily.urbanistSemiBold,
    color: Color.white,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  welcomeHeaderContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    color: "#333333",
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    marginBottom: 5,
  },
  welcomeBrandContainer: {
    alignItems: "center",
  },
  welcomeBrand: {
    fontSize: 32,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontWeight: "bold",
  },
  brandFirstPart: {
    color: "#FF5757",
  },
  brandSecondPart: {
    color: "#333333",
  },
  gymAdminText: {
    fontSize: 16,
    color: "#666666",
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    marginTop: 2,
    fontWeight: "bold",
  },
  headerDivider: {
    width: 60,
    height: 3,
    backgroundColor: "#FF5757",
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 8,
  },
});

export default Login;
