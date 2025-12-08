import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
});

const addAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

export const authApi = {
  getMe: async (token) => {
    addAuthToken(token);
    return await apiClient.get("/api/auth/me");
  },

  registerInDb: async (token, roleID) => {
    addAuthToken(token);
    return await apiClient.post("/api/auth/register", { roleID });
  },
};
