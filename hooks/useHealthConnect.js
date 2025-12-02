import { useState, useEffect, useCallback } from "react";
import { Platform, Linking } from "react-native";
import Constants from "expo-constants";
import { toIndianISOString } from "../utils/basicUtilFunctions";

// Conditionally load react-native-health-connect only when not in Expo Go
let HealthConnect;
if (Constants.executionEnvironment !== "storeClient") {
  HealthConnect = require("react-native-health-connect");
} else {
  HealthConnect = null;
}

// Custom hook for integrating Health Connect
const useHealthConnect = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [stepsData, setStepsData] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if Health Connect is available and initialize it
  const checkAvailability = useCallback(async () => {
    if (Platform.OS !== "android" || !HealthConnect) {
      setIsAvailable(false);
      return;
    }

    try {
      const status = await HealthConnect.getSdkStatus();
      const available =
        status === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE;
      setIsAvailable(available);

      if (available) {
        const initResult = await HealthConnect.initialize();
        setIsInitialized(initResult);
      }
    } catch (err) {
      console.error("Health Connect availability check failed:", err);
      setError(err.message);
      setIsAvailable(false);
    }
  }, []);

  // Open Health Connect settings
  const openSettings = useCallback(async () => {
    if (!HealthConnect) return false;

    try {
      await HealthConnect.openHealthConnectSettings();
      return true;
    } catch (err) {
      console.error("Failed to open Health Connect settings:", err);
      try {
        await Linking.openURL("package:com.google.android.apps.healthdata");
      } catch (linkErr) {
        await Linking.openURL(
          "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"
        );
      }
      return false;
    }
  }, []);

  // Fetch today's step count
  const fetchTodaySteps = useCallback(async () => {
    if (!hasPermission || !HealthConnect) return;

    try {
      setIsLoading(true);
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const result = await HealthConnect.readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: toIndianISOString(startOfDay),
          endTime: toIndianISOString(now),
        },
      });

      // Sum all step records
      const totalSteps = result.records.reduce(
        (sum, record) => sum + (record.count || 0),
        0
      );

      setStepsData(totalSteps);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch steps:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  // Check if permission exists by attempting to read data
  const checkPermission = useCallback(async () => {
    if (!isAvailable || !isInitialized || !HealthConnect) return false;

    try {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      await HealthConnect.readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: toIndianISOString(startOfDay),
          endTime: toIndianISOString(now),
        },
      });

      setHasPermission(true);
      return true;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, [isAvailable, isInitialized]);

  // 🔥 Main setup flow — request permissions and initialize
  const setupHealthConnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Check availability first
      if (!isAvailable || !isInitialized) {
        await checkAvailability();
      }

      // Step 2: Verify Health Connect is ready
      if (!HealthConnect) {
        setError("Health Connect library not available");
        return false;
      }

      // Step 3: Request permission from Health Connect
      console.log("Requesting Health Connect permissions...");
      const granted = await HealthConnect.requestPermission([
        { accessType: "read", recordType: "Steps" },
      ]);

      console.log("Permission result:", granted);

      if (granted && granted.length > 0) {
        // Permission granted 🎉
        console.log("Permission granted!");
        setHasPermission(true);
        setError(null);

        // Fetch fresh step data immediately
        await fetchTodaySteps();

        return true;
      }

      // ❌ Permission denied or cancelled — open settings manually
      console.log("Permission denied or cancelled, opening settings...");
      await openSettings();
      setError("Grant permission in Health Connect, then tap Refresh.");
      return false;
    } catch (err) {
      console.error("Setup failed:", err);
      setError(err.message || "Failed to setup Health Connect");

      // Try to open settings as a fallback
      try {
        await openSettings();
      } catch (settingsErr) {
        console.error("Failed to open settings:", settingsErr);
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    isAvailable,
    isInitialized,
    checkAvailability,
    openSettings,
    fetchTodaySteps,
  ]);

  // Initialize on mount
  useEffect(() => {
    (async () => {
      await checkAvailability();
    })();
  }, [checkAvailability]);

  // Check permission after initialization
  useEffect(() => {
    if (isInitialized && isAvailable) {
      checkPermission();
    }
  }, [isInitialized, isAvailable, checkPermission]);

  // Auto-fetch steps if permission already exists
  useEffect(() => {
    if (hasPermission && isInitialized) {
      fetchTodaySteps();
    }
  }, [hasPermission, isInitialized, fetchTodaySteps]);

  // Return all state and helpers
  return {
    isAvailable,
    isInitialized,
    hasPermission,
    stepsData,
    isLoading,
    error,
    setupHealthConnect,
    fetchTodaySteps,
    checkPermission,
    openSettings,
  };
};

export default useHealthConnect;
