import React, { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { getImageUrl } from "../../utils/urlHelper";
import {
  FiUserPlus,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiX,
  FiMail,
  FiUser,
  FiKey,
  FiCalendar,
  FiSearch,
  FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const CreateAdminModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang tạo tài khoản...");

    try {
      await adminApi.createSystemAdmin(formData);
      toast.success("Tạo Admin thành công!", { id: toastId });
      onSuccess();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Tạo thất bại.";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-xl animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h3 className="flex items-center text-lg font-bold text-gray-800">
            <FiUserPlus className="mr-2" /> Thêm quản trị viên mới
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Tên hiển thị
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="text"
                name="displayName"
                required
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên hiển thị"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập email"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiKey className="text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="******"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Tối thiểu 6 ký tự.</p>
          </div>

          <div className="flex justify-end pt-2 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminAccountManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false,
    confirmText: "Xác nhận",
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSystemAdmins();
      setAdmins(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách admin:", error);
      toast.error("Không thể tải danh sách Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const confirmDelete = (uid) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa tài khoản Admin",
      message:
        "Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản Admin này không? Hành động này không thể hoàn tác.",
      isDanger: true,
      confirmText: "Xóa vĩnh viễn",
      onConfirm: () => performDelete(uid),
    });
  };

  const performDelete = async (uid) => {
    try {
      await adminApi.deleteUser(uid);
      toast.success("Đã xóa Admin thành công.");
      setAdmins(admins.filter((a) => a.FirebaseUserID !== uid));
    } catch (error) {
      toast.error("Xóa thất bại.");
    }
  };

  const confirmToggleBan = (uid, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "Khóa tài khoản" : "Mở khóa tài khoản";

    setConfirmModal({
      isOpen: true,
      title: action,
      message: newStatus
        ? "Admin này sẽ bị đăng xuất ngay lập tức. Bạn có chắc không?"
        : "Tài khoản Admin này sẽ được kích hoạt lại. Bạn có chắc không?",
      isDanger: newStatus,
      confirmText: newStatus ? "Khóa ngay" : "Mở khóa",
      onConfirm: () => performToggleBan(uid, newStatus),
    });
  };

  const performToggleBan = async (uid, newStatus) => {
    try {
      await adminApi.toggleBanUser(uid, newStatus);
      toast.success(`Đã ${newStatus ? "khóa" : "mở khóa"} thành công.`);
      setAdmins(
        admins.map((a) =>
          a.FirebaseUserID === uid ? { ...a, IsBanned: newStatus } : a
        )
      );
    } catch (error) {
      toast.error("Thao tác thất bại.");
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.DisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.Email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ isVerified }) => {
    if (isVerified)
      return (
        <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
          Đã xác thực
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">
        Chưa xác thực
      </span>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="flex items-center text-2xl font-bold text-gray-800">
              Quản lý Admin hệ thống
            </h1>
          </div>

          <div className="flex items-center w-full gap-3 md:w-auto">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute text-gray-400 left-3 top-3" />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 whitespace-nowrap"
            >
              <FiUserPlus className="mr-2" /> Thêm Admin
            </button>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Đăng nhập gần nhất
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => (
                      <tr
                        key={admin.FirebaseUserID}
                        className={`transition-colors ${
                          admin.IsBanned ? "bg-gray-100" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <img
                                className={`h-10 w-10 rounded-full object-cover border ${
                                  admin.IsBanned ? "grayscale opacity-50" : ""
                                }`}
                                src={
                                  getImageUrl(admin.PhotoURL) ||
                                  "https://via.placeholder.com/40"
                                }
                                alt=""
                              />
                            </div>
                            <div className="ml-4">
                              <div
                                className={`text-sm font-medium ${
                                  admin.IsBanned
                                    ? "text-gray-500"
                                    : "text-gray-900"
                                }`}
                              >
                                {admin.DisplayName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {admin.Email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <StatusBadge isVerified={admin.IsVerified} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1.5 text-gray-400" />
                            {new Date(admin.CreatedAt).toLocaleDateString(
                              "vi-VN",
                              { timeZone: "UTC" }
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiClock className="mr-1.5 text-gray-400" />
                            {admin.LastLoginAt ? (
                              new Date(admin.LastLoginAt).toLocaleString(
                                "vi-VN",
                                { timeZone: "UTC" }
                              )
                            ) : (
                              <span className="italic text-gray-400">
                                Chưa đăng nhập
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() =>
                                confirmToggleBan(
                                  admin.FirebaseUserID,
                                  admin.IsBanned
                                )
                              }
                              className={`${
                                admin.IsBanned
                                  ? "text-green-600 hover:text-green-900"
                                  : "text-yellow-600 hover:text-yellow-900"
                              }`}
                              title={
                                admin.IsBanned ? "Mở khóa" : "Khóa tài khoản"
                              }
                            >
                              {admin.IsBanned ? (
                                <FiUnlock size={18} />
                              ) : (
                                <FiLock size={18} />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                confirmDelete(admin.FirebaseUserID)
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Xóa vĩnh viễn"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 italic text-center text-gray-500"
                      >
                        Chưa có tài khoản Admin nào (ngoài bạn).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateAdminModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAdmins();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />
    </>
  );
};

export default AdminAccountManagement;