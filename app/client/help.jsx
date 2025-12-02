import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supportAPI } from "../../services/clientApi";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const HelpSupportScreen = () => {
  const [selectedTab, setSelectedTab] = useState(() => {
    return Platform.OS === "ios" ? "General" : "Subscriptions";
  });
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [token, setToken] = useState(null);
  const [ticketData, setTicketData] = useState({
    issueType: "",
    customSubject: "",
    email: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const insets = useSafeAreaInsets();
  // Updated issue types to match requirements
  const commonIssues =
    Platform.OS === "ios"
      ? ["Select an issue type", "Technical", "App Usage", "Other"]
      : [
          "Select an issue type",
          "Technical",
          "Subscription",
          "App Usage",
          "Other",
        ];

  const faqData =
    Platform.OS === "ios"
      ? {
          General: [
            {
              id: 26,
              question: "How do I reset my password?",
              answer:
                'To reset your password, click on "Forgot Password" on the login screen and follow the instructions.',
            },
            {
              id: 27,
              question: "Is my data secure?",
              answer:
                "Yes, we use industry-standard encryption to protect your data. All information is stored securely and we never share your data with third parties.",
            },
            {
              id: 28,
              question: "How do I contact support?",
              answer:
                'You can contact support by clicking the "Raise Ticket" button or emailing us at support@fittbot.com.',
            },
          ],
          "App usage": [
            {
              id: 38,
              question: "Can I use the app offline?",
              answer:
                "No , you need an active internet connection to use fittbot and its services",
            },
            {
              id: 31,
              question:
                "Can Fittbot be used as an alternate of medical assistance provider ?",
              answer:
                "No, Fittbot is not a medical provider and does not offer medical advice, diagnosis, or treatment",
            },
            {
              id: 32,
              question: "What is Marketplace in Fittbot ?",
              answer:
                "The Marketplace allows users to purchase health and wellness products from third-party vendors.Fittbot only provides the platform and does not own or control the Products.",
            },
            {
              id: 33,
              question: "What is GymBuddy in Fittbot ?",
              answer:
                "This feature allows users to connect with others for workout sessions, motivation, and fitness discussions.Users are responsible for their interactions and should practice due diligence when meeting other",
            },
            {
              id: 34,
              question: "Privay and Data collection?",
              answer:
                "Users' data is collected, stored, and managed in accordance with our Privacy Policy.Fittbot does not share personal data with third parties without user consent",
            },
          ],
        }
      : {
          Subscriptions: [
            {
              id: 1,
              question: "How do I upgrade my subscription?",
              answer:
                "To upgrade your subscription, go to My Subscription tab placed in the Menu List and choose the plan you want to upgrade to and complete the payment.",
            },
            {
              id: 2,
              question: "Can I cancel my subscription anytime?",
              answer:
                "Monthly subscriptions can be cancelled within 24 hours for a refund. Multi-month plans are refundable if cancelled within the first 7 days. Trial plans are not eligible for refunds",
            },
            {
              id: 3,
              question: "What payment methods are accepted?",
              answer:
                "We accept all major credit cards, debit cards, and UPI. Additional payment methods may be available based on your region.",
            },
            {
              id: 4,
              question: "How to cancel my subscription?",
              answer:
                "To upgrade your subscription, go to My Subscription tab placed in the Menu List.In your current plan ,press Unsubscribe to cancel your subscription",
            },
            {
              id: 5,
              question: "Whom to contact for payment related queries?",
              answer:
                "Billing disputes must be reported within 30 days to support@fittbot.com.",
            },
          ],
          General: [
            {
              id: 26,
              question: "How do I reset my password?",
              answer:
                'To reset your password, click on "Forgot Password" on the login screen and follow the instructions.',
            },
            {
              id: 27,
              question: "Is my data secure?",
              answer:
                "Yes, we use industry-standard encryption to protect your data. All information is stored securely and we never share your data with third parties.",
            },
            {
              id: 28,
              question: "How do I contact support?",
              answer:
                'You can contact support by clicking the "Raise Ticket" button or emailing us at support@fittbot.com.',
            },
          ],
          "App usage": [
            {
              id: 38,
              question: "Can I use the app offline?",
              answer:
                "No , you need an active internet connection to use fittbot and its services",
            },
            {
              id: 31,
              question:
                "Can Fittbot be used as an alternate of medical assistance provider ?",
              answer:
                "No, Fittbot is not a medical provider and does not offer medical advice, diagnosis, or treatment",
            },
            {
              id: 32,
              question: "What is Marketplace in Fittbot ?",
              answer:
                "The Marketplace allows users to purchase health and wellness products from third-party vendors.Fittbot only provides the platform and does not own or control the Products.",
            },
            {
              id: 33,
              question: "What is GymBuddy in Fittbot ?",
              answer:
                "This feature allows users to connect with others for workout sessions, motivation, and fitness discussions.Users are responsible for their interactions and should practice due diligence when meeting other",
            },
            {
              id: 34,
              question: "Privay and Data collection?",
              answer:
                "Users' data is collected, stored, and managed in accordance with our Privacy Policy.Fittbot does not share personal data with third parties without user consent",
            },
          ],
        };

  const toggleExpand = (itemId) => {
    // If the clicked item is already expanded, close it
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      // Otherwise, expand the clicked item and close any other
      setExpandedItem(itemId);
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate the form before submission
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Check issue type
    if (
      ticketData.issueType === "" ||
      ticketData.issueType === "Select an issue type"
    ) {
      newErrors.issueType = "Please select an issue type";
      isValid = false;
    }

    // Check custom subject if "Other" is selected
    if (ticketData.issueType === "Other" && !ticketData.customSubject.trim()) {
      newErrors.customSubject = "Please enter your subject";
      isValid = false;
    }

    // Check email
    if (!ticketData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(ticketData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Check description
    if (!ticketData.description.trim()) {
      newErrors.description = "Please describe your issue";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitTicket = async () => {
    if (validateForm()) {
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
          client_id,
          subject:
            ticketData?.issueType === "Other"
              ? ticketData.customSubject
              : ticketData?.issueType,
          email: ticketData?.email,
          issue: ticketData?.description,
        };

        const response = await supportAPI(payload);
        if (response?.status === 200) {
          setToken(response?.data?.token || "fittbot-102028e8");
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setModalVisible(false);
            setTicketData({
              issueType: "",
              customSubject: "",
              email: "",
              description: "",
            });
            setErrors({});
          }, 5000);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (err) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTicketData({
      issueType: "",
      customSubject: "",
      email: "",
      description: "",
    });
    setErrors({});
    setShowSuccess(false);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/client/home")}>
          <View style={styles.flexHead}>
            <Ionicons name="arrow-back" size={20} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help and Support</Text>

        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {Object.keys(faqData || {}).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQ Content */}
      <ScrollView style={styles.content}>
        {(faqData?.[selectedTab] || []).map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(item.id)}
            >
              <Text style={styles.question}>{item.question}</Text>
              <Ionicons
                name={expandedItem === item.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedItem === item.id && (
              <Text style={styles.answer}>{item.answer}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.supportSection}>
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Having trouble or have suggestions? Our support team is available
            24/7 — Raise a ticket, and we'll get back to you as soon as
            possible.
          </Text>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="report" size={18} color="#FFF" />
            <Text style={styles.supportButtonText}>Raise Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                {showSuccess ? (
                  <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={60}
                        color="#4CAF50"
                      />
                    </View>
                    <Text style={styles.successTitle}>Ticket Submitted!</Text>
                    <Text style={styles.successText}>
                      Your ticket ID is {token}.&nbsp; Thanks for reaching out.
                      Our support team will get back to you shortly.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Raise a Ticket</Text>
                      <TouchableOpacity
                        onPress={closeModal}
                        style={styles.closeButton}
                      >
                        <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownSelector,
                          errors.issueType && styles.inputError,
                        ]}
                        onPress={() => setDropdownVisible(true)}
                      >
                        <Text
                          style={[
                            styles.dropdownText,
                            ticketData.issueType === "Select an issue type" ||
                            !ticketData.issueType
                              ? styles.placeholderText
                              : null,
                          ]}
                        >
                          {ticketData.issueType || "Select an issue type"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#999" />
                      </TouchableOpacity>
                      {errors.issueType && (
                        <Text style={styles.errorTextBottom}>
                          {errors.issueType}
                        </Text>
                      )}

                      {/* Custom Dropdown Menu */}
                      {dropdownVisible && (
                        <View style={styles.dropdownMenu}>
                          {commonIssues.map((issue) => (
                            <TouchableOpacity
                              key={issue}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setTicketData({
                                  ...ticketData,
                                  issueType: issue,
                                });
                                if (errors.issueType) {
                                  setErrors({ ...errors, issueType: null });
                                }
                                setDropdownVisible(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>
                                {issue}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Add this to close dropdown when clicking outside */}
                    {dropdownVisible && (
                      <TouchableOpacity
                        style={styles.dropdownBackdrop}
                        onPress={() => setDropdownVisible(false)}
                      />
                    )}
                    {/* Custom Subject (only shown if "Other" is selected) */}
                    {ticketData.issueType === "Other" && (
                      <View>
                        <TextInput
                          style={[
                            styles.input,
                            errors.customSubject && styles.inputError,
                          ]}
                          placeholder="Enter your subject"
                          placeholderTextColor="#999"
                          value={ticketData.customSubject}
                          onChangeText={(text) => {
                            setTicketData({
                              ...ticketData,
                              customSubject: text,
                            });
                            if (errors.customSubject) {
                              setErrors({ ...errors, customSubject: null });
                            }
                          }}
                        />
                        {errors.customSubject && (
                          <Text style={styles.errorText}>
                            {errors.customSubject}
                          </Text>
                        )}
                      </View>
                    )}

                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="Email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      value={ticketData.email}
                      onChangeText={(text) => {
                        setTicketData({ ...ticketData, email: text });
                        if (errors.email) {
                          setErrors({ ...errors, email: null });
                        }
                      }}
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}

                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        errors.description && styles.inputError,
                      ]}
                      placeholder="Describe your issue"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      value={ticketData.description}
                      onChangeText={(text) => {
                        setTicketData({ ...ticketData, description: text });
                        if (errors.description) {
                          setErrors({ ...errors, description: null });
                        }
                      }}
                    />
                    {errors.description && (
                      <Text style={styles.errorText}>{errors.description}</Text>
                    )}

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={submitTicket}
                    >
                      <Text style={styles.submitButtonText}>Submit Ticket</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  headerRight: {
    width: 30,
  },
  flexHead: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  answer: {
    fontSize: 12,
    color: "#666",
    padding: 15,
    paddingTop: 0,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 5,
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorTextBottom: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 0,
    marginBottom: 10,
    marginLeft: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  supportSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  supportCard: {
    backgroundColor: "#FFF",
    borderRadius: 7,
    padding: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  supportText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 15,
  },
  supportButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  supportButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 12,
  },
  // Success state styles
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
});

export default HelpSupportScreen;
