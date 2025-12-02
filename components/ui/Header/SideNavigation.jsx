// SideNavigation.js
import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

import MenuItems from "./tabs";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// '#5c2b9b', '#ff3c7a'

const SideNavigation = ({
  isVisible,
  onClose,
  userData = {},
  // color1 = "#5c2b9b",
  // color2 = "#ff3c7a",
}) => {
  const router = useRouter();

  // Call MenuItems hook at top level (hooks must be at top level)
  const { menuItems } = MenuItems({ setIsMenuVisible: () => {} });

  const user = useMemo(
    () => ({
      name: userData?.userName || "NA",
      email: userData?.userEmail || "NA",
      profileImage: userData?.profile || "NA",
      ...userData,
    }),
    [userData]
  );

  // Animation value for side drawer
  const sideNavAnimation = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation for opening and closing side drawer
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Faster animation for opening
      Animated.parallel([
        Animated.spring(sideNavAnimation, {
          toValue: 0,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start(() => setIsAnimating(false));
    } else {
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(sideNavAnimation, {
          toValue: -SCREEN_WIDTH,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start(() => setIsAnimating(false));
    }
  }, [isVisible]);

  const handleProfilePress = useCallback(() => {
    router.push("/client/profile");
    onClose();
  }, [router, onClose]);

  if (!isVisible && sideNavAnimation._value === -SCREEN_WIDTH) {
    return null;
  }

  const renderMenuItem = useCallback(
    (item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.sideNavItem}
        onPress={() => {
          item.onPress();
          onClose();
        }}
      >
        <View style={styles.sideNavItemContent}>
          <View style={styles.sideNavIconContainer}>
            <Ionicons name={item.icon} size={18} color="#ffffff" />
          </View>
          <Text style={styles.sideNavItemText}>{item.text}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
      </TouchableOpacity>
    ),
    [onClose]
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={isVisible ? "auto" : "none"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sideNavContainer,
          { transform: [{ translateX: sideNavAnimation }] },
        ]}
        pointerEvents="auto"
      >
        <LinearGradient
          colors={["#FFB8B8", "#FF5757"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
        >
          <TouchableOpacity
            style={styles.sideNavHeader}
            activeOpacity={0.7}
            onPress={handleProfilePress}
          >
            <Image
              source={user.profileImage}
              style={styles.profileImage}
              cachePolicy="memory-disk"
              priority="high"
              contentFit="cover"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.sideNavContent}>
          {menuItems?.map(renderMenuItem)}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    // borderRadius: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    // borderRadius: 100,
  },
  sideNavContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    maxWidth: 360,
    // borderTopRightRadius: 100,
    // borderBottomRightRadius: 100,
  },
  sideNavHeader: {
    padding: 20,
    // backgroundColor: '#F5E7FF',
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 50,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  profileEmail: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 10,
  },
  editProfileButton: {
    // backgroundColor: '#9B4DEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    paddingLeft: 5,
  },
  sideNavContent: {
    flex: 1,
    paddingTop: 15,
  },
  sideNavItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E7FF",
  },
  sideNavItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideNavIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: "#FF5757",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sideNavItemText: {
    fontSize: 15,
    color: "#333",
  },
});

export default SideNavigation;
