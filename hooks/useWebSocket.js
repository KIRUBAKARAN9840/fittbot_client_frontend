import { useEffect, useRef, useCallback } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import apiConfig from "../services/apiConfig";
import { useUser } from "../context/UserContext";
import * as SecureStore from "expo-secure-store";

export const useWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const { profile } = useUser();
  const clientId = profile?.client_id;

  const connect = useCallback(async () => {
    if (!clientId) {
      console.log("VOICE_DEBUG: No clientId available, skipping WebSocket connection");
      return;
    }

    // Get JWT token for authentication using the same method as other WebSocket connections
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (!token) {
        console.log("VOICE_DEBUG: No auth token available, WebSocket will fail");
        return;
      }

      const host = apiConfig.API_URL.split("//")[1];
      const url = `wss://${host}/websocket/ws/user/${clientId}?token=${token}`;
      console.log("VOICE_DEBUG: Connecting to WebSocket URL with auth:", url);

      wsRef.current = new ReconnectingWebSocket(url, [], {
        maxRetries: 999,
        reconnectInterval: 1500,
      });
      console.log("VOICE_DEBUG: WebSocket instance created for client:", clientId);
    } catch (error) {
      console.error("VOICE_DEBUG: Failed to get auth token:", error);
    }

    wsRef.current.addEventListener("message", (event) => {
      console.log("VOICE_DEBUG: Raw WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("VOICE_DEBUG: Parsed WebSocket message:", data);
        if (onMessage) {
          console.log("VOICE_DEBUG: Calling onMessage handler with data:", data);
          onMessage(data);
        } else {
          console.log("VOICE_DEBUG: No onMessage handler provided");
        }
      } catch (error) {
        console.error("VOICE_DEBUG: Failed to parse WebSocket message:", error);
      }
    });

    wsRef.current.addEventListener("open", () => {
      console.log(`VOICE_DEBUG: Connected to user WebSocket channel: ${clientId}`);
    });

    wsRef.current.addEventListener("close", () => {
      console.log(`VOICE_DEBUG: Disconnected from user WebSocket channel: ${clientId}`);
    });

    wsRef.current.addEventListener("error", (error) => {
      console.error("VOICE_DEBUG: WebSocket error:", error);
    });

    // Keep connection alive with ping
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('{"type":"ping"}');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
    };

  }, [clientId, onMessage]);

  useEffect(() => {
    connect(); // Call the async connect function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
  }, []);

  return {
    ws: wsRef.current,
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};