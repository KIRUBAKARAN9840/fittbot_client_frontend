import axiosInstance from "../../../services/axiosInstance";
import Constants from "expo-constants";

const buildCommandUrl = (requestId, commandPath = "/pay/dailypass_v2/commands/") => {
  if (!requestId) return "";
  const base = (axiosInstance.defaults?.baseURL || "").replace(/\/$/, "") || "";
  const path = commandPath.endsWith("/") ? commandPath : `${commandPath}/`;
  return `${base}${path}${requestId}`;
};

const waitForCommandCompletion = async (
  requestId,
  commandPath = "/pay/dailypass_v2/commands/",
  label = "dailypass command"
) => {
  const commandUrl = buildCommandUrl(requestId, commandPath);
  if (!commandUrl) {
    throw new Error(`Unable to resolve ${label} status URL`);
  }

  const maxAttempts = 20;
  let delayMs = 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data } = await axiosInstance.get(commandUrl, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });

    if (data?.status === "completed") {
      return data?.data || {};
    }

    if (data?.status === "failed") {
      throw new Error(data?.error || `${label} failed. Please try again.`);
    }

    const jitterMs = Math.random() * 300;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(delayMs + jitterMs, 10000))
    );
    delayMs = Math.min(delayMs * 1.5, 10000);
  }

  throw new Error(
    `${label} is taking longer than expected. Please retry in a moment.`
  );
};

let RazorpayCheckout;
if (Constants.executionEnvironment !== "storeClient") {
  RazorpayCheckout = require("react-native-razorpay").default;
} else {
  RazorpayCheckout = null;
}

export async function handlePay({
  gymId,
  clientId,
  startDate,
  daysTotal,
  selectedTime,

  // subscription flags (optional)
  includeSubscription = false,
  selectedPlan = null,

  // optional metadata
  userType = "existing",
  planDetails = null,
  reward,
}) {
  let orderId = null;

  try {
    if (!gymId) throw new Error("gymId is required");
    if (!clientId) throw new Error("clientId is required");
    if (!startDate) throw new Error("startDate is required");
    if (!daysTotal || Number(daysTotal) <= 0)
      throw new Error("daysTotal must be > 0");
    if (includeSubscription && !selectedPlan) {
      throw new Error(
        "selectedPlan is required when includeSubscription is true"
      );
    }

    // 1) Create unified checkout (server does all pricing & validation)
    const { data: checkoutCommand } = await axiosInstance.post(
      "/pay/dailypass_v2/checkout",
      {
        gymId: Number(gymId),
        clientId: String(clientId),
        startDate: String(startDate),
        daysTotal: Number(daysTotal),
        selectedTime,

        // pricing fields are ignored by server; send null/omitted
        dailyPassAmount: null,
        subscriptionAmount: null,
        rewardDiscount: 0,
        finalAmount: null,

        includeSubscription: !!includeSubscription,
        selectedPlan: includeSubscription ? Number(selectedPlan) : null,

        userType,
        planDetails,
        reward,
      }
    );

    const checkout = await waitForCommandCompletion(
      checkoutCommand?.request_id,
      "/pay/dailypass_v2/commands/",
      "dailypass checkout"
    );

    const {
      orderId: checkoutOrderId,
      razorpayOrderId,
      razorpayKeyId,
      amount, // <-- authoritative amount (paise)
      currency,
      description,
      reward_applied,
    } = checkout || {};

    orderId = checkoutOrderId;

    if (!razorpayOrderId || !razorpayKeyId || !amount) {
      throw new Error("Server did not return a valid Razorpay order");
    }

    // 2) Open Razorpay Checkout
    if (!RazorpayCheckout)
      throw new Error("Razorpay not available on this platform");

    const orderOptions = {
      key: razorpayKeyId,
      order_id: razorpayOrderId,
      amount, // paise (from server)
      currency: currency || "INR",
      name: "Fittbot",
      description: description || `${daysTotal} days starting ${startDate}`,
      notes: { client_id: String(clientId), gym_id: String(gymId) },
      theme: { color: "#0ea5e9" },
    };

    const rp = await RazorpayCheckout.open(orderOptions);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      rp || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error("Missing Razorpay response fields");
    }

    // 3) Verify payment (unified verification)
    let verified = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { data: verifyCommand } = await axiosInstance.post(
          "/pay/dailypass_v2/verify",
          {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            reward,
            reward_applied,
          },
          {
            headers: { "Idempotency-Key": String(orderId || razorpayOrderId) },
          }
        );

        const verification = await waitForCommandCompletion(
          verifyCommand?.request_id,
          "/pay/dailypass_v2/commands/",
          "dailypass verify"
        );

        verified = verification;

        // If verification is successful, break the loop
        if (verified?.success || verified?.verified) {
          break;
        }

        // If it's a failed status, retry
        attempts++;
        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff: 2s, 4s)
          const delayMs = Math.min(4000, 2000 * attempts);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait before retrying on error
        const delayMs = Math.min(4000, 2000 * attempts);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return { ...verified, orderId };
  } catch (error) {
    // Return error with orderId if available
    return {
      success: false,
      message: error?.message || "Payment failed",
      orderId,
      error: true,
    };
  }
}

export async function handlePayUpgrade({
  gymId,
  clientId,
  pass_id,
  days,
  total_upgrade_cost,

  // subscription flags (optional)
  includeSubscription = false,
  selectedPlan = null,

  // optional metadata
  userType = "existing",
  planDetails = null,
}) {
  let orderId = null;

  try {
    if (!gymId) throw new Error("gymId is required");
    if (!clientId) throw new Error("clientId is required");

    if (includeSubscription && !selectedPlan) {
      throw new Error(
        "selectedPlan is required when includeSubscription is true"
      );
    }

    // 1) Create unified checkout (server does all pricing & validation)
    const { data: checkoutCommand } = await axiosInstance.post(
      "/pay/dailypass_v2/upgrade/checkout",
      {
        new_gym_id: Number(gymId),
        client_id: String(clientId),
        pass_id: pass_id,
        remaining_days_count: days,
        delta_minor: total_upgrade_cost,

        // includeSubscription: !!includeSubscription,
        // selectedPlan: includeSubscription ? Number(selectedPlan) : null,

        // userType,
        // planDetails,
      }
    );

    const checkout = await waitForCommandCompletion(
      checkoutCommand?.request_id,
      "/pay/dailypass_v2/commands/",
      "dailypass upgrade checkout"
    );

    const {
      orderId: checkoutOrderId,
      razorpayOrderId,
      razorpayKeyId,
      amount,
      currency,
      description,
    } = checkout || {};

    orderId = checkoutOrderId;

    if (!razorpayOrderId || !razorpayKeyId || !amount) {
      throw new Error("Server did not return a valid Razorpay order");
    }

    // 2) Open Razorpay Checkout
    if (!RazorpayCheckout)
      throw new Error("Razorpay not available on this platform");

    const orderOptions = {
      key: razorpayKeyId,
      order_id: razorpayOrderId,
      amount, // paise (from server)
      currency: currency || "INR",
      name: "Fittbot",
      description: description || "Upgrade Pass",
      notes: { client_id: String(clientId), gym_id: String(gymId) },
      theme: { color: "#0ea5e9" },
    };

    const rp = await RazorpayCheckout.open(orderOptions);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      rp || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error("Missing Razorpay response fields");
    }

    // 3) Verify payment (unified verification)
    let verified = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { data: verifyCommand } = await axiosInstance.post(
          "/pay/dailypass_v2/upgrade/verify",
          {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            pass_id: pass_id,
          },
          {
            headers: { "Idempotency-Key": String(orderId || razorpayOrderId) },
          }
        );

        verified = await waitForCommandCompletion(
          verifyCommand?.request_id,
          "/pay/dailypass_v2/commands/",
          "dailypass upgrade verify"
        );

        // If verification is successful, break the loop
        if (verified?.success || verified?.verified) {
          break;
        }

        // If it's a failed status, retry
        attempts++;
        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff: 2s, 4s)
          const delayMs = Math.min(4000, 2000 * attempts);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait before retrying on error
        const delayMs = Math.min(4000, 2000 * attempts);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return { ...verified, orderId };
  } catch (error) {
    // Return error with orderId if available
    return {
      success: false,
      message: error?.message || "Payment failed",
      orderId,
      error: true,
    };
  }
}

export default handlePay;
