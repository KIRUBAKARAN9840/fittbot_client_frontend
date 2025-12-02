import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
const { width: screenWidth } = Dimensions.get("window");

const KyraWelcomeCard = ({
  message = "Hi I'm KyraAI\nYour Personal Fitness Coach",
  position = "left", // "left" or "right"
  onKyraPress,
  onMessagePress,
  kyraSize = 60,
  colors = ["#667eea", "#764ba2", "#4b79a1"],
  type = "general",
  profileImage,
  userName = "User",
  imageType = "other",
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const blinkAnimationRef = useRef(null);

  // Typewriter animation states
  const [displayText, setDisplayText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Messages to cycle through
  const messages = ["Hi, I'm KyraAI", "How can I help you?"];

  // Determine if it's a tablet based on screen width
  const isTablet = screenWidth >= 768;

  // Start cursor blinking animation
  const startCursorBlink = useCallback(() => {
    if (blinkAnimationRef.current) {
      blinkAnimationRef.current.stop();
    }

    blinkAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    blinkAnimationRef.current.start();
  }, [cursorOpacity]);

  // Stop cursor blinking animation
  const stopCursorBlink = useCallback(() => {
    if (blinkAnimationRef.current) {
      blinkAnimationRef.current.stop();
      cursorOpacity.setValue(1); // Keep cursor visible
    }
  }, [cursorOpacity]);

  // Handle cursor blinking based on typing state
  useEffect(() => {
    if (isTypingComplete && !isDeleting) {
      startCursorBlink();
    } else {
      stopCursorBlink();
    }

    return () => {
      if (blinkAnimationRef.current) {
        blinkAnimationRef.current.stop();
      }
    };
  }, [isTypingComplete, isDeleting, startCursorBlink, stopCursorBlink]);

  // Typewriter effect
  useEffect(() => {
    const currentMessage = messages[messageIndex];
    let timeout;

    if (!isDeleting) {
      // Typing mode
      if (charIndex < currentMessage.length) {
        setIsTypingComplete(false);
        timeout = setTimeout(() => {
          setDisplayText(currentMessage.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 50); // Typing speed
      } else {
        // Finished typing, start blinking cursor
        setIsTypingComplete(true);
        timeout = setTimeout(() => {
          setIsDeleting(true);
          setIsTypingComplete(false);
        }, 2000); // Pause before deleting
      }
    } else {
      // Deleting mode
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentMessage.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 30); // Deleting speed (faster than typing)
      } else {
        // Finished deleting, move to next message
        setIsDeleting(false);
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, messageIndex]);

  // Pulse animation for Kyra avatar
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  // Memoized KyraAI Avatar Component to prevent unnecessary rerenders
  const KyraAvatar = useMemo(
    () => (
      <View style={styles.kyraContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onKyraPress}
          style={[
            styles.kyraButtonWrapper,
            {
              width: kyraSize + 12,
              height: kyraSize + 12,
              borderRadius: (kyraSize + 12) / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.kyraButton,
              {
                width: kyraSize + 12,
                height: kyraSize + 12,
                borderRadius: (kyraSize + 12) / 2,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.kyraImageContainer}>
              {imageType === "other" ? (
                <Image
                  source={require("../../../assets/images/kyrahome.png")}
                  style={{
                    width: 75,
                    height: 75,
                    position: "absolute",
                    bottom: -4,
                  }}
                  contentFit="contain"
                />
              ) : (
                <Image
                  source={require("../../../assets/images/kyramain.png")}
                  style={{
                    width: 60,
                    height: 60,
                    position: "absolute",
                    bottom: -4,
                  }}
                  contentFit="contain"
                />
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    ),
    [kyraSize, onKyraPress, pulseAnim]
  ); // Only rerender when these props change

  // Message Bubble Component with Typewriter Effect
  const MessageBubble = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onMessagePress}
      style={[
        styles.messageContainer,
        position === "right"
          ? styles.messageContainerRight
          : styles.messageContainerLeft,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          position === "right"
            ? styles.messageBubbleRight
            : styles.messageBubbleLeft,
        ]}
      >
        <View style={styles.typewriterContainer}>
          <Text
            style={[styles.messageText, isTablet && styles.messageTextTablet]}
          >
            {type === "analysis"
              ? "Hi, I am KyraAI. I can help you analyse your data instantly !"
              : type === "+Add"? "Hi, I'm KyraAI\nI can help you log your workouts instantly"  : displayText}
          </Text>
          {type !== "analysis" && type !== "+Add" &&(
            <Animated.Text
              style={[
                styles.cursor,
                isTablet && styles.cursorTablet,
                { opacity: cursorOpacity },
              ]}
            >
              |
            </Animated.Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, isTablet && styles.cardTablet]}>
      <View
        style={[
          styles.contentRow,
          position === "right" && styles.contentRowReversed,
        ]}
      >
        {KyraAvatar}
        <MessageBubble />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: screenWidth >= 768 ? 500 : screenWidth - 32,
    minWidth: 280,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 16,
    overflow: "visible",
    alignSelf: "center",
  },
  cardTablet: {
    maxWidth: 600,
    padding: 20,
    paddingTop: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  contentRowReversed: {
    flexDirection: "row-reverse",
  },

  kyraContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kyraButtonWrapper: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  kyraButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  kyraGradient: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  rotatingRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(53, 37, 172, 0.3)",
    borderStyle: "dashed",
  },
  kyraImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    position: "absolute",
    bottom: 3,
  },

  messageContainer: {
    flex: 1,
    position: "relative",
  },
  messageContainerLeft: {
    alignItems: "flex-start",
  },
  messageContainerRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#FFFFFFDB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    maxWidth: "100%",
    // minWidth: 200,
  },
  messageBubbleLeft: {
    borderTopLeftRadius: 4,
  },
  messageBubbleRight: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
    lineHeight: 16,
    textAlign: "center",
  },
  messageTextTablet: {
    fontSize: 14,
    lineHeight: 18,
  },
  typewriterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 16, // Prevent layout shift
  },
  cursor: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 2,
  },
  cursorTablet: {
    fontSize: 14,
  },
  bubbleArrow: {
    position: "absolute",
    top: 8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopColor: "#FFFFFFDB",
    borderBottomColor: "transparent",
  },
  bubbleArrowLeft: {
    left: -7,
    borderLeftColor: "transparent",
    borderRightColor: "#FFFFFFDB",
  },
  bubbleArrowRight: {
    right: -7,
    borderLeftColor: "#FFFFFFDB",
    borderRightColor: "transparent",
  },
});

export default KyraWelcomeCard;
