import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ShareablePostView = React.forwardRef(
  ({ post, currentImageIndex = 0 }, ref) => {
    // Get the current image for multi-image posts
    const getCurrentImage = () => {
      if (post.media && post.media.length > 0) {
        const images = post.media.filter((m) => m.file_type === "image");
        if (images.length > 0) {
          return images[currentImageIndex] || images[0];
        }
      }
      return null;
    };

    const currentImage = getCurrentImage();
    const hasText = post.content && post.content.trim().length > 0;
    const hasImage = currentImage !== null;

    return (
      <View ref={ref} style={shareStyles.container}>
        {/* Header */}
        <View style={shareStyles.header}>
          <View style={shareStyles.avatar}>
            {post?.profile_url ? (
              <Image
                source={{ uri: post.profile_url }}
                // contentFit="cover"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 20,
                  // marginRight: 3,
                }}
              />
            ) : (
              <Text style={shareStyles.avatarText}>
                post.user_name.charAt(0).toUpperCase()
              </Text>
            )}
          </View>
          <View style={shareStyles.userInfo}>
            <Text style={shareStyles.userName}>{post.user_name || "User"}</Text>
            <Text style={shareStyles.timeText}>Shared from Fittbot</Text>
          </View>
        </View>

        {/* Content */}
        <View style={shareStyles.content}>
          {hasText && (
            <Text style={shareStyles.postText} numberOfLines={6}>
              {post.content}
            </Text>
          )}

          {hasImage && (
            <View style={shareStyles.imageContainer}>
              <Image
                source={{ uri: currentImage.file_url }}
                style={shareStyles.postImage}
                contentFit="cover"
              />
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={shareStyles.stats}>
          <View style={shareStyles.statItem}>
            <Ionicons name="heart" size={16} color="#FF5757" />
            <Text style={shareStyles.statText}>
              {post.like_count || 0} likes
            </Text>
          </View>
          <View style={shareStyles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={shareStyles.statText}>
              {post.comment_count || 0} comments
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={shareStyles.footer}>
          <View style={shareStyles.footerLeft}>
            <Image
              source={require("../../../assets/images/footer.png")}
              style={shareStyles.footerLogo}
              contentFit="contain"
            />
            {/* <View style={shareStyles.brandContainer}>
              <View style={shareStyles.brandNameContainer}>
                <Text style={shareStyles.fittText}>Fitt</Text>
                <Text style={shareStyles.botText}>bot</Text>
              </View>
              <Text style={shareStyles.websiteText}>www.fittbot.com</Text>
            </View> */}
          </View>

          {/* <View style={shareStyles.footerRight}>
            <View style={shareStyles.storeImagesContainer}>
              <Image
                source={require("../../../assets/images/workout/report_google.png")}
                style={shareStyles.storeImage}
                contentFit="contain"
              />
              <Image
                source={require("../../../assets/images/workout/report_ios.png")}
                style={shareStyles.storeImage}
                contentFit="contain"
              />
            </View>
          </View> */}
        </View>
      </View>
    );
  }
);

const shareStyles = StyleSheet.create({
  container: {
    width: 400,
    backgroundColor: "white",
    padding: 20,
    // Removed the red debug border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF5757",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    marginBottom: 15,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    // marginBottom: hasImage ? 10 : 0,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0", // Fallback background
  },
  postImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0", // Fallback background
  },
  stats: {
    flexDirection: "row",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },

  brand: {
    marginBottom: 5,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
  },
  website: {
    fontSize: 12,
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  footerLogo: {
    width: 330,
    height: 45,
    marginRight: 8,
  },
  brandContainer: {
    flex: 1,
  },
  brandNameContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  fittText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
  },
  botText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  websiteText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  footerRight: {
    alignItems: "center",
  },
  getItOnText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  storeImagesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  storeImage: {
    width: 100,
    height: 30,
  },
});

export default ShareablePostView;
