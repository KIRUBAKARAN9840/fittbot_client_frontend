import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import {
  getDailyPassDetailsAPI,
  getMembershipDetailsAPI,
  getSubscriptionDetailsAPI,
} from "../../services/clientApi";
import { showToast } from "../../utils/Toaster";
import AsyncStorage from "@react-native-async-storage/async-storage";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
};

const FittbotMembershipCard = ({ item }) => (
  <View style={styles.transactionCard}>
    <View style={styles.cardHeader}>
      <View style={styles.planInfo}>
        <MaskedView
          maskElement={<Text style={styles.planName}>{item?.plan_name}</Text>}
        >
          <LinearGradient
            colors={["#000000", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 0 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.planName]}>
              {item?.plan_name}
            </Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.purchaseDate}>
          Purchased on {formatDate(item?.date)}
          {/* Purchased on {item?.date} */}
        </Text>
      </View>
      {/* <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === "active" ? "#4CAF50" : "#FF6B6B",
            },
          ]}
        >
          <Text style={styles.statusText}>{item?.status}</Text>
        </View>
      </View> */}
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.amountText}>₹ {item?.amount}</Text>
    </View>
  </View>
);

const GymMembershipCard = ({ item }) => (
  <View style={styles.transactionCard}>
    <View style={styles.cardHeader}>
      <View style={styles.planInfo}>
        <MaskedView
          maskElement={<Text style={styles.planName}>{item?.name}</Text>}
        >
          <LinearGradient
            colors={["#000000", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 0 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.planName]}>{item?.name}</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.purchaseDate}>
          Purchased on {formatDate(item?.date)}
        </Text>
        {item?.address && (
          <Text style={styles.gymAddress}>{item?.address}</Text>
        )}
        <Text style={styles.duration}>{item?.months} Months</Text>
      </View>
      {/* <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === "active" ? "#4CAF50" : "#FF6B6B",
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View> */}
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.amountText}>₹ {item.amount}</Text>
      <View
        style={[
          styles.typeBadge,
          {
            backgroundColor:
              item.type === "gym_membership" ? "#FFFFFF" : "#FFFFFFF",
          },
        ]}
      >
        <Text style={styles.typeBadgeText}>
          {item.type === "gym_membership" ? "Membership" : "Personal Training"}
        </Text>
      </View>
    </View>
  </View>
);

const DailyPassCard = ({ item }) => (
  <View style={styles.transactionCard}>
    <View style={styles.cardHeader}>
      <View style={styles.planInfo}>
        <MaskedView
          maskElement={<Text style={styles.planName}>{item?.name}</Text>}
        >
          <LinearGradient
            colors={["#000000", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 0 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.planName]}>{item?.name}</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.purchaseDate}>
          Purchased on {formatDate(item?.date)}
        </Text>
        {item?.address && (
          <Text style={styles.gymAddress}>{item?.address}</Text>
        )}
        <Text style={styles.duration}>{item?.no_of_days} days</Text>
      </View>
      {/* <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item?.status === "active" ? "#4CAF50" : "#FF6B6B",
            },
          ]}
        >
          <Text style={styles.statusText}>{item?.status}</Text>
        </View>
      </View> */}
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.amountText}>₹ {item?.amount}</Text>
    </View>
  </View>
);

const SkeletonLoader = () => (
  <View style={styles.listContainer}>
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonLeft}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonText} />
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.skeletonBadge} />
        </View>
        <View style={styles.skeletonFooter}>
          <View style={styles.skeletonAmount} />
        </View>
      </View>
    ))}
  </View>
);

const NoDataState = ({ message }) => (
  <View style={styles.noDataContainer}>
    <MaterialIcons
      name="receipt-long"
      size={64}
      color="#035570"
      opacity={0.3}
    />
    <Text style={styles.noDataText}>{message}</Text>
  </View>
);

const PurchaseHistory = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("fittbot");
  const [subsDetails, setSubsDetails] = useState(null);
  const [membershipDetails, setMembershipDetails] = useState(null);
  const [dailyPassDetails, setDailyPassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingGym, setLoadingGym] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        setLoading(false);
        return;
      }
      const response = await getSubscriptionDetailsAPI(client_id);
      if (response?.status === 200) {
        setSubsDetails(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Fetching Subscription Details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipDetails = async () => {
    if (membershipDetails) return;
    try {
      setLoadingGym(true);
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        setLoadingGym(false);
        return;
      }
      const response = await getMembershipDetailsAPI(client_id);
      if (response?.status === 200) {
        setMembershipDetails(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Fetching Membership Details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoadingGym(false);
    }
  };

  const fetchDailyPassDetails = async () => {
    if (dailyPassDetails) return;
    try {
      setLoadingDaily(true);
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        setLoadingDaily(false);
        return;
      }
      const response = await getDailyPassDetailsAPI(client_id);
      if (response?.status === 200) {
        setDailyPassDetails(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Fetching Daily Pass Details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "gym") {
      fetchMembershipDetails();
    } else if (tab === "daily") {
      fetchDailyPassDetails();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "fittbot":
        if (loading) {
          return <SkeletonLoader />;
        }
        if (!subsDetails || subsDetails.length === 0) {
          return <NoDataState message="No Subscriptions Found" />;
        }
        return (
          <FlatList
            data={subsDetails}
            keyExtractor={(item) => item?.id.toString()}
            renderItem={({ item }) => <FittbotMembershipCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case "gym":
        if (loadingGym) {
          return <SkeletonLoader />;
        }
        if (!membershipDetails || membershipDetails.length === 0) {
          return <NoDataState message="No Gym Memberships Purchases Found" />;
        }
        return (
          <FlatList
            data={membershipDetails}
            keyExtractor={(item) => item?.id.toString()}
            renderItem={({ item }) => <GymMembershipCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case "daily":
        if (loadingDaily) {
          return <SkeletonLoader />;
        }
        if (!dailyPassDetails || dailyPassDetails.length === 0) {
          return <NoDataState message="No Daily Pass Purchase Found" />;
        }
        return (
          <FlatList
            data={dailyPassDetails}
            keyExtractor={(item) => item?.id.toString()}
            renderItem={({ item }) => <DailyPassCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/client/home")}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase History</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "fittbot" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("fittbot")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "fittbot" && styles.activeTabText,
            ]}
          >
            Fittbot
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "gym" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("gym")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "gym" && styles.activeTabText,
            ]}
          >
            Gym
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "daily" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("daily")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "daily" && styles.activeTabText,
            ]}
          >
            Daily Pass
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>{renderContent()}</View>
    </View>
  );
};

export default PurchaseHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 30,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  tabButton: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    width: "32%",
    borderRadius: 7,
    backgroundColor: "#EFEFEF",
    minHeight: 35,
    justifyContent: "center",
  },
  activeTabButton: {
    borderColor: "#FF5757",
    backgroundColor: "#FF5757",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#363636",
    textAlign: "center",
    // lineHeight: 13,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: "#eee",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
    paddingRight: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000000",
  },
  purchaseDate: {
    fontSize: 12,
    color: "#363636",
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 12,
    color: "#363636",
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    color: "#363636",
    fontWeight: "500",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  statusText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "capitalize",
    letterSpacing: 0.4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 85, 112, 0.1)",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#363636",
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  typeBadgeText: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "600",
  },
  skeletonCard: {
    // backgroundColor: "#35AFD619",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: "rgba(3, 85, 112, 0.2)",
    borderWidth: 0.5,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  skeletonLeft: {
    flex: 1,
    paddingRight: 12,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: "#D3D3D3",
    borderRadius: 4,
    marginBottom: 8,
    width: "70%",
  },
  skeletonText: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: 6,
    width: "90%",
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    backgroundColor: "#D3D3D3",
    borderRadius: 7,
  },
  skeletonFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 85, 112, 0.1)",
  },
  skeletonAmount: {
    height: 20,
    backgroundColor: "#D3D3D3",
    borderRadius: 4,
    width: "30%",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#035570",
    textAlign: "center",
    marginTop: 16,
    opacity: 0.6,
  },
});
