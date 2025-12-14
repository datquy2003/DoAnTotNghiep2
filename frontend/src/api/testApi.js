import apiClient from "./apiClient";

const createTestUser = (data) => {
  return apiClient.post("/test/create-user", data);
};

export const testApi = {
  createTestUser,
};