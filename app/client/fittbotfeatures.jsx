import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Image } from "expo-image";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const cardWidth = width - 40;

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

const FittbotFeatures = () => {
  const [showFooter, setShowFooter] = useState(true);
  const scrollY = useRef(0);
  const footerAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const features = [
    {
      title: "Smart Workout Tracking",
      subTitle: "Every rep, every set, tracked with precision",
      image_url:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Live Gym Occupancy",
      subTitle: "Real-time gym capacity and equipment availability",
      image_url:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Smart Workout Tracking",
      subTitle: "Every rep, every set, tracked with precision",
      image_url:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Live Gym Occupancy",
      subTitle: "Real-time gym capacity and equipment availability",
      image_url:
        "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
  ];

  const socialMediaLinks = [
    {
      name: "YouTube",
      icon: require("../../assets/images/socialmedia/yt.png"),
      backgroundColor: "#FF0000",
      url: "https://youtube.com",
    },
    {
      name: "Instagram",
      icon: require("../../assets/images/socialmedia/insta.png"),
      backgroundColor: "#E4405F",
      url: "https://www.instagram.com/fittbot_app?igsh=MWMzcjhoeXBqb3Vl",
    },
    {
      name: "Facebook",
      icon: require("../../assets/images/socialmedia/fb.png"),
      backgroundColor: "#1877F2",
      url: "https://www.facebook.com/share/17AXFQoFpi/",
    },
    {
      name: "Twitter",
      icon: require("../../assets/images/socialmedia/x.png"),
      backgroundColor: "#000000",
      url: "https://twitter.com",
    },
    {
      name: "LinkedIn",
      icon: require("../../assets/images/socialmedia/linkedin.png"),
      backgroundColor: "#0A66C2",
      url: "https://www.linkedin.com/company/fittbotapp/",
    },
  ];

  // Animation effect
  useEffect(() => {
    if (showFooter) {
      // Slide in animation
      Animated.timing(footerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out animation
      Animated.timing(footerAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showFooter]);

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    // Show footer when scrolled up 20px from any position
    if (scrollY.current - currentScrollY >= 20 && currentScrollY > 0) {
      if (!showFooter) {
        setShowFooter(true);
      }
    } else if (currentScrollY - scrollY.current >= 10) {
      // Hide footer when scrolling down
      if (showFooter) {
        setShowFooter(false);
      }
    }

    scrollY.current = currentScrollY;
  };

  const openSocialLink = (url) => {
    Linking.openURL(url);
  };

  const SocialIcon = ({ item }) => (
    <TouchableOpacity
      style={[styles.socialIcon]}
      onPress={() => openSocialLink(item.url)}
      activeOpacity={0.8}
    >
      <Image
        source={item.icon}
        style={[
          { width: "100%", height: "100%" },
          item.name === "Twitter" && { width: 35, height: 35 },
        ]}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity
        style={[styles.backArrow, { top: insets.top + 10 }]}
        onPress={() => router.push("/client/home")}
      >
        <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/images/background/features.png")}
            style={styles.headerImage}
          />
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {features?.map((feature, index) => {
            return (
              <View key={index} style={styles.card}>
                {/* Image Section */}
                <View style={styles.imageSection}>
                  <Image
                    source={{ uri: feature?.image_url }}
                    style={styles.cardImage}
                  />
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.cardSubTitle}>{feature.subTitle}</Text>
                    <MaterialIcons name="chevron-right" size={22} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Bar */}
      <Animated.View
        style={[
          {
            transform: [
              {
                translateY: footerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [120, 0], // Slide from 120px below to 0
                }),
              },
            ],
            opacity: footerAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
        pointerEvents={showFooter ? "auto" : "none"}
      >
        <LinearGradient
          colors={["#CEBFE1", "#CEBFE1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.footerBar}
        >
          <Text style={styles.footerTitle}>Check these out!</Text>
          <View style={styles.socialIconsContainer}>
            {socialMediaLinks.map((item, index) => (
              <SocialIcon key={index} item={item} />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default FittbotFeatures;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    width: "100%",
    height: getImageContainerHeight(),
    marginBottom: 20,
  },
  headerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    width: cardWidth,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: "hidden",
  },
  imageSection: {
    height: 190,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statsContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  arrowContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    color: "#333333",
    fontSize: 18,
    fontWeight: "400",
  },
  contentSection: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardTitle: {
    color: "#605968",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cardSubTitle: {
    color: "rgba(96, 89, 104, 0.57)",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  // Footer Bar Styles
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#E8D5F2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  footerTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: "#605968",
    marginBottom: 6,
  },
  socialIconsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  socialIconText: {
    fontSize: 20,
  },
  backArrow: {
    position: "absolute",
    left: 15,
    zIndex: 10,
    padding: 5,
  },
});
