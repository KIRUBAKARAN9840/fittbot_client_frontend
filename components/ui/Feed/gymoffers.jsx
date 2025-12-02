import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";

import {
  MaterialIcons,
  FontAwesome,
  Ionicons,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import { getGymOffersAPI } from "../../../services/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, ImageBackground } from "expo-image";
import SkeletonFeeds from "./skeletonFeed";

const getCategoryIcon = (category) => {
  switch (category) {
    case "membership":
      return "id-card";
    case "guest":
      return "user-friends";
    case "nutrition":
      return "blender";
    case "training":
      return "dumbbell";
    case "apparel":
      return "tshirt";
    default:
      return "tag";
  }
};

const formatDate = (dateString) => {
  const options = { month: "long", day: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const GymOffers = ({
  onScroll,
  scrollEventThrottle,
  headerHeight,
  tabs,
  activeTab,
  setActiveTab,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const handleOfferPress = (item) => {
    setSelectedOffer(item);
    setModalVisible(true);
  };

  const getGymOffers = async () => {
    setIsLoading(true);
    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong",
        });
        return;
      }
      const response = await getGymOffersAPI(gym_id);

      if (response?.status === 200) {
        setOffers(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Something went wrong",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong, Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getGymOffers();
  }, []);

  const renderOffer = ({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[
          styles.offerContainer,
          isEven ? styles.offerEven : styles.offerOdd,
        ]}
        onPress={() => handleOfferPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.offerImageContainer}>
          <LinearGradient
            colors={["#30818B", "#73C4CB"]}
            style={styles.offerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={
                item.image_url ||
                require("../../../assets/images/offer_card.png")
              }
              contentFit="cover"
              style={{ width: "100%", height: "55%" }}
            />
            <View style={styles.offerDetails}>
              <Text style={styles.offerTitle}>{item.title}</Text>
              <Text style={styles.offerSubtitle}>
                {item.description.length > 70
                  ? `${item.description.slice(0, 70)}...`
                  : item.description}
              </Text>
              <View style={styles.offerValidUntil}>
                <Ionicons name="time-outline" size={14} color="#FFF" />
                <Text style={styles.offerValidText}>
                  Valid until {formatDate(item.validity)}
                </Text>
              </View>

              <View style={styles.offerFooter}>
                <Text style={styles.offerCode}>
                  Code: {item.code ? item.code : "Not Applicable"}
                </Text>
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Entypo name="chevron-right" size={14} color="#FFF" />
                </View>
              </View>

              <View style={styles.offerBadge}>
                <View style={styles.offerBadgeContainer}>
                  <Image
                    source={require("../../../assets/images/offer_badge.png")}
                    contentFit="contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View style={styles.offerBadgeText}>
                    <Text style={styles.offerText1}>SPECIAL</Text>
                    <Text style={styles.offerText2}>OFFER</Text>
                    <Text style={styles.offerDiscount}>{item.discount} %</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  // Detail Modal
  const renderDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      {/* <TouchableWithoutFeedback onPress={() => setModalVisible(false)}> */}
      <View style={styles.modalOverlay}>
        {/* <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}> */}
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {selectedOffer && (
            <>
              {/* Fixed Image Header */}
              <View style={styles.modalImageContainer}>
                <ImageBackground
                  source={
                    selectedOffer?.image_url ||
                    require("../../../assets/images/offer_card.png")
                  }
                  style={styles.modalImage}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.modalImageGradient}
                  >
                    {selectedOffer.tag && (
                      <View style={styles.modalOfferTag}>
                        <Text style={styles.modalOfferTagText}>
                          {selectedOffer.tag}
                        </Text>
                      </View>
                    )}
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>
                        {selectedOffer.title}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {selectedOffer.subdescription}
                      </Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                style={styles.modalDetailsContainer}
                contentContainerStyle={styles.modalDetailsContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <FontAwesome5
                      name={getCategoryIcon(selectedOffer.category)}
                      size={18}
                      color="#30818B"
                    />
                    <Text style={styles.modalInfoLabel}>Category</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedOffer.category.charAt(0).toUpperCase() +
                        selectedOffer.category.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.modalInfoDivider} />

                  <View style={styles.modalInfoItem}>
                    <FontAwesome name="percent" size={18} color="#30818B" />
                    <Text style={styles.modalInfoLabel}>Discount</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedOffer.discount}
                    </Text>
                  </View>

                  <View style={styles.modalInfoDivider} />

                  <View style={styles.modalInfoItem}>
                    <Ionicons name="calendar" size={18} color="#30818B" />
                    <Text style={styles.modalInfoLabel}>Valid Until</Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDate(selectedOffer.validity)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDescriptionContainer}>
                  <Text style={styles.modalDescriptionTitle}>
                    Offer Details
                  </Text>
                  <Text style={styles.modalDescription}>
                    {selectedOffer.description}
                  </Text>
                </View>
                {selectedOffer.code && (
                  <View style={styles.modalCodeContainer}>
                    <Text style={styles.modalCodeLabel}>Use Code</Text>
                    <View style={styles.modalCodeBox}>
                      <Text style={styles.modalCodeValue}>
                        {selectedOffer.code ? selectedOffer.code : "NA"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* <TouchableOpacity style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>Claim This Offer</Text>
                </TouchableOpacity> */}

                {/* Add some bottom padding for better scrolling */}
                <View style={styles.modalBottomPadding} />
              </ScrollView>
            </>
          )}
        </View>
        {/* </TouchableWithoutFeedback> */}
      </View>
      {/* </TouchableWithoutFeedback> */}
    </Modal>
  );

  if (isLoading) {
    return <SkeletonFeeds type="offers" priority="high" />;
  }

  return (
    <View style={styles.container} edges={["top"]}>
      <FlatList
        data={offers}
        renderItem={renderOffer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.offersContainer,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={() => (
          <View>
            {/* Tab Navigation */}
            {tabs && (
              <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tabButton,
                      activeTab === tab.id && { backgroundColor: tab.color },
                    ]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab.id && { color: "#FFF" },
                      ]}
                    >
                      {tab.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.headerInfoContainer}>
              <LinearGradient
                colors={["#30818B", "#70C1C7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.promoHeader}
              >
                <View style={styles.promoTextContainer}>
                  <Text style={styles.promoTitle}>Exclusive Offers</Text>
                  <Text style={styles.promoSubtitle}>
                    Save big on memberships & more
                  </Text>
                </View>
                <View style={styles.promoIconContainer}>
                  <FontAwesome5 name="tags" size={24} color="#FFF" />
                </View>
              </LinearGradient>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="gift" size={50} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Offers Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon for new deals
            </Text>
          </View>
        )}
      />
      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: Platform.OS === "ios" ? 50 : 0,
  },
  offersContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  headerInfoContainer: {
    marginVertical: 16,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  promoSubtitle: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
  },
  promoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  offerContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    minHeight: 250,
    maxHeight: 290,
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
  },
  offerDetails: {
    position: "relative",
    // backgroundColor: "#1E2349",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#196A75",
    borderBottomEndRadius: 10,
    height: "45%",
    padding: 10,
  },
  offerOdd: {
    backgroundColor: "#F5F5FF",
  },
  offerImageContainer: {
    height: "100%",
    width: "100%",
  },
  offerImage: {
    height: "100%",
    width: "100%",
  },
  offerImageStyle: {
    borderRadius: 12,
  },
  offerGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
    borderRadius: 12,
  },
  offerTag: {
    position: "absolute",
    top: 8,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerTagText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "bold",
  },
  offerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  offerBadgeContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 70,
    height: 70,
  },
  offerText1: {
    fontSize: 10,
    fontWeight: 400,
    color: "#A32669",
    textAlign: "center",
  },
  offerBadgeText: {
    position: "absolute",
    top: 3,
    right: 0,
    left: 0,
  },
  offerText2: {
    fontSize: 12,
    fontWeight: 900,
    color: "#D7001D",
    textAlign: "center",
  },
  offerDiscount: {
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },
  offerSubtitle: {
    color: "#FFF",
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
    width: "80%",
  },
  offerValidUntil: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  offerValidText: {
    color: "#FFF",
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.9,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  offerCode: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontSize: 14,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 680,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    height: 240,
    width: "100%",
  },
  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalOfferTag: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#1DA1F2",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalOfferTagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalTitleContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#FFF",
    fontSize: 16,
    opacity: 0.9,
  },
  modalDetailsContainer: {
    flex: 1,
    padding: 16,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalInfoLabel: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  modalInfoValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
  modalDescriptionContainer: {
    marginBottom: 16,
  },
  modalDescriptionTitle: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDescription: {
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
  },
  modalCodeContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  modalCodeLabel: {
    color: "#333",
    fontSize: 14,
    marginBottom: 8,
  },
  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderStyle: "dashed",
  },
  modalCodeValue: {
    color: "#16d656",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  claimButton: {
    backgroundColor: "#FF5757",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 560,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    flex: 0, // Changed from flex: 1
  },
  modalHeader: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    height: 200, // Reduced height to give more space for scrollable content
    width: "100%",
  },
  modalImage: {
    height: "100%",
    width: "100%",
  },
  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalOfferTag: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#30818B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalOfferTagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalTitleContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#FFF",
    fontSize: 16,
    opacity: 0.9,
  },
  modalDetailsContainer: {
    flex: 1, // This ensures ScrollView takes remaining space
    backgroundColor: "#FFF",
  },
  modalDetailsContent: {
    padding: 16,
    paddingBottom: 32, // Extra padding at bottom
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalInfoLabel: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  modalInfoValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
  modalDescriptionContainer: {
    marginBottom: 16,
  },
  modalDescriptionTitle: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDescription: {
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
  },
  modalCodeContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  modalCodeLabel: {
    color: "#333",
    fontSize: 14,
    marginBottom: 8,
  },
  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderStyle: "dashed",
  },
  modalCodeValue: {
    color: "#16d656",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  claimButton: {
    backgroundColor: "#1DA1F2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBottomPadding: {
    height: 16,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
});

export default GymOffers;
