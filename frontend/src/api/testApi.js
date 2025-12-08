// Đây là 1 file test để tạo mới các user có email không tồn tại mặc định verified để phục vụ cho việc test các tính năng của users sau này
import apiClient from "./apiClient";

const createTestUser = (data) => {
  return apiClient.post("/test/create-user", data);
};

export const testApi = {
  createTestUser,
};