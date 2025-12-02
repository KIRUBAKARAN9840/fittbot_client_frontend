import axios from "axios";
import axiosInstance from "./axiosInstance";
import apiConfig from "./apiConfig";
const API_URL = apiConfig.API_URL;

//---------------------My Gym Page api ---------------------

export const clientMyGymAPI = async (payload) => {
  try {
    const res = await axiosInstance.get(`/my_gym/get_other_details`, {
      params: {
        gym_id: payload.gym_id,
        client_id: payload.client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const allowDataSharingAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/my_gym/toggling_data_sharing`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//--------------------- Trainer Assigned Workout Plan api ---------------------

export const getGymTemplateClientAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/my_gym/gym_workout_template`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Home Page api ---------------------

export const clientProgressAPI = async (payload) => {
  try {
    const res = await axiosInstance.get(`/my_progress/data`, {
      params: {
        gym_id: payload.gym_id,
        client_id: payload.client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const checkClientTargetsAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/check_client_target/get`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getWeightJourneyAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/my_progress/weight_journey`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Refresh token api ---------------------

export const refreshtokenAPI = async (id, role) => {
  try {
    const res = await axios.get(`${API_URL}/auth/refresh`, {
      params: {
        id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------General Analysis api ---------------------

export const clientGeneralAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/general_analysis/client`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Workout and Diet Analysis api ---------------------

export const clientDietAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/diet_analysis/get`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientWorkoutAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/workout_analysis/get`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Workout and Diet Report api ---------------------

export const clientReportAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/client_report/get`, {
      params: {
        client_id: id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Workout Template CRUD api ---------------------

export const getWorkoutTemplateClientAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/personal_template/get`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientWrokoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/personal_template/add`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutTemplateNameAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/personal_template/update`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientWorkoutTemplateAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/personal_template/delete`, {
      params: {
        id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutTemplateExerciseAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/personal_template/edit`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Fittbot Workout api ---------------------

export const getFittbotWorkoutAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/fittbot_workout/get`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Diet Template CRUD api ---------------------

export const getDietTemplateClientAPI = async (id, method) => {
  try {
    const res = await axiosInstance.get(`/diet_personal_template/get`, {
      params: {
        method: method,
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getSingleDietTemplateAPI = async (template_id) => {
  try {
    const res = await axiosInstance.get(
      `/diet_personal_template/get_single_diet_template`,
      {
        params: {
          id: template_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/diet_personal_template/add`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietTemplateNameAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/diet_personal_template/update`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientDietTemplateAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/diet_personal_template/delete`, {
      params: {
        id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietTemplateDishesAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/diet_personal_template/edit`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateDietTemplateMeals = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/diet_personal_template/edit`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Workout CRUD api ---------------------

export const addClientWorkoutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/actual_workout/add`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/actual_workout/edit`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientWorkoutAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/actual_workout/get`, {
      params: {
        client_id: id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientWorkoutAPI = async (id, client_id) => {
  try {
    const res = await axiosInstance.delete(`/actual_workout/delete`, {
      params: {
        record_id: id,
        client_id: client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Diet CRUD api ---------------------

export const addClientDietAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/actual_diet/add`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientDietAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/actual_diet/get`, {
      params: {
        client_id: id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/actual_diet/edit`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientDietAPI = async (id, client_id, gym_id, date) => {
  try {
    const res = await axiosInstance.delete(`/actual_diet/delete`, {
      params: {
        record_id: id,
        client_id,
        gym_id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------KyraAI api ---------------------

export const addClientDietAIAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/diet/create_ai_diet`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const closeChatbotAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/chatbot/delete_chat`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Attendance api ---------------------

export const getInStatusAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/attendance/check`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPunchedInDetailsAPI = async (client_id, gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/attendance/attendance_status_with_location`,
      {
        params: {
          client_id,
          gym_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPunchInAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/attendance/in_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPunchOutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/attendance/out_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Scan QR api ---------------------

export const QRAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/qr/scan`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Feedback api ---------------------

export const sendFeedbackAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/feedback/create_feedback`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Profile Page api ---------------------

export const getClientProfileDetailsAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/profile/profile_data`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientProfileAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/profile/update_profile`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Avatar api ---------------------

export const clientAvatarsAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/profile/get_fittbot_avatars`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editAvatarAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/profile/update_avatar`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Weight , Water , Calories Input api ---------------------

export const ClientWeightUpdateNewAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/my_progress/add_inputs`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Gym Buddy api ---------------------

export const gymBuddyCreateSessionAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_buddy/create_session`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymBuddySessionsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_buddy/get_session`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyJoinProposalAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_buddy/join_session`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyAcceptProposalAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_buddy/accept_session`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyDeclineProposalAPI = async (
  session_id,
  proposal_id,
  proposer_id,
  gym_id
) => {
  try {
    const res = await axiosInstance.delete(`/gym_buddy/delete_proposal`, {
      params: {
        session_id,
        proposal_id,
        proposer_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyDeleteSessionAPI = async (session_id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/gym_buddy/delete_session`, {
      params: {
        session_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Desi Diet api ---------------------

export const getAllFoodsAPI = async (pageNum, ITEMS_PER_PAGE) => {
  try {
    const res = await axiosInstance.get(`/food/get`, {
      params: {
        page: pageNum,
        limit: ITEMS_PER_PAGE,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const searchAllFoodsAPI = async (char, page, limit) => {
  try {
    const res = await axiosInstance.get(`/food/search`, {
      params: {
        query: char,
        page,
        limit,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFoodCategoriesAPI = async () => {
  try {
    const res = await axiosInstance.get(`/food/get_categories`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFoodsByCategoryAPI = async (categories, page, limit) => {
  try {
    const categoriesString = Array.isArray(categories)
      ? categories.join(",")
      : categories;

    const res = await axiosInstance.get(`/food/categories`, {
      params: {
        categories: categoriesString,
        page,
        limit,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Auto-Calculate calories api ---------------------

export const caloriesCalculateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/calculate_macros/calculate`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Water api ---------------------

export const clientWaterTrackerAPI = async (payload) => {
  try {
    const res = await axiosInstance.get(`/water/get`, {
      params: {
        gym_id: payload.gym_id,
        client_id: payload.client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Rewards api ---------------------

export const getClientRewardsAPI = async (client_id, gym_id) => {
  try {
    const res = await axiosInstance.get(`/my_rewards/show_rewards_page`, {
      params: {
        client_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Leaderboard api ---------------------

export const getClientLeaderboardAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/leaderboard/get`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------get XP api (headers)---------------------

export const getClientXpAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/xp/get`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Manual Diet Addition api ---------------------

export const getCommonFooodAPI = async () => {
  try {
    const res = await axiosInstance.get(`/common_food/consumed`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const searchClientFoodAPI = async (query) => {
  try {
    const res = await axiosInstance.get(`/common_food/search`, {
      params: {
        query,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Report & Block Users api ---------------------

export const reportPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/community/report_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const blockPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/community/block_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- user registration api ---------------------

export const registerUserAPI = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/register-user`, payload);
    return res?.data;
    ``;
  } catch (err) {
    return err?.response?.data;
  }
};

export const registerUserOTPVerification = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/verify-client-otp`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const registerUserCompleteRegistration = async (payload) => {
  try {
    const res = await axios.post(
      `${API_URL}/auth/complete-registeration`,
      payload
    );

    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//--------------------- Manage Gym Membership api ---------------------

export const getUUIDAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client_qr/show`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- Unsubscribed User Home details api ---------------------

export const getUnsubscribedHomeAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/unpaid/home`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- Reminder api ---------------------

export const createReminderAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/reminder/create_reminders`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getRemindersAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/reminder/get_reminders`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteRemindersAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/reminder/delete_reminders`, {
      params: {
        reminder_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//--------------------- Expo token api ---------------------

export const updateExpoTokenAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/expo_token/update`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//--------------------- Send file details to AWS(feed) api ---------------------

export const hasMediainPostAPI = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/feed/create_presigned_url`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      }
    );

    if (!response) {
      throw new Error("No response received from server");
    }

    return response.data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

//--------------------- Default Workout api ---------------------

export const getDefaultWorkoutAPI = async (gender, level, goals) => {
  try {
    const res = await axiosInstance.get(
      `/default_workout_template/get_default_workout`,
      {
        params: {
          gender,
          level,
          goals,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- Default diet api ---------------------

export const getDefaultSingleDietTemplate = async (templateId) => {
  try {
    const res = await axiosInstance.get(`/default_diet_template/get`, {
      params: {
        id: templateId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getNewDefaultDietTemplate = async ({
  client_id,
  expertise_level,
  cousine,
  goal_type,
}) => {
  try {
    const res = await axiosInstance.get(`/default_diet_template/get`, {
      params: {
        client_id,
        expertise_level,
        cousine,
        goal_type,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDefaultDietTemplate = async () => {
  try {
    const res = await axiosInstance.get(
      `/default_diet_template/fittbot_template`
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- Help and support ---------------------

export const supportAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/support_token/generate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//--------------------- Smart Watch api ---------------------

export const getSmartWatchInterestAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/smartwatch/get_interest`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const showSmartWatchInterestAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/smartwatch/show_interest`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//--------------------- Avail Free Trial api ---------------------

export const availFreeTrial = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/free_trial/avail_free_trial`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const scanFoodAPI = async (formData) => {
  try {
    const res = await axios.post(`${API_URL}/food_scanner/analyze`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getAllPlans = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/fittbot_plans/get_plans`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymStudiosAPI = async (params) => {
  try {
    const res = await axiosInstance.get(`/gym_studios/list_gyms`, {
      params: {
        ...params,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getOneGymStudio = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_studios/gym`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPersonalTraining = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/my_gym/personal-training-details`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createGymOrderAPI = async (gym_id, plan_id, client_id) => {
  try {
    const res = await axiosInstance.post(
      "/gym_membership_rg/checkout/create-order",
      {
        gym_id,
        plan_id,
        client_id,
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const verifyGymPaymentAPI = async (
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
  client_id
) => {
  try {
    const res = await axiosInstance.post("/gym_membership_rg/checkout/verify", {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      client_id,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
