import apiClient from "./apiClient";

const getApplicationInsight = (jobId) => {
  return apiClient.post("/vip-features/candidate/application-insight", {
    jobId,
  });
};

const getApplicantList = (jobId) => {
  return apiClient.get(`/vip-features/candidate/applicant-list/${jobId}`);
};

export const vipFeatureApi = {
  getApplicationInsight,
  getApplicantList,
};