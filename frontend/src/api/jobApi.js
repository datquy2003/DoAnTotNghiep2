import apiClient from "./apiClient";

const getMyJobs = () => apiClient.get("/jobs/my-jobs");
const createJob = (data) => apiClient.post("/jobs", data);

export const jobApi = {
  getMyJobs,
  createJob,
};