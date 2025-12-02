import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../utils/Toaster";
import { safeParseJSON } from "../../utils/safeHelpers";

import {
  ChatSocketProvider,
  useChatSocket,
} from "../../context/chatWebSocketProvider";
import useChatSocketHook from "../../context/useChatSocket";

/* ───────── wrapper ───────── */
export default function SessionChatWrapper() {
  const { sessionId } = useLocalSearchParams();
  if (!sessionId) return null;

  return (
    <ChatSocketProvider sessionId={sessionId}>
      <SessionChat />
    </ChatSocketProvider>
  );
}

/* ───────── main screen ───────── */
function SessionChat() {
  const params = useLocalSearchParams();
  const { sessionName, host_id } = params;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { sendMessage, editMessage, deleteMessages } = useChatSocket();

  const flatRef = useRef(null);
  const textInputRef = useRef(null);
  const router = useRouter();

  /* ─── keyboard event listeners ─── */
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  /* ─── dismiss keyboard ─── */
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  /* ─── own id ─── */
  useEffect(() => {
    AsyncStorage.getItem("client_id").then(setUserId);
  }, []);

  /* ─── session details (for SessionInfo strip) ─── */
  useEffect(() => {
    if (params.selectedSession) {
      const data =
        typeof params.selectedSession === "string"
          ? safeParseJSON(params.selectedSession, null)
          : params.selectedSession;
      if (data) {
        setSessionDetails(data);
      }
    }
  }, [params.selectedSession]);

  /* ─── helpers ─── */
  const scroll = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);

  const addHeaders = (arr) => {
    if (!arr.length) return [];
    const res = [];
    let cur = "";
    arr.forEach((m) => {
      const d = new Date(m.sent_at).toDateString();
      if (d !== cur) {
        cur = d;
        res.push({ id: `h-${d}`, hdr: true, date: d });
      }
      res.push(m);
    });
    return res;
  };

  /* ─── socket events ─── */
  useChatSocketHook((p) => {
    switch (p.action) {
      case "old_messages":
        setMessages(addHeaders(p.data || []));
        break;
      case "new_message":
        setMessages((prev) => [...prev, p.data]);
        break;
      case "edit_message":
        setMessages((prev) =>
          prev.map((m) => (m.id === p.data.id ? { ...m, ...p.data } : m))
        );
        break;
      case "delete_message":
        setMessages((prev) =>
          prev.filter((m) => !p.data.message_ids.includes(m.id))
        );
        break;
    }
    scroll();
  });

  /* ─── send / edit ─── */
  const onSend = useCallback(async () => {
    if (!text.trim()) return;

    if (editing) {
      editMessage({ messageId: editing.id, message: text.trim() });
      setEditing(null);
      // Clear selection after editing
      setSelected([]);
      setSelectMode(false);
    } else {
      const cid = await AsyncStorage.getItem("client_id");
      sendMessage({ clientId: cid, message: text.trim() });
    }
    setText("");
  }, [text, editing]);

  /* ─── delete ─── */
  const doDelete = () =>
    Alert.alert("Delete messages?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMessages(selected);
          setSelectMode(false);
          setSelected([]);
        },
      },
    ]);

  /* ─── cancel editing ─── */
  const cancelEditing = () => {
    setEditing(null);
    setText("");
    setSelected([]);
    setSelectMode(false);
  };

  /* ─── render row ─── */
  const render = ({ item }) => {
    if (item.hdr)
      return (
        <View style={styles.dateHdr}>
          <View style={styles.line} />
          <Text style={styles.dateTxt}>{item.date}</Text>
          <View style={styles.line} />
        </View>
      );

    const self = item.client_id == userId;
    const sel = selected.includes(item.id);

    return (
      <TouchableWithoutFeedback
        onLongPress={() =>
          self && (setSelectMode(true), setSelected([item.id]))
        }
        onPress={() => {
          if (selectMode) {
            setSelected((p) =>
              p.includes(item.id)
                ? p.filter((x) => x !== item.id)
                : [...p, item.id]
            );
          } else {
            // Dismiss keyboard when tapping on messages
            dismissKeyboard();
          }
        }}
      >
        <View style={styles.msgWrap}>
          {!self && (
            <Text style={styles.sender}>
              {item.client_id == host_id ? "Host" : item.client_name}
            </Text>
          )}
          <View
            style={[
              styles.bubble,
              self ? styles.self : styles.other,
              sel && styles.sel,
            ]}
          >
            <Text>{item.message}</Text>
            <Text style={styles.time}>
              {new Date(item.sent_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  /* ─── session-info strip component ─── */
  const SessionInfo = () =>
    sessionDetails ? (
      <TouchableOpacity
        style={styles.sessionInfo}
        onPress={() =>
          Alert.alert(
            "Session Details",
            `Date: ${new Date(
              sessionDetails.session_date
            ).toLocaleDateString()}\nTime: ${
              sessionDetails.session_time
            }\nType: ${sessionDetails.workout_type} Workout\nParticipants: ${
              sessionDetails.participant_count
            }/${sessionDetails.participant_limit}`
          )
        }
      >
        <View style={styles.sessionRowWrap}>
          <View style={styles.sessionRow}>
            <Ionicons name="calendar-outline" size={16} color="#FFF" />
            <Text style={styles.sessionTxt}>
              {sessionDetails.session_date
                ? new Date(sessionDetails.session_date).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <Ionicons name="time-outline" size={16} color="#FFF" />
            <Text style={styles.sessionTxt}>
              {sessionDetails.session_time || "N/A"}
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <FontAwesome5 name="dumbbell" size={14} color="#FFF" />
            <Text style={styles.sessionTxt}>
              {sessionDetails.workout_type || "General"} Workout
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={16} color="#FFF" />
      </TouchableOpacity>
    ) : null;

  /* ─── render ─── */
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* header */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 5 }}
              >
                <Ionicons name="arrow-back" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.hTitle}>{sessionName ?? "Session Chat"}</Text>
            </View>

            {selectMode ? (
              <View style={styles.selCtrl}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectMode(false);
                    setSelected([]);
                    if (editing) {
                      cancelEditing();
                    }
                  }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: "#fff", marginHorizontal: 6 }}>
                  {selected.length} selected
                </Text>
                <TouchableOpacity
                  disabled={selected.length !== 1}
                  onPress={() => {
                    const m = messages.find((x) => x.id === selected[0]);
                    setEditing(m);
                    setText(m.message);
                    setSelectMode(false);
                    // Focus the text input after a short delay
                    setTimeout(() => {
                      textInputRef.current?.focus();
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={selected.length === 1 ? "#fff" : "#aaa"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!selected.length}
                  onPress={doDelete}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={selected.length ? "#fff" : "#aaa"}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <Ionicons name="chatbubbles" size={22} color="#fff" />
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* session strip */}
        {/* <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View>
            <SessionInfo />
          </View>
        </TouchableWithoutFeedback> */}

        {/* Messages list */}
        <View style={styles.flex1}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(i) => i.id.toString()}
            renderItem={render}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: 12,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scroll}
            onScrollBeginDrag={dismissKeyboard}
            style={styles.flex1}
          />
        </View>

        {/* Edit mode indicator */}
        {editing && (
          <View style={styles.editIndicator}>
            <Ionicons name="create-outline" size={16} color="#006FAD" />
            <Text style={styles.editText}>Editing message</Text>
            <TouchableOpacity onPress={cancelEditing} style={styles.cancelEdit}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            ref={textInputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={editing ? "Edit message..." : "Type…"}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            textAlignVertical="top"
          />
          <TouchableOpacity onPress={onSend} style={styles.send}>
            <Ionicons
              name={editing ? "checkmark" : "send"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          {editing && (
            <TouchableOpacity
              onPress={cancelEditing}
              style={styles.cancelButton}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F7F7" },
  flex1: { flex: 1 },

  /* header */
  header: {
    backgroundColor: "#006FAD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  hTitle: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  selCtrl: { flexDirection: "row", alignItems: "center" },

  /* session strip */
  sessionInfo: {
    backgroundColor: "#006FAD80",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionRowWrap: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  sessionRow: { flexDirection: "row", alignItems: "center" },
  sessionTxt: { color: "#FFF", fontSize: 12, marginLeft: 5 },

  /* list items */
  msgWrap: { marginVertical: 6 },
  sender: { fontSize: 11, color: "#666", marginLeft: 8, marginBottom: 2 },
  bubble: { padding: 10, borderRadius: 18, minWidth: 80 },
  self: { alignSelf: "flex-end", backgroundColor: "#006FAD33" },
  other: { alignSelf: "flex-start", backgroundColor: "#fff" },
  sel: { backgroundColor: "#BBDEFB", borderWidth: 2, borderColor: "#2196F3" },
  time: { fontSize: 10, color: "#888", marginTop: 4, textAlign: "right" },

  /* date header */
  dateHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
  dateTxt: { fontSize: 12, color: "#888", paddingHorizontal: 8 },
  line: { flex: 1, height: 1, backgroundColor: "#ddd" },

  /* edit indicator */
  editIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  editText: {
    flex: 1,
    marginLeft: 8,
    color: "#006FAD",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelEdit: {
    padding: 4,
  },

  /* input row */
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    minHeight: 56,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  send: {
    marginLeft: 8,
    backgroundColor: "#006FAD",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    marginLeft: 8,
    backgroundColor: "#f0f0f0",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
