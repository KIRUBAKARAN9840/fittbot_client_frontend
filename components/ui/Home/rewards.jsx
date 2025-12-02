import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Dimensions,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  getClientRewardsAPI,
  getSmartWatchInterestAPI,
  redeemCash,
} from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BadgeSummaryModal, BadgeDetailsModal } from "../badgedetails";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import EarnXP from "./EarnXp";
import { showToast } from "../../../utils/Toaster";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import SkeletonHome from "./skeletonHome";
import { isGymPremium } from "../../../config/access";
const { width, height } = Dimensions.get("window");

const isTablet = () => {
  const aspectRatio = height / width;
  return width >= 768 || (width >= 600 && aspectRatio < 1.6);
};

const getImageContainerHeight = () => {
  const aspectRatio = height / width;

  // For very tall screens (phones with high aspect ratio)
  if (width >= 768) {
    return height * 0.65;
  } else if (aspectRatio > 2.15) {
    return height * 0.45;
  }
  // For medium aspect ratio phones
  else if (aspectRatio > 1.8) {
    return height * 0.49;
  }
  // For shorter screens (older phones, some tablets)
  else if (aspectRatio > 1.6) {
    return height * 0.52;
  }

  // For tablets and wide screens
};

const RewardHistoryModal = ({ visible, onClose, history }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reward History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {history?.length === 0 ? (
          <Text style={styles.rewardTitleNo}>No data found.</Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item?.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {item?.given_date?.split("T")[0]}
                </Text>
                <Text style={styles.historyPoints}>{item?.xp} XP</Text>
                <Text style={styles.historyReward}>{item?.gift}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  </Modal>
);

const RewardDetailsModal = ({ visible, onClose, reward }) => {
  if (!reward) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.centeredModalContainer}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.centeredModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reward Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.rewardDetailContainer}>
            <Image
              source={
                reward.image ||
                require("../../../assets/images/rewards_box 3.png")
              }
              style={styles.rewardDetailImage}
              contentFit="cover"
            />
            <Text style={styles.rewardDetailTitle}>{reward.gift}</Text>
            <View style={styles.xpContainer}>
              <Image
                source={require("../../../assets/images/XP 1.png")}
                style={styles.rewardXpIcon}
              />
              <Text style={styles.rewardXp}>{reward.xp} XP</Text>
            </View>
            {reward.description && (
              <Text style={styles.rewardDescription}>{reward.description}</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const RedeemXPModal = ({ visible, onClose, xpAmount, onConfirm }) => {
  const cashAmount = (xpAmount / 1000) * 10;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.centeredModalContainer}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.redeemModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Redeem XP</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.redeemContainer}>
            <View style={styles.redeemSide}>
              <Image
                source={require("../../../assets/images/XP 1.png")}
                style={styles.redeemIcon}
                contentFit="contain"
              />
              <Text style={styles.redeemAmount}>{xpAmount}</Text>
              <Text style={styles.redeemLabel}>XP</Text>
            </View>

            <Ionicons name="arrow-forward" size={24} color="#035570" />

            <View style={styles.redeemSide}>
              <Image
                source={require("../../../assets/images/home/cash.png")}
                style={styles.redeemIcon}
                contentFit="contain"
              />
              <Text style={styles.redeemAmount}>₹{cashAmount}</Text>
              <Text style={styles.redeemLabel}>Cash</Text>
            </View>
          </View>

          <Text style={styles.conversionInfo}>1000 XP = ₹10</Text>

          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const RewardCard = ({ item, selected, onPress }) => {
  const truncateTitle = (title) => {
    const words = title.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
    return title;
  };

  return (
    <TouchableOpacity
      style={[styles.rewardCard, selected && styles.selectedRewardCard]}
      onPress={() => onPress(item)}
    >
      <View style={styles.rewardImageContainer}>
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
          style={styles.rewardImageBackground}
        >
          <Image
            source={
              item?.image || require("../../../assets/images/rewards_box 3.png")
            }
            style={styles.rewardImage}
            contentFit="cover"
          />
        </LinearGradient>
      </View>
      <View style={styles.rewardInfoContainer}>
        <Text style={styles.rewardName} numberOfLines={1}>
          {truncateTitle(item.gift)}
        </Text>
        <View style={styles.xpContainer}>
          <Image
            source={require("../../../assets/images/XP 1.png")}
            style={styles.rewardXpIcon}
          />
          <Text style={styles.rewardXp}>{item.xp}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Rewards = ({ setActiveTabHeader, plan }) => {
  const [showRewardHistory, setShowRewardHistory] = useState(false);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [quests, setQuests] = useState([]);
  const [topMonths, setTopMonths] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [badgeDetails, setBadgeDetails] = useState(null);
  const [loading, setloading] = useState(true);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("rewards");
  const [selectedReward, setSelectedReward] = useState(null);
  const [rewardUpdate, setRewardUpdate] = useState(null);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [fibbotCash, setFittbotCash] = useState(0);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemableXP, setRedeemableXP] = useState(0);
  const [interest, setInterest] = useState(true);
  const router = useRouter();
  const deviceIsTablet = isTablet();

  const getInterest = async () => {
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const payload = {
        client_id: client_id,
      };
      const response = await getSmartWatchInterestAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "You Will be Notified Soon",
        });
        fetchRewardDetails();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
    }
  };

  const fetchRewardDetails = async () => {
    setloading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        setloading(false);
        return;
      }

      const response = await getClientRewardsAPI(
        clientId,
        gymId ? gymId : null
      );
      if (response?.status === 200) {
        setInterest(response?.data?.reward_interest_modal);
        setRewardHistory(response?.data?.client_history);
        setRewardUpdate(response?.data?.reward_update);
        setQuests(response?.data?.quest || []);
        setTopMonths(response?.data?.monthly_leaderboard);
        setAvailableRewards(response?.data?.gym_rewards || []);
        setRedeemableXP(response?.data?.actual_redeemable || 0);
        setReferralCode(response?.data?.referral_code);
        setFittbotCash(response?.data?.fittbot_cash || 0);

        if (
          response?.data?.gym_rewards &&
          response.data.gym_rewards.length > 0
        ) {
          setSelectedReward(response.data.gym_rewards[0]);
        }
        setBadgeDetails(response?.data?.client_badge);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error fetching rewards",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchRewardDetails();
  }, []);

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  const handleSelectReward = (reward) => {
    setSelectedReward(reward);
    setShowRewardDetails(true);
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
      
Use my referral code *${referralCode}* to get 100 Fittbot cash now on successful registration.

📱 Download Fittbot:
Android: https://play.google.com/store/apps/details?id=com.fittbot.fittbot_user&hl=en_IN
iOS: https://apps.apple.com/us/app/fittbot/id6747237294`;

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

  const handleRedeemConfirm = async () => {
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

      const payload = {
        client_id: clientId,
        redeemable_points: redeemableXP,
      };

      const response = await redeemCash(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message || "XP redeemed successfully",
        });
        setShowRedeemModal(false);
        fetchRewardDetails();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to redeem XP",
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

  if (loading) {
    return <SkeletonHome type="analysis" header={true} />;
  }

  const calculateProgressPercentage = () => {
    const currentXP = parseInt(badgeDetails?.client_xp) || 0;
    const nextLevelXP = parseInt(badgeDetails?.next_level_start) || 1985;
    const percentage = (currentXP / nextLevelXP) * 100;
    return Math.min(percentage, 100);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.icon}
        onPress={() => {
          setActiveTabHeader("My Progress");
        }}
      >
        <Ionicons name="arrow-back-outline" color={"#fff"} size={24}></Ionicons>
      </TouchableOpacity>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={require("../../../assets/images/reward_cup.png")}
            width={"100%"}
            height={"100%"}
            contentFit="cover"
          />
        </View>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "rewards" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("rewards")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "rewards" && styles.activeTabText,
              ]}
            >
              Rewards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "earnXp" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("earnXp")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "earnXp" && styles.activeTabText,
              ]}
            >
              Earn XP
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === "earnXp" ? (
          <EarnXP quest={quests} />
        ) : (
          <View>
            {rewardUpdate && (
              <View style={styles.infoContainer}>
                <View style={styles.infoBanner}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#E74C3C"
                    style={styles.infoIcon}
                  />
                  <MaskedView
                    maskElement={
                      <Text style={{ fontSize: 12, width: "80%" }}>
                        Reward Update: {rewardUpdate}
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={["#030A15", "#0154A0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ justifyContent: "center" }}
                    >
                      <Text
                        style={[{ opacity: 0, fontSize: 12, width: "80%" }]}
                      >
                        Reward Update: {rewardUpdate}
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                </View>
              </View>
            )}

            <View style={styles.contestSection}>
              <View style={styles.topSection}>
                <Image
                  source={require("../../../assets/images/contest/watch.png")}
                  style={styles.watchImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.bottomProducts}>
                <View style={styles.productItem}>
                  <Image
                    source={require("../../../assets/images/contest/hoodie.png")}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.productItem}>
                  <Image
                    source={require("../../../assets/images/contest/sipper.png")}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                </View>
              </View>
              {interest ? (
                <TouchableOpacity
                  style={styles.interestedButton}
                  onPress={getInterest}
                >
                  <Text style={styles.interestedButtonText}>
                    I'm Interested
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    marginBottom: 10,
                    color: "#FF5757",
                  }}
                >
                  You Have Shown Interest for the Challenge.
                </Text>
              )}

              <View style={styles.challengeInfo}>
                <Text style={styles.challengeText}>
                  The Challenge Begins on{" "}
                  <Text style={styles.challengeDate}>January 1st 2026</Text>
                </Text>
                <Text style={styles.challengeSubtext}>
                  Get Ready to Level Up 🏆
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.badgeCard2]}
              onPress={() => router.push("/client/fittbotcash")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(53, 175, 214, 0.3)", "rgba(53, 175, 214, 0.1)"]}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.2 }}
                style={{
                  paddingTop: 6,
                  paddingBottom: 15,
                  paddingHorizontal: 16,
                }}
              >
                <View style={[styles.badgeHeaderRow, { marginBottom: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <MaskedView
                      maskElement={
                        <Text style={{ fontSize: 14, fontWeight: 600 }}>
                          Fittbot Cash
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={["#035570", "#035570"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.4, y: 0 }}
                        style={{ justifyContent: "center" }}
                      >
                        <Text
                          style={[
                            { opacity: 0, fontSize: 14, fontWeight: 600 },
                          ]}
                        >
                          {badgeDetails?.badge} badge
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                    <Text
                      style={[
                        {
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#003F53",
                          marginTop: 8,
                        },
                      ]}
                    >
                      ₹{fibbotCash}
                    </Text>
                  </View>

                  <Image
                    source={require("../../../assets/images/home/cash.png")}
                    style={{ width: 80, height: 80 }}
                    contentFit="contain"
                  />
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#035570"
                    style={{ marginLeft: 5, marginBottom: 20 }}
                  />
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        textAlign: "left",
                        color: "#383030ff",
                      },
                    ]}
                  >
                    Use it for purchasing Gym Memberships or Daily Pass.
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={[
                styles.badgeCard2,
                { marginTop: 10, borderWidth: 1, borderColor: "#35AFD6" },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(53, 175, 214, 0.15)",
                  "rgba(53, 175, 214, 0.05)",
                ]}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.2 }}
                style={{
                  paddingTop: 10,
                  paddingBottom: 15,
                  paddingHorizontal: 16,
                }}
              >
                <View style={[styles.badgeHeaderRow, { marginBottom: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <MaskedView
                      maskElement={
                        <Text style={{ fontSize: 14, fontWeight: 600 }}>
                          Redeemable XP
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={["#035570", "#035570"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.4, y: 0 }}
                        style={{ justifyContent: "center" }}
                      >
                        <Text
                          style={[
                            { opacity: 0, fontSize: 14, fontWeight: 600 },
                          ]}
                        >
                          Redeemable XP
                        </Text>
                      </LinearGradient>
                    </MaskedView>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                        gap: 6,
                      }}
                    >
                      <Image
                        source={require("../../../assets/images/XP 1.png")}
                        style={{ width: 32, height: 32 }}
                        contentFit="contain"
                      />
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#035570",
                        }}
                      >
                        {redeemableXP}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#035570CC",
                        }}
                      >
                        XP
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      redeemableXP === 0 && styles.redeemButtonDisabled,
                    ]}
                    onPress={() => setShowRedeemModal(true)}
                    disabled={redeemableXP === 0}
                  >
                    <Text style={styles.redeemButtonText}>Redeem</Text>
                  </TouchableOpacity>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      textAlign: "left",
                      color: "#564b4bff",
                    }}
                  >
                    Convert your XP to Fittbot Cash (1000 XP = ₹10)
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View
              style={[
                styles.badgeCard2,
                { marginTop: 10, borderWidth: 1, borderColor: "#ddd" },
              ]}
            >
              <LinearGradient
                colors={["#FFFFFF", "#FFFFFF"]}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.2 }}
                style={{
                  paddingTop: 10,
                  paddingBottom: 15,
                  paddingHorizontal: 16,
                }}
              >
                <MaskedView
                  maskElement={
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 12,
                      }}
                    >
                      Invite & Earn
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={["#035570", "#035570"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.4, y: 0 }}
                    style={{ justifyContent: "center" }}
                  >
                    <Text
                      style={[
                        {
                          opacity: 0,
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 12,
                        },
                      ]}
                    >
                      Invite & Earn
                    </Text>
                  </LinearGradient>
                </MaskedView>

                <View style={styles.referralContainer}>
                  <View style={styles.referralCodeBox}>
                    <Text style={styles.referralLabel}>Your referral code</Text>
                    <TouchableOpacity onPress={handleCopyReferralCode}>
                      <View style={styles.referralCodeRow}>
                        <Text style={styles.referralCodeText}>
                          {referralCode}
                        </Text>
                        <Ionicons
                          name="copy-outline"
                          size={20}
                          color="#0891B2"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareReferral}
                  >
                    <Ionicons name="paper-plane" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            <View style={[styles.badgeCard2, { marginTop: 10 }]}>
              <LinearGradient
                colors={["rgba(53, 175, 214, 0.1)", "rgba(53, 175, 214, 0.1)"]}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.2 }}
                style={{
                  paddingBottom: 15,
                  paddingHorizontal: 16,
                  paddingTop: 15,
                }}
              >
                <View style={styles.badgeHeaderRow}>
                  <View>
                    <MaskedView
                      maskElement={
                        <Text style={{ fontSize: 18, fontWeight: 700 }}>
                          {badgeDetails?.badge} badge
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={["#035570", "#035570"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.4, y: 0 }}
                        style={{ justifyContent: "center" }}
                      >
                        <Text
                          style={[
                            { opacity: 0, fontSize: 18, fontWeight: 700 },
                          ]}
                        >
                          {badgeDetails?.badge} badge
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                    <Text style={styles.workoutText}>
                      {badgeDetails?.level}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowBadgeSummary(true)}>
                    <Image
                      source={badgeDetails?.image_url}
                      style={styles.badgeIcon}
                      contentFit="contain"
                    />
                  </TouchableOpacity>
                </View>

                <View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <LinearGradient
                        colors={["#035570", "#035570"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          { width: `${calculateProgressPercentage()}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.xpRow}>
                      <Image
                        source={require("../../../assets/images/XP 1.png")}
                        style={styles.xpIcon}
                      />
                      <MaskedView
                        maskElement={
                          <Text style={styles.xpText}>
                            {badgeDetails?.client_xp}
                          </Text>
                        }
                      >
                        <LinearGradient
                          colors={["#035570", "#035570"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0.4, y: 0 }}
                          style={{ justifyContent: "center" }}
                        >
                          <Text style={[{ opacity: 0 }, styles.xpText]}>
                            {badgeDetails?.client_xp}
                          </Text>
                        </LinearGradient>
                      </MaskedView>
                    </View>
                    <Text style={styles.nextLevelXp}>
                      {badgeDetails?.next_level_start} XP
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={[
                      {
                        opacity: 1,
                        fontSize: 12,
                        marginTop: 20,
                        textAlign: "center",
                        color: "#4D4D4D",
                      },
                    ]}
                  >
                    Just a few steps away from the '
                    {badgeDetails?.next_badge_name}' badge!
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Rewards horizontal scrollable cards */}
            {isGymPremium(plan) && (
              <>
                <View style={styles.rewardsSection}>
                  <MaskedView
                    maskElement={
                      <Text style={styles.rewardsSectionTitle}>
                        Available Rewards from your Gym
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={["#035570", "#035570"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.4, y: 0 }}
                      style={{ justifyContent: "center" }}
                    >
                      <Text
                        style={[{ opacity: 0 }, styles.rewardsSectionTitle]}
                      >
                        Available Rewards from your Gym
                      </Text>
                    </LinearGradient>
                  </MaskedView>

                  <FlatList
                    data={availableRewards}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <RewardCard
                        item={item}
                        selected={
                          selectedReward && selectedReward.id === item.id
                        }
                        onPress={handleSelectReward}
                      />
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rewardsScrollContainer}
                  />
                </View>

                <View style={styles.historyContainer}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Reward History</Text>
                  </View>
                  {rewardHistory?.length === 0 ? (
                    <View>
                      <Text style={styles.noData}>No Data Found</Text>
                    </View>
                  ) : (
                    <>
                      {rewardHistory?.slice(0, 3)?.map((item, index) => (
                        <View key={index} style={styles.historyListItem}>
                          <View>
                            <View style={styles.historyListItemInside}>
                              <View style={styles.historyLeftContent}>
                                <View style={styles.statusIndicator}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color="#4CAF50"
                                  />
                                </View>
                                <View>
                                  <Text style={styles.rewardItemTitle}>
                                    {item.gift}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.historyListItemInside,
                                { marginTop: 4 },
                              ]}
                            >
                              <View style={styles.historyLeftContent}>
                                <View style={styles.statusIndicator}>
                                  <Ionicons
                                    name="calendar-outline"
                                    size={12}
                                    color="#4CAF50"
                                  />
                                </View>
                                <View>
                                  <Text style={styles.rewardItemDate}>
                                    Claimed on {item.given_date?.split("T")[0]}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              gap: 3,
                              alignItems: "center",
                            }}
                          >
                            <Text style={styles.rewardItemPoints}>
                              {item.xp}
                            </Text>
                            <Text style={styles.rewardItemPointsXp}>XP</Text>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.loadMoreButton}
                        onPress={() => setShowRewardHistory(true)}
                      >
                        <Text style={styles.loadMoreText}>View All</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}

            <View style={styles.monthlyContainer}>
              <MaskedView
                maskElement={
                  <Text style={styles.monthlyTitle}>Top Performing Months</Text>
                }
              >
                <LinearGradient
                  colors={["#035570", "#035570"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.4, y: 0 }}
                  style={{ justifyContent: "center" }}
                >
                  <Text style={[{ opacity: 0 }, styles.monthlyTitle]}>
                    Top Performing Months
                  </Text>
                </LinearGradient>
              </MaskedView>

              {topMonths?.length === 0 ? (
                <View>
                  <Text style={styles.noData}>No Data Found</Text>
                </View>
              ) : (
                <>
                  {topMonths.map((month, index) => (
                    <View key={index} style={styles.monthItem}>
                      <View>
                        <MaskedView
                          maskElement={
                            <Text style={styles.monthName}>{month.month}</Text>
                          }
                        >
                          <LinearGradient
                            colors={["#035570", "#035570"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.4, y: 0 }}
                            style={{ justifyContent: "center" }}
                          >
                            <Text style={[{ opacity: 0 }, styles.monthName]}>
                              {month.month}
                            </Text>
                          </LinearGradient>
                        </MaskedView>
                      </View>
                      <MaskedView
                        maskElement={
                          <Text style={styles.monthPoints}>{month.xp}XP</Text>
                        }
                      >
                        <LinearGradient
                          colors={["#035570", "#035570"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0.4, y: 0 }}
                          style={{ justifyContent: "center" }}
                        >
                          <Text style={[{ opacity: 0 }, styles.monthPoints]}>
                            {month.xp}XP
                          </Text>
                        </LinearGradient>
                      </MaskedView>
                    </View>
                  ))}
                </>
              )}
            </View>

            <BadgeSummaryModal
              visible={showBadgeSummary}
              onClose={() => setShowBadgeSummary(false)}
              userXP={parseInt(badgeDetails?.client_xp) || 0}
              currentBadge={badgeDetails?.badge || ""}
              onMoreDetails={handleMoreDetailsClick}
            />

            <BadgeDetailsModal
              visible={showBadgeDetails}
              onClose={() => setShowBadgeDetails(false)}
              currentBadge={badgeDetails?.badge || ""}
              currentLevel={badgeDetails?.level || ""}
            />

            <RewardHistoryModal
              visible={showRewardHistory}
              onClose={() => setShowRewardHistory(false)}
              history={rewardHistory}
            />

            <RewardDetailsModal
              visible={showRewardDetails}
              onClose={() => setShowRewardDetails(false)}
              reward={selectedReward}
            />

            <RedeemXPModal
              visible={showRedeemModal}
              onClose={() => setShowRedeemModal(false)}
              xpAmount={redeemableXP}
              onConfirm={handleRedeemConfirm}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
    // paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  imageContainer: {
    width: width,
    height: Math.max(300, Math.min(800, getImageContainerHeight())), // Adaptive height with min/max constraints
    position: "relative",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5FB",
    padding: 16,
    borderRadius: 8,
  },
  icon: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1000,
  },
  infoIcon: {
    width: "10%",
  },
  infoText: {
    fontSize: 12,
    color: "#0154A0",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -30,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabButton: {
    // flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#35AFD619",
    width: "48%",
    borderRadius: 7,
    backgroundColor: "#35AFD619",
  },
  activeTabButton: {
    borderColor: "#035570",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#035570",
  },
  activeTabText: {
    color: "#035570",
    fontWeight: "600",
  },
  badgeCard: {
    backgroundColor: "#FFD373",
    position: "absolute",
    bottom: -50,
    right: 0,
    left: 0,
    borderRadius: 12,
    margin: 16,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    marginTop: 10,
  },
  contestSection: {
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  topSection: {
    width: "100%",
    aspectRatio: 2.4,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 0,
  },
  watchImage: {
    width: "100%",
    height: "100%",
  },
  bottomProducts: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  productItem: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: width * 0.01,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
    maxHeight: width * 0.4,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  interestedButton: {
    backgroundColor: "#FFE9A8",
    paddingVertical: width > 400 ? 14 : 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    width: "90%",
    margin: "auto",
  },
  interestedButtonText: {
    color: "#8B5A00",
    fontSize: width > 400 ? 16 : 14,
    fontWeight: "700",
  },
  challengeInfo: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  challengeText: {
    fontSize: width > 400 ? 16 : 14,
    color: "#464646",
    textAlign: "center",
    marginBottom: 5,
    flexWrap: "wrap",
  },
  challengeDate: {
    color: "#FF4444",
    fontWeight: "700",
  },
  challengeSubtext: {
    fontSize: width > 400 ? 16 : 14,
    color: "#464646",
    fontWeight: "600",
    textAlign: "center",
  },
  badgeCard2: {
    borderColor: "rgba(255, 255, 255, 0.33)",
    borderWidth: 0.5,
    borderRadius: 12,
    margin: 16,
    shadowColor: "#ffffff",
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginTop: 18,
  },

  badgeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badgeIcon: {
    width: 50,
    height: 50,
  },
  xpIcon: {
    width: 25,
    height: 25,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "absolute",
    left: 0,
    top: 20,
    fontSize: 12,
  },
  xpText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    position: "relative",
    height: 10,
    marginBottom: 16,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0154A0",
    borderRadius: 5,
  },
  nextLevelXp: {
    position: "absolute",
    right: 0,
    top: 20,
    fontSize: 14,
    color: "#035570",
  },
  nextBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextBadgeText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },
  smallBadgeIcon: {
    width: 45,
    height: 50,
  },
  // New reward cards styling
  rewardsSection: {
    backgroundColor: "#35AFD619",
    borderRadius: 12,
    margin: 16,
    padding: 15,
    shadowColor: "#ccc",
    borderColor: "rgba(255, 255, 255, 0.33)",
    borderWidth: 0.5,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  rewardsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  rewardsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  rewardCard: {
    width: 145,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  selectedRewardCard: {
    // borderWidth: 2,
    // borderColor: '#0154A0',
  },
  rewardImageContainer: {
    height: 120,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  rewardImageBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardImage: {
    width: "100%",
    height: "100%",
  },
  rewardInfoContainer: {
    padding: 8,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardXpIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rewardXp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0154A0",
  },
  historyContainer: {
    backgroundColor: "#35AFD619",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    borderColor: "rgba(255, 255, 255, 0.33)",
    borderWidth: 0.5,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#035570",
  },
  historyListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: "rgba(53, 53, 53, 0.2)",
    borderRadius: 7,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  historyListItemInside: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyLeftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    marginRight: 6,
  },
  rewardItemTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#035570",
  },
  rewardItemDate: {
    fontSize: 12,
    color: "#035570CC",
    marginTop: 4,
  },
  rewardItemPoints: {
    fontSize: 12,
    fontWeight: "500",
    color: "#035570",
  },
  rewardItemPointsXp: {
    color: "#FBC33E",
    fontSize: 10,
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 12,
    color: "#035570",
    fontWeight: "500",
  },
  monthlyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  monthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  monthName: {
    fontSize: 12,
    fontWeight: "500",
  },
  monthPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  workoutText: {
    paddingTop: 5,
    color: "#035570CC",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: {
    flex: 1,
  },
  historyPoints: {
    flex: 1,
    textAlign: "center",
  },
  historyReward: {
    flex: 1,
    textAlign: "right",
  },
  rewardTitleNo: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  noData: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 5,
    color: "#035570",
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centeredModalContent: {
    width: "60%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  rewardDetailContainer: {
    alignItems: "center",
    paddingBottom: 15,
    borderWidth: 2,
    borderRadius: 25,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  rewardDetailImage: {
    width: "100%",
    height: 150,
    marginBottom: 16,
  },
  rewardDetailTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  rewardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  referralContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  referralLabel: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 4,
  },
  referralCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  referralCodeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#035570",
  },
  shareButton: {
    backgroundColor: "#0895B0",
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemButton: {
    backgroundColor: "#035570",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  redeemModalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  redeemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FCFF",
    borderRadius: 12,
  },
  redeemSide: {
    alignItems: "center",
    gap: 8,
  },
  redeemIcon: {
    width: 50,
    height: 50,
  },
  redeemAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#035570",
  },
  redeemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#035570CC",
  },
  conversionInfo: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#035570",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Rewards;
