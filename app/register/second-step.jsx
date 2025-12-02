import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import OTPInput from "../../components/ui/OTPInput";
import {
  registerUserOTPVerification,
  resendOTPAPI,
} from "../../services/clientApi";
import { showToast } from "../../utils/Toaster";
import { Image } from "expo-image";
import * as Animatable from "react-native-animatable";

const OTPVerificationScreen = () => {
  const { full_name, email, contact } = useLocalSearchParams();
  const [otpValue, setOtpValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoVerifyInitiated, setAutoVerifyInitiated] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const lastVerifiedOTP = useRef(null);
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const handleOTPComplete = (otp) => {
    setOtpValue(otp);
    setEntering(true);
    // Only auto-verify if:
    // 1. OTP is complete (6 digits)
    // 2. Not currently loading
    // 3. Auto-verify not already initiated
    // 4. This OTP hasn't been verified before (prevents re-verification of failed OTP)
    if (
      otp &&
      otp.length === 6 &&
      !isLoading &&
      !autoVerifyInitiated &&
      lastVerifiedOTP.current !== otp
    ) {
      setAutoVerifyInitiated(true);
      lastVerifiedOTP.current = otp; // Track this OTP as attempted
      handleVerify(otp);
    }
  };

  const handleResendOTP = async () => {
    try {
      // Reset states when resending OTP
      setOtpValue("");
      setAutoVerifyInitiated(false);
      setVerificationFailed(false);
      lastVerifiedOTP.current = null; // Reset the tracked OTP

      const id = null;
      const type = "mobile";
      const role = "client";

      const response = await resendOTPAPI(contact, type, role, id);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "OTP resent successfully",
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

  const handleVerify = async (manualOtp = null) => {
    const otpToVerify = manualOtp || otpValue;
    setEntering(true);
    if (!otpToVerify) return;

    try {
      const response = await registerUserOTPVerification({
        data: contact,
        otp: otpToVerify,
      });

      if (response?.status === 200) {
        setIsLoading(true);
        setTimeout(() => {
          showToast({
            type: "success",
            title: "Registration",
            desc: response?.message,
          });

          router.push({
            pathname: "/register/age-selector",
            params: {
              full_name,
              email,
              contact,
            },
          });
        }, 2000);
      } else {
        // Clear OTP and set verification failed state
        setOtpValue("");
        setVerificationFailed(true);
        setAutoVerifyInitiated(false);
        setEntering(false);

        showToast({
          type: "error",
          title: "Error",
          desc: "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      // Clear OTP and set verification failed state
      setOtpValue("");
      setVerificationFailed(true);
      setAutoVerifyInitiated(false);
      setEntering(false);

      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      if (isLoading) {
        setTimeout(() => {
          setIsLoading(false);
        }, 2800);
      }
    }
  };

  const handleChangeNumber = () => {
    router.push("/register");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {isLoading ? (
        <Image
          source={require("../../assets/gif/welcome.gif")}
          style={styles.topImage}
          contentFit="contain"
        />
      ) : (
        <Image
          source={require("../../assets/images/OTP 2.png")}
          style={styles.topImage}
          contentFit="contain"
        />
      )}

      <Text style={styles.title}>OTP Verification</Text>

      <Text style={styles.subtitle}>
        Enter the OTP sent to{" "}
        <Text style={{ color: "#263148" }}>{contact}</Text>
      </Text>

      <OTPInput
        onComplete={handleOTPComplete}
        resend={false}
        onResendOTP={handleResendOTP}
        clearOTP={verificationFailed} // Pass this prop to clear OTP input
      />

      <TouchableOpacity
        style={[
          styles.verifyButton,
          !otpValue ? styles.verifyButtonDisabled : styles.verifyButtonEnabled,
        ]}
        onPress={() => handleVerify()}
        disabled={!otpValue || entering}
      >
        {entering ? (
          <Animatable.View
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
          >
            <Ionicons name="fitness" size={24} color="#FFFFFF" />
          </Animatable.View>
        ) : (
          <Text style={styles.verifyButtonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <View style={styles.changeNumberContainer}>
        <Text style={styles.changeNumberText}>
          Want to change mobile number?{" "}
          <Text onPress={handleChangeNumber} style={styles.changeButton}>
            Change!
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default OTPVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  topImage: {
    width: 260,
    height: 190,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#696969",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 14,
    color: "#767676",
    marginBottom: 0,
  },
  verifyButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 30,
  },
  verifyButtonEnabled: {
    backgroundColor: "#FF5757",
  },
  verifyButtonDisabled: {
    backgroundColor: "#EFEFEF",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  verifyButtonTextDisabled: {
    color: "#767676",
    fontSize: 16,
    fontWeight: "600",
  },
  changeNumberContainer: {
    marginTop: 10,
  },
  changeNumberText: {
    fontSize: 14,
    color: "#888",
  },
  changeButton: {
    color: "#FF5757",
    fontWeight: "600",
  },
});
