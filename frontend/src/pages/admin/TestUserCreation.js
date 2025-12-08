// Đây là 1 file test để tạo mới các user có email không tồn tại mặc định verified để phục vụ cho việc test các tính năng của users sau này
import React, { useState } from "react";
import { testApi } from "../../api/testApi";
import { FiUserPlus, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";

const TestUserCreation = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "123123",
    displayName: "",
    roleID: "3",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await testApi.createTestUser(formData);
      toast.success(`Đã tạo user ${formData.email} thành công!`);
      setFormData((prev) => ({
        ...prev,
        email: ``,
        displayName: "",
      }));
    } catch (error) {
      const msg = error.response?.data?.message || "Tạo thất bại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4 mb-6 border-l-4 border-yellow-400 bg-yellow-50">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Đây là tính năng <strong>thử nghiệm (Dev Tool)</strong>. Các tài
              khoản tạo ra ở đây sẽ:
              <ul className="mt-1 list-disc list-inside">
                <li>Được tự động xác thực Email (Verified).</li>
                <li>Có dữ liệu hồ sơ mẫu cơ bản.</li>
                <li>Có thể đăng nhập ngay lập tức.</li>
              </ul>
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow-md rounded-xl">
        <div className="flex items-center px-6 py-4 border-b bg-gray-50">
          <FiUserPlus className="mr-2 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">
            Tạo Nhanh User Test
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Vai trò
              </label>
              <select
                name="roleID"
                value={formData.roleID}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="4">Ứng viên</option>
                <option value="3">Nhà tuyển dụng</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Tên hiển thị
              </label>
              <input
                type="text"
                name="displayName"
                required
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Nhập tên người dùng"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email người dùng"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="text"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-4 py-3 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-70"
            >
              {loading ? (
                "Đang xử lý..."
              ) : (
                <>
                  <FiCheckCircle className="mr-2" /> Tạo Tài Khoản Ngay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestUserCreation;