import apiClient from "./apiClient";

const getCompanyDetail = (companyId) => {
  return apiClient.get(`/companies/${companyId}`);
};

const blockCompany = (companyId) => {
  return apiClient.post(`/companies/${companyId}/block`);
};

const unblockCompany = (companyId) => {
  return apiClient.delete(`/companies/${companyId}/block`);
};

const getBlockedCompanies = () => {
  return apiClient.get("/companies/blocked/list");
};

export const companyApi = {
  getCompanyDetail,
  blockCompany,
  unblockCompany,
  getBlockedCompanies,
};
