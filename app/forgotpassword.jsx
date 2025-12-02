import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { FontFamily, Color } from "../GlobalStyles";
import { useRouter } from "expo-router";
import { forgotpasswordAPI, VerifyOTPAPI } from "../services/Api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import OTPInput from "../components/ui/OTPComponent";
import { showToast } from "../utils/Toaster";

const { width, height } = Dimensions.get("window");

const ForgotPassword = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnimation = new Animated.Value(0);
  const [type, setType] = useState("mobile");
  const [otp, SetOtp] = useState(null);
  const [otpSend, setOtpSend] = useState(false);
  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  const [form, setForm] = useState({ email: "", mobile: "" });

  const [errors, setErrors] = useState({});

  const validateForm = (value, inputType) => {
    const newErrors = {};

    if (value.trim().length > 0) {
      if (inputType === "email") {
        if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = "Invalid email format";
        }
      } else if (inputType === "mobile") {
        if (!/^\d+$/.test(value)) {
          newErrors.mobile = "Mobile number should only contain digits";
        } else if (value.length !== 10) {
          newErrors.mobile = "Mobile number should be 10 digits";
        }
      }
    }

    return newErrors;
  };

  const handleSubmit = () => {
    let formErrors;
    if (type === "email") {
      formErrors = validateForm(form.email, "email");
      if (!form.email.trim()) {
        shakeInputs();
        formErrors.email = "Email is required";
      }
    } else {
      formErrors = validateForm(form.mobile, "mobile");
      if (!form.mobile.trim()) {
        shakeInputs();
        formErrors.mobile = "Mobile number is required";
      }
    }

    if (Object.keys(formErrors).length === 0) {
      sendmail(form, type);
    } else {
      setErrors(formErrors);
    }
  };

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

  const sendmail = async (form, type) => {
    setIsLoading(true);
    try {
      if (type == "email") {
        const response = await forgotpasswordAPI(form.email, type);
        if (response?.status === 200) {
          setOtpSend(true);
          showToast({
            type: "success",
            title: "Success",
            desc: "Otp Send Successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } else if (type == "mobile") {
        const response = await forgotpasswordAPI(form.mobile, type);
        if (response?.status === 200) {
          setOtpSend(true);
          showToast({
            type: "success",
            title: "Success",
            desc: "Otp Send Successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
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

  const handleResendOTP = async () => {
    try {
      if (type === "email") {
        const response = await forgotpasswordAPI(form.email, type);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Otp resend Successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } else if (type === "mobile") {
        const response = await forgotpasswordAPI(form.mobile, type);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Otp resend Successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const handleOtp = () => {
    if (otp != null) {
      verifyotp(form, otp);
    } else {
      shakeInputs();
    }
  };

  const verifyotp = async (form, otp) => {
    setIsLoading(true);
    try {
      if (type == "email") {
        const response = await VerifyOTPAPI(form.email, otp);
        if (response?.status === 200) {
          router.push({
            pathname: "/changepassword",
            params: {
              mail: form.email,
            },
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } else if (type == "mobile") {
        const response = await VerifyOTPAPI(form.mobile, otp);
        if (response?.status === 200) {
          router.push({
            pathname: "/changepassword",
            params: {
              mobile: form.mobile,
            },
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
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

  const TabButton = ({ label, icon, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, selected && styles.selectedTabButton]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={"#FF5757"} />
      <Text
        style={[styles.tabButtonText, selected && styles.selectedTabButtonText]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#FFFFFF"]} style={styles.background}>
        {/* <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidContainer}
                > */}
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
            <Text style={styles.tagline}>Your Personal Fitness Companion</Text>
          </Animated.View>

          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.card}
          >
            {!otpSend ? (
              <View>
                <Text style={styles.heading}>Forgot Password</Text>
                <View style={styles.tabContainer}>
                  <TabButton
                    label="Mobile"
                    icon="phone-portrait"
                    selected={type === "mobile"}
                    onPress={() => setType("mobile")}
                  />
                  <TabButton
                    label="Email"
                    icon="mail-unread"
                    selected={type === "email"}
                    onPress={() => setType("email")}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.heading}>Forgot Password</Text>
              </View>
            )}

            <Animated.View
              style={[
                styles.formContainer,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              {otpSend ? (
                <View>
                  <Text style={styles.label}>Please enter the OTP Send</Text>
                  <View style={{ width: "100%" }}>
                    <OTPInput
                      onComplete={(otpValue) => {
                        SetOtp(otpValue);
                      }}
                      onResendOTP={handleResendOTP}
                    />
                  </View>
                  <TouchableOpacity
                    style={
                      otp == null
                        ? styles.loginButtonDisabled
                        : styles.loginButton
                    }
                    onPress={handleOtp}
                    disabled={otp == null}
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
                      <Text style={styles.loginButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {type === "email" ? (
                    <View>
                      {/* <Text style={styles.label}>
                        Please enter your Email Address
                      </Text> */}
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="mail-unread"
                          size={20}
                          color="#888888"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your email"
                          keyboardType="email-address"
                          value={form.email}
                          onChangeText={(value) => {
                            setForm((prev) => ({ ...prev, email: value }));
                            const validationErrors = validateForm(
                              value,
                              "email"
                            );
                            setErrors(validationErrors);
                          }}
                          onPaste={(event) => {
                            const value = event.nativeEvent.text;
                            setForm((prev) => ({ ...prev, email: value }));
                            const validationErrors = validateForm(
                              value,
                              "email"
                            );
                            setErrors(validationErrors);
                          }}
                        />
                      </View>
                      {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View>
                  ) : (
                    <View>
                      {/* <Text style={styles.label}>
                        Please enter your Mobile Number
                      </Text> */}
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="phone-portrait"
                          size={20}
                          color="#888888"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your mobile"
                          keyboardType="phone-pad"
                          value={form.mobile}
                          maxLength={10}
                          onChangeText={(value) => {
                            setForm((prev) => ({ ...prev, mobile: value }));
                            const validationErrors = validateForm(
                              value,
                              "mobile"
                            );
                            setErrors(validationErrors);
                          }}
                          onPaste={(event) => {
                            const value = event.nativeEvent.text;
                            setForm((prev) => ({ ...prev, mobile: value }));
                            const validationErrors = validateForm(
                              value,
                              "mobile"
                            );
                            setErrors(validationErrors);
                          }}
                        />
                      </View>
                      {errors.mobile && (
                        <Text style={styles.errorText}>{errors.mobile}</Text>
                      )}
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSubmit}
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
                      <Text style={styles.loginButtonText}>Get OTP</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.goToLoginContainer}>
                    <TouchableOpacity onPress={() => router.push("/")}>
                      <Text style={styles.goToLoginText}>Go to Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
        {/* </KeyboardAvoidingView> */}
      </LinearGradient>
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
    paddingTop: height * 0.1,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: height * 0.02,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 10 },
    //     shadowOpacity: 0.3,
    //     shadowRadius: 15,
    //   },
    //   android: {
    //     elevation: 10,
    //   },
    // }),
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
    marginHorizontal: 5,
  },
  selectedTabButton: {
    borderBottomColor: "#FF5757",
    color: "#ff5757",
    borderBottomWidth: 2,
  },
  tabButtonText: {
    marginLeft: 8,
    color: "rgba(255,87,87,0.6)",
    fontSize: 14,
  },
  selectedTabButtonText: {
    color: "#FF5757",
    fontWeight: "600",
  },
  heading: {
    color: "#767676",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: height * 0.03,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginTop: 20,
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
    color: "#333333",
  },
  label: {
    fontSize: width * 0.035,
    fontWeight: "500",
    color: "#767676",
    // marginBottom: height * 0.02,
  },
  errorText: {
    color: "#FF0000",
    fontSize: width * 0.03,
    marginBottom: 10,
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
    color: "#FF5757",
  },
  loginButton: {
    backgroundColor: "#FF5757",
    width: "70%",
    marginHorizontal: "auto",
    marginTop: 10,
    height: 40,
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
  loginButtonDisabled: {
    backgroundColor: "#FF5757",
    width: "70%",
    marginHorizontal: "auto",
    marginTop: 10,
    height: 40,
    borderRadius: 12,
    opacity: 0.5,
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
    fontSize: 14,
    fontFamily: FontFamily.urbanistSemiBold,
    color: Color.white,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  loginLinkContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  loginLinkText: {
    color: "#FF5757",
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
    textDecorationLine: "underline",
  },
  goToLoginContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  goToLoginText: {
    color: "#FF5757",
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
    textDecorationLine: "underline",
  },
});

export default ForgotPassword;
