import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Share,
  ScrollView,
  Dimensions,
  Animated,
  BackHandler,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyReferralCodeAPI } from "../../services/clientApi";

const { width, height } = Dimensions.get("window");

const getImageContainerHeight = () => {
  const aspectRatio = height / width;

  // For very tall screens (phones with high aspect ratio)
  if (aspectRatio > 2.15) {
    return height * 0.4;
  }
  // For medium aspect ratio phones
  else if (aspectRatio > 1.8) {
    return height * 0.43;
  }
  // For shorter screens (older phones, some tablets)
  else if (aspectRatio > 1.6) {
    return height * 0.47;
  }
  // For tablets and wide screens
  else {
    return height * 0.5;
  }
};

const ReferralScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageHeight = getImageContainerHeight();
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const faqs = [
    {
      question: "How does Referral work?",
      answer:
        "Share your referral code with friends. When they register using your code, you earn ₹100 Fittbot Cash. You'll earn another ₹100 when they purchase a 1-Year Fittbot Subscription.",
    },
    {
      question: "How to refer friends?",
      answer:
        "Simply share your unique referral code through the 'Refer to your friend' button. Your friends need to enter this code during registration.",
    },
    {
      question: "When will I receive my Fittbot Cash?",
      answer:
        "You will receive ₹100 Fittbot Cash immediately when your friend registers, and another ₹100 when they purchase a 1-Year subscription.",
    },
    {
      question: "How can I use my Fittbot Cash?",
      answer:
        "You can use Fittbot Cash for Gym Memberships (10% up to ₹100 per transaction), Personal Training Plans (10% up to ₹100), and Daily Gym Passes (up to 10% of total cost).You cannot use Fittbot Cash for Fittbot Subscription",
    },
    {
      question: "Whether my referred friend earn Fittbot Cash?",
      answer:
        "Your referred friend gets ₹100 Fittbot Cash on successful registration in Fittbot using your referral Code!",
    },
  ];

  const getReferralCode = async () => {
    setLoading(true);
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

      const response = await getMyReferralCodeAPI(clientId);
      if (response?.status === 200) {
        setReferralCode(response?.referral_code);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReferralCode();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/client/home");
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  // Header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, imageHeight * 0.5, imageHeight],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  // Back arrow opacity (inverse of header)
  const backArrowOpacity = scrollY.interpolate({
    inputRange: [0, imageHeight * 0.5, imageHeight],
    outputRange: [1, 1, 0],
    extrapolate: "clamp",
  });

  const toggleFAQ = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const handleCopyReferralCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      showToast({
        type: "success",
        title: "Copied",
        desc: "Referral code copied to clipboard",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to copy referral code",
      });
    }
  };

  const handleShareReferral = async () => {
    try {
      const message = `Try this amazing Fitness App - Fittbot powered by KyraAI.

Use my referral code *${referralCode}* to get ₹100 Fittbot cash now on successful registration.

📱 Download Fittbot:
Android: https://play.google.com/store/apps/details?id=com.fittbot.fittbot_user&hl=en_IN
iOS: https://apps.apple.com/us/app/fittbot/id6747237294

`;

      await Share.share({
        message: message,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to share referral code",
      });
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Initial Back Arrow (visible when image is shown) */}
      <Animated.View
        style={[
          styles.backArrow,
          { top: insets.top + 10, opacity: backArrowOpacity },
        ]}
      >
        <TouchableOpacity onPress={() => router.push("/client/home")}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
      </Animated.View>

      {/* Animated Header (visible when scrolled) */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            opacity: headerOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.push("/client/home")}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={styles.headerPlaceholder} />
      </Animated.View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {/* Header Image Skeleton */}
          <View style={[styles.imageContainer, styles.skeletonBox]} />

          {/* Content Skeleton */}
          <View style={styles.contentContainer}>
            <View style={styles.section}>
              <View style={styles.card}>
                <View
                  style={[
                    styles.skeletonLine,
                    { width: "80%", alignSelf: "center" },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonLine,
                    { width: "90%", alignSelf: "center", marginTop: 10 },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonLine,
                    {
                      width: "60%",
                      height: 30,
                      alignSelf: "center",
                      marginTop: 20,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.referralCodeBox,
                    { marginTop: 20, backgroundColor: "#E1E9EE" },
                  ]}
                />
                <View
                  style={[
                    styles.shareButton,
                    { backgroundColor: "#E1E9EE", marginTop: 16 },
                  ]}
                >
                  <View style={{ height: 14, borderRadius: 4 }} />
                </View>
                <View
                  style={[
                    styles.skeletonLine,
                    { width: "85%", alignSelf: "center", marginTop: 15 },
                  ]}
                />
                <View style={styles.divider} />
                <View
                  style={[
                    styles.skeletonLine,
                    { width: "100%", marginBottom: 12 },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonLine,
                    { width: "100%", marginBottom: 12 },
                  ]}
                />
                <View style={[styles.skeletonLine, { width: "100%" }]} />
              </View>
            </View>

            {/* FAQ Skeleton */}
            <View style={styles.section}>
              <View
                style={[
                  styles.skeletonLine,
                  { width: 200, marginLeft: 16, marginBottom: 16 },
                ]}
              />
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.faqItem}>
                  <View style={styles.faqQuestion}>
                    <View style={[styles.skeletonLine, { width: "80%" }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Header Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/refer.png")}
              style={styles.image}
            />
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Referral Code Section */}
            <View style={styles.section}>
              <View style={styles.card}>
                <Text
                  style={{
                    color: "#1A1A1A",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 5,
                  }}
                >
                  Win exciting rewards with every referral!
                </Text>
                <Text style={styles.cardSubtitle}>
                  When you refer a friend to Fittbot, you earn upto ₹200 !
                </Text>

                <Text style={styles.cardMain}>Get ₹200 Fittbot Cash</Text>

                <View style={styles.referralContainer}>
                  <View style={styles.referralCodeBox}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={styles.referralLabel}>Code :</Text>
                      <Text style={styles.referralCodeText}>
                        {referralCode}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={handleCopyReferralCode}>
                      <View style={styles.referralCodeRow}>
                        <Ionicons
                          name="copy-outline"
                          size={20}
                          color="#794AB9"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareReferral}
                >
                  <LinearGradient
                    colors={["#7749B9", "#DF79BF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shareButtonGradient}
                  >
                    <Text style={styles.shareButtonText}>
                      Refer to your friend
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(69,69,69,0.53)",
                    textAlign: "center",
                    marginTop: 8,
                    lineHeight: 16,
                  }}
                >
                  Your referred friend gets ₹100 Fittbot Cash on successful
                  registration in Fittbot using your referral Code!
                </Text>

                <View style={styles.divider} />

                <View style={styles.earnItem}>
                  <View style={styles.bulletContainer}>
                    <View style={styles.bullet} />
                  </View>
                  <Text style={styles.earnText}>
                    You earn <Text style={styles.earnAmount}>₹100</Text> for
                    every successful registration of your Friend!.
                  </Text>
                </View>

                <View style={styles.earnItem}>
                  <View style={styles.bulletContainer}>
                    <View style={styles.bullet} />
                  </View>
                  <Text style={styles.earnText}>
                    You earn another <Text style={styles.earnAmount}>₹100</Text>{" "}
                    , if your referred friend purchases 1 Year Fittbot
                    Subscription
                  </Text>
                </View>

                <View style={styles.earnItem}>
                  <View style={styles.bulletContainer}>
                    <View style={styles.bullet} />
                  </View>
                  <Text style={styles.earnText}>
                    You will receive your bonus amount in rewards section within
                    48 hours once your friend uses your code.
                  </Text>
                </View>
              </View>
            </View>

            {/* FAQ Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Frequently Asked Questions
              </Text>

              {faqs.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => toggleFAQ(index)}
                  >
                    <Text style={styles.questionText}>{faq.question}</Text>
                    <Ionicons
                      name={expanded === index ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {expanded === index && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.answerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: getImageContainerHeight(),
  },
  image: {
    width: "100%",
    height: "100%",
    contentFit: "cover",
  },
  backArrow: {
    position: "absolute",
    left: 15,
    zIndex: 10,
    padding: 5,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 12,
    zIndex: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerBackButton: {
    padding: 5,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  section: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1A1A1A",
    marginBottom: 16,
    paddingLeft: 16,
  },
  highlightText: {
    color: "#FF5757",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardMain: {
    color: "#915DC0",
    fontSize: 20,
    textAlign: "center",
    fontWeight: 600,
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  referralContainer: {
    marginBottom: 16,
  },
  referralCodeBox: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#794AB9",
    borderStyle: "dashed",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  referralLabel: {
    fontSize: 10,
    color: "#999",
  },
  referralCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  referralCodeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 1,
  },
  shareButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  shareButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
  },
  earnItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bulletContainer: {
    marginTop: 6,
    marginRight: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(69,69,69,0.53)",
  },
  earnText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  earnAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#794AB9",
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  questionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  answerText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonBox: {
    backgroundColor: "#E1E9EE",
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
});

export default ReferralScreen;
