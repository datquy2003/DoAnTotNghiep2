import apiClient from "./apiClient";

const getVipPackages = (roleId) => {
  return apiClient.get(`/vip-packages?roleId=${roleId}`);
};

const createVipPackage = (data) => {
  return apiClient.post("/vip-packages", data);
};

const updateVipPackage = (id, data) => {
  return apiClient.put(`/vip-packages/${id}`, data);
};

const deleteVipPackage = (id) => {
  return apiClient.delete(`/vip-packages/${id}`);
};

export const vipApi = {
  getVipPackages,
  createVipPackage,
  updateVipPackage,
  deleteVipPackage,
};