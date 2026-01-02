import apiClient from "./apiClient";

const getNotifications = (limit = 10) => {
  return apiClient.get(`/notifications?limit=${limit}`);
};

const markAsRead = (id) => {
  return apiClient.post(`/notifications/${id}/read`);
};

const markAllRead = () => {
  return apiClient.post("/notifications/mark-all-read");
};

const triggerRefresh = () => {
  window.dispatchEvent(new CustomEvent("refreshNotifications"));
};

export const notificationApi = {
  getNotifications,
  markAsRead,
  markAllRead,
  triggerRefresh,
};