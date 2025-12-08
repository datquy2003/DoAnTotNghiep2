import apiClient from "./apiClient";

const listMyCvs = () => {
  return apiClient.get("/cvs/me");
};

const uploadCv = (formData) => {
  return apiClient.post("/cvs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const setDefault = (cvId) => {
  return apiClient.put(`/cvs/${cvId}/default`);
};

const removeCv = (cvId) => {
  return apiClient.delete(`/cvs/${cvId}`);
};

export const cvApi = {
  listMyCvs,
  uploadCv,
  setDefault,
  removeCv,
};
