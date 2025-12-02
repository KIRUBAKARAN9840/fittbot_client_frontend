import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { getClientLeaderboardAPI } from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

import { showToast } from "../../../utils/Toaster";
import SkeletonHome from "./skeletonHome";
import { useUser } from "../../../context/UserContext";
import {
  isFittbotPremium,
  isGymPremium,
  isPureFreemium,
} from "../../../config/access";
import PremiumBadge from "../Payment/premiumbadge";
import JoinGym from "../Payment/joingym";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Avatar = ({ name, size, style, isFirst }) => {
  const initials = name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "#4A90E2",
    "#50C878",
    "#9B59B6",
    "#E67E22",
    "#E74C3C",
    "#16A085",
    "#2980B9",
    "#8E44AD",
    "#2C3E50",
  ];

  const colorIndex = name?.length % colors?.length;
  const backgroundColor = colors[colorIndex];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2,
          borderColor: isFirst ? "#FFD700" : "#4A90E2",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.4,
          fontWeight: "bold",
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

const Crown = () => <Text style={styles.crown}>👑</Text>;

const TopThreePlayers = ({ players }) => {
  if (!players || players.length === 0) {
    return null;
  }

  const positions = [1, 0, 2];

  return (
    <View style={styles.topThreeContainer}>
      {positions.map((pos, index) => {
        const player = players[pos];

        // Guard against undefined player
        if (!player) return null;

        const isFirst = index === 1;

        return (
          <View
            key={player.client_id || index}
            style={[styles.topPlayerCard, isFirst ? styles.firstPlace : null]}
          >
            <View style={styles.avatarContainer}>
              {/* {isFirst && <Crown />} */}
              {isFirst && player.profile && (
                <Image
                  source={player.profile}
                  style={{ width: 80, height: 80, borderRadius: 50 }}
                />
              )}
              {!isFirst && player.profile && (
                <Image
                  source={player.profile}
                  style={{ width: 60, height: 60, borderRadius: 50 }}
                />
              )}
              {!player.profile && (
                <Avatar
                  name={player.client_name || "Unknown"}
                  size={isFirst ? 80 : 60}
                  isFirst={isFirst}
                />
              )}
            </View>
            <Text style={styles.playerName}>
              {(player.client_name || "Unknown").length > 12
                ? (player.client_name || "Unknown").substring(0, 12) + "..."
                : player.client_name || "Unknown"}
            </Text>
            <Text
              style={[styles.points, isFirst ? styles.firstPlacePoints : null]}
            >
              {player.xp || 0}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const PlayerListItem = ({ player, position }) => {
  if (!player) return null;

  return (
    <View style={styles.listItem}>
      <Text style={styles.position}>{position}</Text>
      {player.profile ? (
        <Image
          source={player.profile}
          style={{ width: 30, height: 30, borderRadius: 50 }}
        />
      ) : (
        <Avatar name={player.client_name || "Unknown"} size={30} />
      )}
      <View style={styles.playerInfo}>
        <Text style={styles.listPlayerName}>
          {player?.client_name || "Unknown"}
        </Text>
        <Text style={styles.rankText}>
          {player?.badge || "N/A"} - {player?.level || "N/A"}
        </Text>
      </View>
      <Text style={styles.listPoints}>{player?.xp || 0}</Text>
    </View>
  );
};

const MyLeaderboard = ({ tab, onNullTab, plan, onChangeTab }) => {
  const [activeTab, setActiveTab] = useState(tab || "Today");
  const tabs = ["Today", "This Month", "Overall"];
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const getTabData = (tab) => {
    if (!leaderboardData) return [];

    switch (tab) {
      case "Today":
        return leaderboardData.today || [];
      case "This Month":
        return leaderboardData.month || [];
      case "Overall":
        return leaderboardData.overall || [];
      default:
        return leaderboardData.today || [];
    }
  };

  useEffect(() => {
    if (tab && onNullTab) {
      onNullTab();
    }
  }, []);

  const fetchLeaderboardDetails = async () => {
    setLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const response = await getClientLeaderboardAPI(gymId);

      if (response?.status === 200 && response?.data) {
        setLeaderboardData(response.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Fetching Leaderboard",
        });
      }
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
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
    if (isGymPremium(plan)) {
      fetchLeaderboardDetails();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <SkeletonHome type="leaderboard" header={false} />;
  }

  if (isPureFreemium(plan))
    return (
      <View style={{ marginTop: 150 }}>
        <PremiumBadge size={30} />
      </View>
    );
  if (isFittbotPremium(plan))
    return (
      <View style={{ marginTop: 150 }}>
        <JoinGym size={30} onChangeTab={onChangeTab} tab={true} />
      </View>
    );

  const currentTabData = getTabData(activeTab);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {currentTabData.length > 3 && (
          <>
            <TopThreePlayers players={currentTabData.slice(0, 3)} />
            <View style={styles.listContainer}>
              {currentTabData.slice(3).map((player, index) => (
                <PlayerListItem
                  key={player?.client_id || index}
                  player={player}
                  position={index + 4}
                />
              ))}
            </View>
          </>
        )}

        {currentTabData.length > 0 && currentTabData.length < 3 && (
          <View style={styles.listContainer}>
            {currentTabData.map((player, index) => (
              <PlayerListItem
                key={player?.client_id || index}
                player={player}
                position={index + 1}
              />
            ))}
          </View>
        )}

        {currentTabData.length === 3 && (
          <TopThreePlayers players={currentTabData} />
        )}

        {currentTabData.length === 0 && (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No Data Found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeTab: {
    backgroundColor: "#FF5757",
  },
  tabText: {
    fontSize: 12,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  topThreeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 30,
  },
  topPlayerCard: {
    alignItems: "center",
    marginHorizontal: 10,
    flex: 1,
  },
  firstPlace: {
    marginTop: -20,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  crown: {
    position: "absolute",
    top: -25,
    fontSize: 24,
  },
  playerName: {
    color: "#333",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  points: {
    color: "#0E364E",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  firstPlacePoints: {
    color: "#16222A",
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  position: {
    color: "#666",
    width: 20,
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  listPlayerName: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  rankText: {
    color: "#666",
    fontSize: 10,
  },
  listPoints: {
    color: "#0E364E",
    fontSize: 14,
    fontWeight: "bold",
  },
  noData: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 30,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default MyLeaderboard;
