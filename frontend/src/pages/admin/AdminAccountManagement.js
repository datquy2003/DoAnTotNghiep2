import React, { useState, useEffect, useMemo } from "react";
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
  FiChevronLeft,
  FiChevronRight,
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên hiển thị
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="text"
                name="displayName"
                required
                value={formData.displayName}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên hiển thị"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiKey className="text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="******"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự.</p>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
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
  const [page, setPage] = useState(1);
  const adminsPerPage = 10;
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
      setPage(1);
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
      const updated = admins.filter((a) => a.FirebaseUserID !== uid);
      setAdmins(updated);
      const newTotalPages = Math.ceil(updated.length / adminsPerPage);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
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

  const filteredAdmins = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return admins.filter(
      (admin) =>
        admin.DisplayName?.toLowerCase().includes(term) ||
        admin.Email?.toLowerCase().includes(term)
    );
  }, [admins, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredAdmins?.length || 0) / adminsPerPage);
    return Math.max(1, n);
  }, [filteredAdmins, adminsPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedAdmins = useMemo(() => {
    const start = (page - 1) * adminsPerPage;
    return (filteredAdmins || []).slice(start, start + adminsPerPage);
  }, [filteredAdmins, page, adminsPerPage]);

  const pageItems = useMemo(() => {
    const tp = totalPages;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const items = new Set([1, tp, page - 1, page, page + 1]);
    const arr = Array.from(items)
      .filter((x) => x >= 1 && x <= tp)
      .sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      out.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("…");
    }
    return out;
  }, [page, totalPages]);

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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              Quản lý Admin hệ thống
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
            >
              <FiUserPlus className="mr-2" /> Thêm Admin
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đăng nhập gần nhất
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAdmins.length > 0 ? (
                    paginatedAdmins.map((admin) => (
                      <tr
                        key={admin.FirebaseUserID}
                        className={`transition-colors ${
                          admin.IsBanned ? "bg-gray-100" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {admin.Email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge isVerified={admin.IsVerified} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1.5 text-gray-400" />
                            {new Date(admin.CreatedAt).toLocaleDateString(
                              "vi-VN",
                              { timeZone: "UTC" }
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiClock className="mr-1.5 text-gray-400" />
                            {admin.LastLoginAt ? (
                              new Date(admin.LastLoginAt).toLocaleString(
                                "vi-VN",
                                { timeZone: "UTC" }
                              )
                            ) : (
                              <span className="text-gray-400 italic">
                                Chưa đăng nhập
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        className="px-6 py-8 text-center text-gray-500 italic"
                      >
                        Chưa có tài khoản Admin nào (ngoài bạn).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {filteredAdmins.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
              <div className="ml-4 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * adminsPerPage + 1} -{" "}
                  {Math.min(page * adminsPerPage, filteredAdmins.length)}
                </span>{" "}
                kết quả
              </div>
              {totalPages > 1 && (
                <div className="mr-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {pageItems.map((it, idx) =>
                      it === "…" ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 text-gray-500"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={`p-${it}`}
                          type="button"
                          onClick={() => setPage(Number(it))}
                          className={`min-w-9 px-3 py-2 rounded-lg border text-sm ${
                            Number(it) === page
                              ? "border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {it}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
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