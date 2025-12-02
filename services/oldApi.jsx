import axios from "axios";
import axiosInstance from "./axiosInstance";
import apiConfig from "./apiConfig";
const API_URL = apiConfig.API_URL;

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

export const clientGeneralAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/client_general_analysis`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientDietAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/diet_analysis`, {
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
    const res = await axiosInstance.get(`/client/workout_insights`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientReportAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/client/get_client_report`, {
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

// export const getWorkoutTemplateClientAPI = async (id) => {
//   try {
//     const res = await axiosInstance.get(
//       `/client/manual_client_workout_template`,
//       {
//         params: {
//           client_id: id,
//         },
//       }
//     );
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

export const getWorkoutTemplateClientAPI = async (id) => {
  try {
    const res = await axiosInstance.get(
      `${`https://c5284c100e73.ngrok-free.app`}/client/manual_client_workout_template`,
      {
        params: {
          client_id: id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientWrokoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/manual/add_workout_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutTemplateNameAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/manual/edit_workout_template_name`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientWorkoutTemplateAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(
      `/client/manual/delete_workout_template`,
      {
        params: {
          id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutTemplateExerciseAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/manual/update_workout_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFittbotWorkoutAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/get_fittbot_workout`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getInStatusAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/attendance_status`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDietTemplateClientAPI = async (id, method) => {
  try {
    const res = await axiosInstance.get(`/client/get_diet_template`, {
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

export const addClientDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/add_diet_template`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietTemplateNameAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/edit_diet_template_name`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientDietTemplateAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_diet_template`, {
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
      `/client/update_diet_template`,
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
      `/client/update_diet_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientWorkoutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/create_actual_workout`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_actual_workout`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientWorkoutAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/client/get_actual_workout`, {
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
    const res = await axiosInstance.delete(
      `/client/delete_all_actual_workout`,
      {
        params: {
          record_id: id,
          client_id: client_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientDietAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/create_actual_diet`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const closeChatbotAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${`https://c5284c100e73.ngrok-free.app`}/chatbot/delete_chat`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// export const closeChatbotAPI = async (payload) => {
//   try {
//     const res = await axiosInstance.post(`/chatbot/delete_chat`, payload);
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

// export const addClientDietAIAPI = async (payload) => {
//   try {
//     const res = await axios.post(
//       `${`https://16850456bb97.ngrok-free.app`}/diet/create_ai_diet`,
//       payload
//     );
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

export const addClientDietAIAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/diet/create_ai_diet`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// export const getClientDietAPI = async (id, date) => {
//   try {
//     const res = await axiosInstance.get(
//       `${`https://16850456bb97.ngrok-free.app`}/client/get_actual_diet`,
//       {
//         params: {
//           client_id: id,
//           date,
//         },
//       }
//     );
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

export const getClientDietAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/client/get_actual_diet`, {
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
    const res = await axiosInstance.put(`/client/edit_actual_diet`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientDietAPI = async (id, client_id, gym_id, date) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_actual_diet`, {
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

export const getPunchedInDetailsAPI = async (client_id, gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/client/attendance_status_with_location`,
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
    const res = await axiosInstance.post(`/client/in_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPunchOutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/out_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const QRAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/scan_qr`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/send_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getMessagesAPI = async (gym_id, loggedInUserId) => {
  try {
    const res = await axiosInstance.get(`/client/messages`, {
      params: {
        gym_id,
        user_id: loggedInUserId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const editMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteMessagesAPI = async (message_ids) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_messages`, {
      data: { message_ids },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const sendFeedbackAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/feedback/create_feedback`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientProfileDetailsAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client/profile_data`, {
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
    const res = await axiosInstance.put(`/client/update_profile`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const ClientWeightUpdateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/add_inputs`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const ClientWeightUpdateNewAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/my_progress/add_inputs`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyCreateSessionAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/gym_buddy/create_session`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymBuddySessionsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/client/gym_buddy/get_sessions`, {
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
    const res = await axiosInstance.post(
      `/client/gym_buddy/join_proposal`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyAcceptProposalAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/gym_buddy/accept_proposal`,
      payload
    );
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
    const res = await axiosInstance.delete(
      `/client/gym_buddy/delete_proposal`,
      {
        params: {
          session_id,
          proposal_id,
          proposer_id,
          gym_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyDeleteSessionAPI = async (session_id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/client/gym_buddy/delete_session`, {
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

export const getAllFoodsAPI = async (pageNum, ITEMS_PER_PAGE) => {
  try {
    const res = await axiosInstance.get(`/client/foods`, {
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
    const res = await axiosInstance.get(`/client/search`, {
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

export const caloriesCalculateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/calculate-calories`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientWaterTrackerAPI = async (payload) => {
  try {
    const res = await axiosInstance.get(`/client/watertracker`, {
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

export const getFoodCategoriesAPI = async () => {
  try {
    const res = await axiosInstance.get(`/client/food_categories`);
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

    const res = await axiosInstance.get(`/client/foods/categories`, {
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

//---------------------Rewards and leaderboard api ---------------------

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

export const getClientLeaderboardAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/client/leaderboard`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientXpAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client/get_xp`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
//---------------------Gym Buddy api ---------------------

export const getSessionMessagesAPI = async (session_id) => {
  try {
    const res = await axiosInstance.get(`/client/get_gb_messages`, {
      params: {
        session_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendSessionMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/send_gb_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editSessionMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_gb_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteSessionMessagesAPI = async (message_ids) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_gb_messages`, {
      data: { message_ids },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

//---------------------Avatar api ---------------------

export const clientAvatarsAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/get_fittbot_avatars`, {
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
    const res = await axiosInstance.put(`/client/update_avatar`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//---------------------Diet api ---------------------

export const getCommonFooodAPI = async () => {
  try {
    const res = await axiosInstance.get(`/client/consumed_foods`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const searchClientFoodAPI = async (query) => {
  try {
    const res = await axiosInstance.get(`/client/search_consumed_food`, {
      params: {
        query,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const reportPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/report_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const blockPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/block_user`, payload);
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

//--------------------- Target Modal api ---------------------

export const checkClientTargetsAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client/check-client-target`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- QR Generation api ---------------------

export const getUUIDAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client/show-client-qr`, {
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
    const res = await axiosInstance.get(`/client/get-unpaid-home`, {
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
    const res = await axiosInstance.post(
      `${API_URL}/reminder/create_reminders`,
      payload
    );
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
    const res = await axiosInstance.post(
      `${API_URL}/client/update_expo_token`,
      payload
    );
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

export const getSingleDietTemplateAPI = async (template_id) => {
  try {
    const res = await axiosInstance.get(`/client/get_single_diet_template`, {
      params: {
        id: template_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDefaultSingleDietTemplate = async (templateId) => {
  try {
    const res = await axiosInstance.get(`/client/get_single_fittbot_template`, {
      params: {
        id: templateId,
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
//--------------------- Help and support ---------------------

export const supportAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/support_token/generate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getGymTemplateClientAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/gym_workout_template`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getSmartWatchInterestAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/smart-watch`, {
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
    const res = await axiosInstance.post(`/client/smart-watch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getNewDefaultDietTemplate = async ({
  client_id,
  expertise_level,
  cousine,
  goal_type,
}) => {
  try {
    const res = await axiosInstance.get(
      `/default_diet_template/get_single_fittbot_template`,
      {
        params: {
          client_id,
          expertise_level,
          cousine,
          goal_type,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDefaultDietTemplate = async () => {
  try {
    const res = await axiosInstance.get(`/client/get_fittbot_diet_template`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

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

export const createGymOrderAPI = async (gym_id, plan_id, client_id) => {
  try {
    const res = await axiosInstance.post(
      "/payments/gym/checkout/create-order",
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
  razorpay_signature
) => {
  try {
    const res = await axiosInstance.post("/payments/gym/checkout/verify", {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
