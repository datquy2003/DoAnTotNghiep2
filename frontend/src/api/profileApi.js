import apiClient from "./apiClient";

const updateBaseProfile = (data) => {
  return apiClient.put("/users/me/base", data);
};

const getCandidateProfile = () => {
  return apiClient.get("/candidates/me");
};

const getPushTopRemaining = () => {
  return apiClient.get("/candidates/me/push-top/remaining");
};

const updateCandidateProfile = (data) => {
  return apiClient.put("/candidates/me", data);
};

const getCompanyProfile = () => {
  return apiClient.get("/companies/me");
};

const updateCompanyProfile = (data) => {
  return apiClient.put("/companies/me", data);
};

const geocodeAddress = (address) => {
  return apiClient.post("/utils/geocode", { address });
};

export const profileApi = {
  updateBaseProfile,
  getCandidateProfile,
  getPushTopRemaining,
  updateCandidateProfile,
  getCompanyProfile,
  updateCompanyProfile,
  geocodeAddress,
};