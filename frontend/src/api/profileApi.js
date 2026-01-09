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

const searchSearchableCandidates = (params) => {
  return apiClient.get("/candidates/searchable", { params });
};

const pushTopCandidate = () => {
  return apiClient.post("/candidates/me/push-top");
};

const revealCandidateContact = (candidateId, jobId) => {
  const payload = { candidateId };
  if (jobId) payload.jobId = jobId;
  return apiClient.post("/vip-features/employer/reveal-contact", payload);
};

const createOneTimeCheckout = (featureKey, candidateId) => {
  return apiClient.post("/payment/create-one-time-session", {
    featureKey,
    candidateId,
  });
};

const logProfileView = (candidateId) => {
  return apiClient.post("/candidates/log-profile-view", { candidateId });
};

const getProfileViews = () => {
  return apiClient.get("/candidates/me/profile-views");
};

export const profileApi = {
  updateBaseProfile,
  getCandidateProfile,
  getPushTopRemaining,
  updateCandidateProfile,
  getCompanyProfile,
  updateCompanyProfile,
  geocodeAddress,
  searchSearchableCandidates,
  revealCandidateContact,
  createOneTimeCheckout,
  pushTopCandidate,
  logProfileView,
  getProfileViews,
};