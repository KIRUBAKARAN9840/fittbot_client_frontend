import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const FitbotWelcomeScreen = ({ visible, onClose, userName = "User", data }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const getRecommendedPlan = () => {
    const months = data?.fittbot_duration_months || 1;

    if (months < 1) {
      return "1";
    } else if (months <= 6) {
      return "6";
    } else {
      return "12";
    }
  };

  const getPlanImage = () => {
    const months = data?.fittbot_duration_months || 1;

    try {
      if (months < 1) {
        return require("../../../assets/images/home/1_month.png");
      } else if (months <= 6) {
        return require("../../../assets/images/home/6_month.png");
      } else {
        return require("../../../assets/images/home/12_month.png");
      }
    } catch (error) {
      return require("../../../assets/images/home/12_month.png");
    }
  };

  const getCategoryDisplay = () => {
    const category = data?.category;

    if (category === "weight_loss") return "Weight Loss";
    if (category === "weight_gain") return "Weight Gain";
    if (category === "body_recomposition" || category === "maintain")
      return "Body Recomposition";
    return category || "Goal";
  };

  const shouldShowCharts = () => {
    const category = data?.category;
    return category !== "maintain" && category !== "body_recomposition";
  };

  const renderCloseButton = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require("../../../assets/images/kyra_welcome.png")}
            style={styles.profileImage}
          />
          <Text style={styles.welcomeText}>
            Welcome to <Text style={styles.fitbotText}>Fitt</Text>bot,{" "}
            {userName?.split(" ")[0]}
          </Text>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.subtitleText}>
            "Your personalized health journey begins now. Let's make your
            transformation smart, simple, and effective."
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFreeTrialCard = () => (
    <View style={styles.freeTrialContainer}>
      <View style={styles.freeTrialCard}>
        <View style={styles.freeTrialDot} />
        <View style={styles.freeTrialContent}>
          <View style={styles.freeTrialLeft}>
            <View style={styles.freeTrialTextContainer}>
              {/* <Text style={styles.freeTrialEmoji}>💪</Text> */}
              <Text style={styles.freeTrialTitle}>
                💪 7-Day Free Trial Access
              </Text>
              <Text style={styles.freeTrialSubtitle}>
                Explore our best features before choosing your plan.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.claimButton}>
            <LinearGradient
              colors={["#5B2B9B", "#FF3C7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.claimButtonGradient}
            >
              <Text style={styles.claimButtonText}>Claim Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderYourStats = () => (
    <View style={styles.statsSection}>
      <LinearGradient
        colors={["#5B2B9B", "#FF3C7B", "#F8F4FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statsHeader}
      >
        <Text style={styles.statsTitle}>Your Stats</Text>
      </LinearGradient>

      <View style={styles.statsContent}>
        <View style={styles.statsLeft}>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current weight</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.trophyIcon}>🏆</Text>
              <Text style={styles.statValue}>Current </Text>
              <Text style={styles.statWeight}>
                {data?.current_weight || 50} kg
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Target weight</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.trophyIcon}>🏆</Text>
              <Text style={styles.statValue}>Target </Text>
              <Text style={styles.statWeight}>
                {data?.target_weight || 70} kg
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRight}>
          <Image
            source={
              data?.character_url
                ? { uri: data.character_url }
                : require("../../../assets/images/transformation/male/sample.png")
            }
            style={styles.transformationImage}
          />
        </View>
      </View>

      <View style={styles.bottomStats}>
        <View style={styles.bottomStatItem}>
          <Text style={styles.bottomStatValue}>{data?.height || 185} cm</Text>
          <Text style={styles.bottomStatLabel}>Height</Text>
        </View>
        <View style={styles.bottomStatItem}>
          <Text style={styles.bottomStatValue}>{data?.bmi || 27.3}</Text>
          <Text style={styles.bottomStatLabel}>BMI</Text>
        </View>
        <View style={styles.bottomStatItem}>
          <Text style={styles.bottomStatValue}>{getCategoryDisplay()}</Text>
          <Text style={styles.bottomStatLabel}>Goal</Text>
        </View>
      </View>
    </View>
  );

  const renderChart = (title, timeLabel, isWithFitbot = false) => {
    const targetWeight = data?.target_weight || 70;
    const upperWeight = targetWeight + 5;
    const lowerWeight = targetWeight - 5;
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartCard}>
          {isWithFitbot ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <Text style={[styles.chartTitle]}>With </Text>

              <Text style={[styles.chartTitle, { color: "#FF5757" }]}>
                Fitt
              </Text>
              <Text style={[styles.chartTitle]}>bot Plans</Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <Text style={[styles.chartTitle]}>Without </Text>

              <Text style={[styles.chartTitle, { color: "#000000" }]}>
                Fitt
              </Text>
              <Text style={[styles.chartTitle]}>bot</Text>
            </View>
          )}
          <View style={styles.chartContent}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>{upperWeight} kg</Text>
              <Text style={styles.yAxisLabel}>{targetWeight} kg</Text>
              <Text style={styles.yAxisLabel}>{lowerWeight} kg</Text>
            </View>

            <View style={styles.chartArea}>
              <View style={styles.chartBackground}>
                <View style={[styles.gridLine, { top: 0 }]} />
                <View style={[styles.gridLine, { top: "50%" }]} />
                <View style={[styles.gridLine, { bottom: 0 }]} />
              </View>

              <View style={styles.chartImageContainer}>
                {isWithFitbot ? (
                  <Image
                    source={require("../../../assets/images/graph_fittbot.png")}
                    style={styles.chartImage}
                    contentFit="contain"
                  />
                ) : (
                  <Image
                    source={require("../../../assets/images/graph.png")}
                    style={styles.chartImage}
                    contentFit="contain"
                  />
                )}

                <View
                  style={[
                    styles.timeLabel,
                    isWithFitbot
                      ? styles.timeLabelWithFitbot
                      : styles.timeLabelWithoutFitbot,
                  ]}
                >
                  <Text style={styles.timeLabelText}>{timeLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* <View style={styles.xAxis}>
            <Text style={styles.xAxisLabel}>1 month</Text>
            <Text style={styles.xAxisLabel}>3 month</Text>
            <Text style={styles.xAxisLabel}>6 month</Text>
            <Text style={styles.xAxisLabel}>1 year</Text>
          </View> */}
        </View>
      </View>
    );
  };

  const renderChartLoss = (title, timeLabel, isWithFitbot = false) => {
    const targetWeight = data?.target_weight || 70;
    const upperWeight = targetWeight + 5;
    const lowerWeight = targetWeight - 5;
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartCard}>
          {isWithFitbot ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <Text style={[styles.chartTitle]}>With </Text>

              <Text style={[styles.chartTitle, { color: "#FF5757" }]}>
                Fitt
              </Text>
              <Text style={[styles.chartTitle]}>bot Plans</Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <Text style={[styles.chartTitle]}>Without </Text>

              <Text style={[styles.chartTitle, { color: "#000000" }]}>
                Fitt
              </Text>
              <Text style={[styles.chartTitle]}>bot</Text>
            </View>
          )}
          <View style={styles.chartContent}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>{upperWeight} kg</Text>
              <Text style={styles.yAxisLabel}>{targetWeight} kg</Text>
              <Text style={styles.yAxisLabel}>{lowerWeight} kg</Text>
            </View>

            <View style={styles.chartArea}>
              <View style={styles.chartBackground}>
                <View style={[styles.gridLine, { top: 0 }]} />
                <View style={[styles.gridLine, { top: "50%" }]} />
                <View style={[styles.gridLine, { bottom: 0 }]} />
              </View>

              <View style={styles.chartImageContainer}>
                {isWithFitbot ? (
                  <Image
                    source={require("../../../assets/images/graph_weightloss_fittbot.png")}
                    style={styles.chartImage}
                    contentFit="contain"
                  />
                ) : (
                  <Image
                    source={require("../../../assets/images/graph_weightloss_normal.png")}
                    style={styles.chartImage}
                    contentFit="contain"
                  />
                )}

                <View
                  style={[
                    styles.timeLabel,
                    isWithFitbot
                      ? styles.timeLabelWithFitbotLoss
                      : styles.timeLabelWithoutFitbotLoss,
                  ]}
                >
                  <Text style={styles.timeLabelText}>{timeLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* <View style={styles.xAxis}>
            <Text style={styles.xAxisLabel}>1 month</Text>
            <Text style={styles.xAxisLabel}>3 month</Text>
            <Text style={styles.xAxisLabel}>6 month</Text>
            <Text style={styles.xAxisLabel}>1 year</Text>
          </View> */}
        </View>
      </View>
    );
  };

  const renderFeatures = () => (
    <View style={styles.featuresContainer}>
      <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
          <Image
            source={require("../../../assets/images/home/clock (2).png")}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <Text style={styles.featureText}>2x Faster</Text>
      </View>

      <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
          <Image
            source={require("../../../assets/images/home/ai.png")}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <Text style={styles.featureText}>Kyra AI</Text>
      </View>

      <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
          <Image
            source={require("../../../assets/images/home/user.png")}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <Text style={styles.featureText}>Nutrition Support</Text>
      </View>
    </View>
  );

  const renderDiamondPlan = () => (
    <TouchableOpacity
      style={styles.planContainer}
      onPress={async () => {
        onClose();
        if (Platform.OS === "android") {
          const recommendedPlan = getRecommendedPlan();
          router.push({
            pathname: "/client/subscription",
            params: { selectedPlan: recommendedPlan },
          });
        }
      }}
    >
      <Image source={getPlanImage()} style={{ width: 344, height: 241 }} />
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          {renderCloseButton()}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {renderHeader()}
            {renderYourStats()}
            {data.category === "maintain" ||
            data.category === "body_recomposition" ? (
              ""
            ) : (
              <>
                {data?.category === "weight_gain" ? (
                  <>
                    {renderChart(
                      "Without Fittbot",
                      data?.normal_duration || "6 Months"
                    )}
                    {renderChart(
                      "With Fittbot",
                      data?.fittbot_duration || "3 Months",
                      true
                    )}
                  </>
                ) : (
                  <>
                    {renderChartLoss(
                      "Without Fittbot",
                      data?.normal_duration || "6 Months"
                    )}
                    {renderChartLoss(
                      "With Fittbot",
                      data?.fittbot_duration || "3 Months",
                      true
                    )}
                  </>
                )}
              </>
            )}

            {renderFeatures()}

            {Platform.OS === "ios" ? "" : renderDiamondPlan()}
            {Platform.OS === "ios" ? (
              ""
            ) : (
              <TouchableOpacity
                style={styles.viewPlanButton}
                onPress={async () => {
                  onClose();
                  if (Platform.OS === "android") {
                    router.push("/client/subscription");
                  } else {
                    return null;
                  }
                }}
              >
                <Text style={styles.viewPlanText}>View All Plans</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.97,
    height: height * 0.93,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
  },

  // Header Styles
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 0,
    marginBottom: 10,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  headerContent: {
    alignItems: "center",
    backgroundColor: "#FF3C7B0D",
    paddingVertical: 15,
    borderRadius: 10,
    paddingHorizontal: 5,
    marginHorizontal: 14,
    marginBottom: 15,
  },
  profileSection: {
    flexDirection: "column",
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
  },

  headerTextContainer: {},
  welcomeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    marginLeft: 20,
  },
  fitbotText: {
    color: "#FF5757",
  },
  subtitleText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },

  // Stats Section
  scrollView: {
    flex: 1,
  },
  statsSection: {
    margin: 20,
    borderRadius: 15,
    borderTopRightRadius: 57,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#aaa",
  },
  statsHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statsContent: {
    flexDirection: "row",
    padding: 20,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  statsLeft: {
    flex: 1,
  },
  statItem: {
    marginBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: "#FF5757",
  },
  statRow: {
    marginBottom: 8,
    marginLeft: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#303030",
    fontWeight: "500",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },

  trophyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statValue: {
    fontSize: 12,
    color: "#666",
  },
  statWeight: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  statsRight: {
    justifyContent: "center",
    alignItems: "center",
  },
  transformationImage: {
    width: 160,
    height: 120,
    borderRadius: 10,
  },
  bottomStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "space-around",
  },
  bottomStatItem: {
    alignItems: "center",
  },
  bottomStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  bottomStatLabel: {
    fontSize: 12,
    color: "#666",
  },

  // Chart Styles
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    // marginBottom: 15,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    paddingHorizontal: 10,
    paddingBottom: 0,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartContent: {
    flexDirection: "row",
    height: 95,
    marginBottom: 15,
  },
  yAxis: {
    width: 40,
    justifyContent: "space-between",
    paddingRight: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  chartBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: -1,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  chartImageContainer: {
    flex: 1,
    position: "relative",
  },
  chartImage: {
    width: 250,
    height: 95,
    borderRadius: 8,
    resizeMode: "cover",
  },
  timeLabel: {
    position: "absolute",
    backgroundColor: "#E34276",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeLabelWithFitbotLoss: {
    left: 55,
    top: -5,
  },
  timeLabelWithoutFitbotLoss: {
    right: 60,
    top: 15,
  },
  timeLabelWithFitbot: {
    left: 55,
    top: 15,
  },
  timeLabelWithoutFitbot: {
    right: 60,
    top: -5,
  },
  timeLabelText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 40,
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#999",
  },

  // Features
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    // marginBottom: 30,
    paddingVertical: 20,
  },
  featureItem: {
    alignItems: "center",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  sparkleIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },

  // Plan Container
  planContainer: {
    // marginHorizontal: 10,
    marginBottom: 20,
    position: "relative",
    flexDirection: "row",
    justifyContent: "center",
  },
  recommendedBadge: {
    position: "absolute",
    top: -8,
    left: 20,
    backgroundColor: "#FF4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  planCard: {
    borderRadius: 15,
    padding: 20,
    paddingTop: 25,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  originalPrice: {
    fontSize: 12,
    color: "#fff",
    textDecorationLine: "line-through",
    opacity: 0.8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  priceUnit: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
  priceSubtext: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.8,
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  planFeatureText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
    flex: 1,
  },
  planFeatureSubtext: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.8,
    marginLeft: 8,
    flex: 1,
  },
  discountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  discountBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  discountPercent: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  discountText: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.9,
  },
  discountSubtext: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.9,
  },
  buyButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },

  // Bottom Buttons
  startButton: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
  startButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  viewPlanButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E53980",
    alignItems: "center",
  },
  viewPlanText: {
    fontSize: 14,
    color: "#E53980",
    fontWeight: "500",
  },

  // Free Trial Card Styles
  freeTrialContainer: {
    marginHorizontal: 10,
    marginBottom: 0,
  },
  freeTrialCard: {
    backgroundColor: "#FF3C7B0D",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "relative",
  },
  freeTrialContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  freeTrialLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  freeTrialDot: {
    position: "absolute",
    top: 0,
    left: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FF3C7B",
  },
  freeTrialTextContainer: {
    flex: 1,
  },
  freeTrialEmoji: {
    fontSize: 14,
    marginBottom: 2,
  },
  freeTrialTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#303030",
    marginBottom: 4,
  },
  freeTrialSubtitle: {
    fontSize: 9,
    color: "rgba(0,0,0,0.6)",
  },
  claimButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  claimButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});

export default FitbotWelcomeScreen;
