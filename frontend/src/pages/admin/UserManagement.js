import React, { useState, useEffect, useMemo } from "react";
import { adminApi } from "../../api/adminApi";
import { getImageUrl } from "../../utils/urlHelper";
import {
  FiSearch,
  FiBriefcase,
  FiUser,
  FiPhone,
  FiMapPin,
  FiLock,
  FiUnlock,
  FiTrash2,
  FiInfo,
  FiX,
  FiCalendar,
  FiMail,
  FiHelpCircle,
  FiClock,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const VipHistory = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await adminApi.getUserSubscriptions(userId);
        setHistory(res.data);
      } catch (error) {
        console.error("Lỗi tải lịch sử VIP");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  const getVietnamTime = () => {
    const now = new Date();
    return new Date(now.getTime() + 7 * 60 * 60 * 1000);
  };

  const getStatusBadge = (item) => {
    const isOneTime = !item.DurationInDays || item.DurationInDays === 0;
    const endDate = new Date(item.EndDate);
    const nowVN = getVietnamTime();
    const isExpired = endDate.getTime() < nowVN.getTime();

    if (item.Status === 1) {
      if (isOneTime) {
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
            Đã mua
          </span>
        );
      }
      if (!isOneTime && isExpired) {
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Hết hạn
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Sử dụng
        </span>
      );
    } else if (item.Status === 2) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          Hết hạn
        </span>
      );
    } else if (item.Status === 0) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Chờ TT
        </span>
      );
    }
    return <span className="text-gray-400 text-xs">---</span>;
  };

  if (loading)
    return (
      <div className="text-center py-4 text-gray-500 italic">
        Đang tải lịch sử...
      </div>
    );

  if (history.length === 0)
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <FiStar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p className="text-gray-500 text-sm">
          Chưa có lịch sử đăng ký dịch vụ nào.
        </p>
      </div>
    );

  const renderFeatures = (features) => {
    if (!features) return null;

    const items = features
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!items.length) return null;

    return (
      <ul className="space-y-1 text-xs text-gray-600 mt-2">
        {items.map((feature, idx) => (
          <li key={`${feature}-${idx}`} className="flex items-start">
            <span className="mr-2">•</span>
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderLimitBadges = (item) => {
    const badges = [];

    if (item.Limit_JobPostDaily && item.Limit_JobPostDaily > 0) {
      badges.push(`Đăng bài/ngày: ${item.Limit_JobPostDaily}`);
    }
    if (item.Limit_PushTopDaily && item.Limit_PushTopDaily > 0) {
      badges.push(`Đẩy top/ngày: ${item.Limit_PushTopDaily}`);
    }
    if (item.Limit_CVStorage && item.Limit_CVStorage > 0) {
      badges.push(`Kho CV: ${item.Limit_CVStorage}`);
    }

    if (!badges.length) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {badges.map((text) => (
          <span
            key={text}
            className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium"
          >
            {text}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto border rounded-lg border-gray-200 mt-3">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Gói Dịch Vụ
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Giá
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Quyền lợi
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Thời Gian
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Trạng Thái
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {history.map((item) => {
            const isOneTime = !item.DurationInDays || item.DurationInDays === 0;
            return (
              <tr
                key={item.SubscriptionID}
                className="text-sm hover:bg-gray-50"
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">
                    {item.PlanName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isOneTime ? "Dịch vụ 1 lần" : "Gói định kỳ"}
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-900">
                  {formatCurrency(item.Price)}
                </td>
                <td className="px-3 py-2 text-gray-800 text-sm">
                  <p className="font-medium">Tính năng tại thời điểm mua</p>
                  {renderFeatures(item.Features) || (
                    <span className="text-xs text-gray-400 italic">
                      Không có mô tả
                    </span>
                  )}
                  {renderLimitBadges(item)}
                </td>
                <td className="px-3 py-2 text-gray-500 text-xs">
                  {isOneTime ? (
                    <span>{formatDate(item.StartDate)}</span>
                  ) : (
                    <span>
                      {formatDate(item.StartDate)} - {formatDate(item.EndDate)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {getStatusBadge(item)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const UserDetailModal = ({ user, type, onClose }) => {
  if (!user) return null;

  const isEmployer = type === "employers";
  const isNoRole = type === "no-role";
  const snapshotPlanName = user.CurrentVIPPlanName || user.CurrentVIP;
  const currentVipSnapshot = snapshotPlanName
    ? {
        PlanName: snapshotPlanName,
        Features: user.CurrentVIPFeatures,
        Price: user.CurrentVIPPrice,
        PlanType: user.CurrentVIPPlanType,
        Limit_JobPostDaily: user.CurrentVIPLimitJobPostDaily,
        Limit_PushTopDaily: user.CurrentVIPLimitPushTopDaily,
        Limit_CVStorage: user.CurrentVIPLimitCVStorage,
        StartDate: user.CurrentVIPStartDate,
        EndDate: user.CurrentVIPEndDate,
      }
    : null;

  const formatVipDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("vi-VN", { timeZone: "UTC" })
      : null;

  const renderCurrentVipCard = () => {
    if (!currentVipSnapshot) {
      return (
        <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          Người dùng chưa đăng ký gói VIP. Đang sử dụng tài khoản thường.
        </div>
      );
    }

    const featureLines = currentVipSnapshot.Features
      ? currentVipSnapshot.Features.split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : [];

    const limitBadges = [];
    if (currentVipSnapshot.Limit_JobPostDaily > 0) {
      limitBadges.push(
        `Đăng bài/ngày: ${currentVipSnapshot.Limit_JobPostDaily}`
      );
    }
    if (currentVipSnapshot.Limit_PushTopDaily > 0) {
      limitBadges.push(
        `Đẩy top/ngày: ${currentVipSnapshot.Limit_PushTopDaily}`
      );
    }
    if (currentVipSnapshot.Limit_CVStorage > 0) {
      limitBadges.push(`Kho CV: ${currentVipSnapshot.Limit_CVStorage}`);
    }

    const startDate = formatVipDate(currentVipSnapshot.StartDate);
    const endDate = formatVipDate(currentVipSnapshot.EndDate);
    const isSubscription = currentVipSnapshot.PlanType === "SUBSCRIPTION";

    return (
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-yellow-600 font-semibold tracking-widest">
              Gói đang sử dụng
            </p>
            <h5 className="text-xl font-bold text-gray-900 mt-1">
              {currentVipSnapshot.PlanName}
            </h5>
            <p className="text-sm text-gray-600">
              {isSubscription ? "Gói định kỳ" : "Dịch vụ 1 lần"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Giá trị</p>
            <p className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(currentVipSnapshot.Price || 0)}
            </p>
            {startDate && (
              <p className="text-xs text-gray-600 mt-1">
                {isSubscription && endDate
                  ? `${startDate} - ${endDate}`
                  : `Kích hoạt: ${startDate}`}
              </p>
            )}
          </div>
        </div>
        {limitBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {limitBadges.map((text) => (
              <span
                key={text}
                className="px-2 py-1 bg-white/70 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium"
              >
                {text}
              </span>
            ))}
          </div>
        )}
        {featureLines.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-gray-700 list-disc list-inside">
            {featureLines.map((line, idx) => (
              <li key={`${line}-${idx}`}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-500 italic">
            Gói này không có mô tả tính năng.
          </p>
        )}
      </div>
    );
  };
  const avatarUrl = getImageUrl(isEmployer ? user.LogoURL : user.PhotoURL);

  let title = "Hồ sơ Ứng viên";
  let TypeIcon = FiUser;
  if (isEmployer) {
    title = "Chi tiết Công ty";
    TypeIcon = FiBriefcase;
  } else if (isNoRole) {
    title = "Tài khoản chưa phân loại";
    TypeIcon = FiHelpCircle;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <TypeIcon className="mr-2" /> {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-200 rounded-full"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col md:flex-row items-center md:items-start mb-8 pb-6 border-b border-dashed border-gray-300">
            <img
              src={avatarUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4 md:mb-0 md:mr-6 bg-gray-100"
            />
            <div className="text-center md:text-left flex-1 pt-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center justify-center md:justify-start">
                {isEmployer
                  ? user.CompanyName
                  : user.FullName || user.DisplayName}
                {user.CurrentVIP && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <FiStar className="mr-1" /> {user.CurrentVIP}
                  </span>
                )}
              </h2>
              <p className="text-gray-500 mb-3">{user.Email}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.IsVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.IsVerified ? "Đã xác thực" : "Chưa xác thực"}
                </span>
                {user.IsBanned && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Đang bị khóa
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                  ID: {user.FirebaseUserID}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                Thông tin
              </h4>

              <InfoItem
                icon={<FiMail />}
                label="Email đăng nhập"
                value={user.Email}
              />

              {!isNoRole && (
                <>
                  <InfoItem
                    icon={<FiPhone />}
                    label="Số điện thoại"
                    value={isEmployer ? user.CompanyPhone : user.PhoneNumber}
                  />
                  <InfoItem
                    icon={<FiMapPin />}
                    label="Địa chỉ"
                    value={isEmployer ? user.CompanyAddress : user.Address}
                  />
                </>
              )}

              <InfoItem
                icon={<FiCalendar />}
                label="Ngày tham gia"
                value={new Date(user.CreatedAt).toLocaleDateString("vi-VN", {
                  timeZone: "UTC",
                })}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                {isEmployer ? "Thông tin doanh nghiệp" : "Thông tin cá nhân"}
              </h4>

              {isNoRole ? (
                <p className="text-sm text-gray-500 italic">
                  Tài khoản này chưa hoàn tất việc chọn vai trò (Ứng viên/Nhà
                  tuyển dụng). Chưa có thông tin hồ sơ chi tiết.
                </p>
              ) : isEmployer ? (
                <>
                  <InfoItem
                    label="Tên người đại diện"
                    value={user.DisplayName}
                  />
                  <InfoItem label="Website" value={user.WebsiteURL} isLink />
                  <InfoItem label="Email công ty" value={user.CompanyEmail} />
                  <InfoItem label="Thành phố" value={user.City} />
                  <InfoItem label="Quốc gia" value={user.Country} />
                </>
              ) : (
                <>
                  <InfoItem label="Tên hiển thị" value={user.DisplayName} />
                  <InfoItem
                    label="Ngày sinh"
                    value={
                      user.Birthday
                        ? new Date(user.Birthday).toLocaleDateString("vi-VN", {
                            timeZone: "UTC",
                          })
                        : null
                    }
                  />
                  <InfoItem label="Thành phố" value={user.City} />
                  <InfoItem label="Quốc gia" value={user.Country} />
                </>
              )}
            </div>

            {!isNoRole && (
              <div className="col-span-1 md:col-span-2 mt-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                  {isEmployer ? "Mô tả công ty" : "Giới thiệu bản thân"}
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto border border-gray-100">
                  {isEmployer
                    ? user.CompanyDescription || "Chưa có mô tả"
                    : user.ProfileSummary || "Chưa có giới thiệu"}
                </div>
              </div>
            )}

            {!isNoRole && (
              <div className="col-span-1 md:col-span-2 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
                    <FiStar className="mr-2 text-yellow-500" /> Gói Dịch Vụ &
                    Lịch Sử
                  </h4>
                  {user.CurrentVIP ? (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      Đang sử dụng: {user.CurrentVIP}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Tài khoản thường
                    </span>
                  )}
                </div>
                {renderCurrentVipCard()}
                <VipHistory userId={user.FirebaseUserID} />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value, isLink }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 mb-1 flex items-center">
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </span>
    {isLink && value ? (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-blue-600 hover:underline truncate"
      >
        {value}
      </a>
    ) : (
      <span className="text-sm font-medium text-gray-900 break-words">
        {value || "---"}
      </span>
    )}
  </div>
);

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("employers");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const usersPerPage = 10;
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false,
    confirmText: "Xác nhận",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === "candidates") {
        response = await adminApi.getCandidates();
      } else if (activeTab === "no-role") {
        response = await adminApi.getUsersNoRole();
      } else {
        response = await adminApi.getEmployers();
      }
      setData(response.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedUser(null);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const confirmDelete = (uid) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa tài khoản",
      message:
        "Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này không? Hành động này không thể hoàn tác.",
      isDanger: true,
      confirmText: "Xóa vĩnh viễn",
      onConfirm: () => performDelete(uid),
    });
  };

  const performDelete = async (uid) => {
    const userToDelete = data.find((user) => user.FirebaseUserID === uid);
    try {
      await adminApi.deleteUser(uid);
      toast.success("Đã xóa tài khoản thành công.");
      setData(data.filter((user) => user.FirebaseUserID !== uid));
      if (selectedUser?.FirebaseUserID === uid) setSelectedUser(null);
    } catch (error) {
      if (userToDelete?.CurrentVIP) {
        toast.error("Không thể xóa tài khoản VIP.");
        return;
      }
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
        return;
      }
      toast.error("Xóa thất bại.");
    }
  };

  const confirmToggleBan = (uid, currentStatus) => {
    const newStatus = !currentStatus;
    const actionName = newStatus ? "Khóa tài khoản" : "Mở khóa tài khoản";

    setConfirmModal({
      isOpen: true,
      title: actionName,
      message: newStatus
        ? "Người dùng sẽ bị đăng xuất ngay lập tức và không thể truy cập hệ thống. Bạn có chắc chắn không?"
        : "Tài khoản này sẽ được kích hoạt trở lại. Bạn có chắc chắn không?",
      isDanger: newStatus,
      confirmText: newStatus ? "Khóa ngay" : "Mở khóa",
      onConfirm: () => performToggleBan(uid, newStatus),
    });
  };

  const performToggleBan = async (uid, newStatus) => {
    try {
      await adminApi.toggleBanUser(uid, newStatus);
      toast.success(`Thao tác thành công.`);

      const newData = data.map((user) =>
        user.FirebaseUserID === uid ? { ...user, IsBanned: newStatus } : user
      );
      setData(newData);

      if (selectedUser?.FirebaseUserID === uid) {
        setSelectedUser({ ...selectedUser, IsBanned: newStatus });
      }
    } catch (error) {
      toast.error("Thao tác thất bại.");
    }
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      return (
        item.DisplayName?.toLowerCase().includes(term) ||
        item.Email?.toLowerCase().includes(term) ||
        item.FullName?.toLowerCase().includes(term) ||
        item.CompanyName?.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredData?.length || 0) / usersPerPage);
    return Math.max(1, n);
  }, [filteredData, usersPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * usersPerPage;
    return (filteredData || []).slice(start, start + usersPerPage);
  }, [filteredData, page, usersPerPage]);

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
      <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Người dùng
          </h1>
          <div className="relative w-80">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab("employers")}
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${
              activeTab === "employers"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiBriefcase className="mr-2" /> Công ty
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${
              activeTab === "candidates"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiUser className="mr-2" /> Ứng Viên
          </button>
          <button
            onClick={() => setActiveTab("no-role")}
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${
              activeTab === "no-role"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiHelpCircle className="mr-2" /> Chưa phân loại
          </button>
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
                      Thông tin tài khoản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === "employers"
                        ? "Thông tin Công ty"
                        : activeTab === "candidates"
                        ? "Hồ sơ cá nhân"
                        : "Thông tin bổ sung"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đăng nhập gần nhất
                    </th>
                    {activeTab !== "no-role" && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại tài khoản
                      </th>
                    )}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((user) => (
                      <tr
                        key={user.FirebaseUserID}
                        className={`transition-colors ${
                          user.IsBanned
                            ? "bg-gray-200 text-gray-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className={`h-10 w-10 rounded-full object-cover border ${
                                  user.IsBanned ? "opacity-50 grayscale" : ""
                                }`}
                                src={
                                  getImageUrl(user.PhotoURL) ||
                                  "https://via.placeholder.com/40"
                                }
                                alt=""
                              />
                            </div>
                            <div className="ml-4">
                              <div
                                className={`text-sm font-medium ${
                                  user.IsBanned
                                    ? "text-gray-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {user.DisplayName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.Email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {activeTab === "employers" ? (
                            user.CompanyName ? (
                              <div className="flex items-start space-x-3">
                                <img
                                  src={
                                    getImageUrl(user.LogoURL) ||
                                    "https://via.placeholder.com/40"
                                  }
                                  alt="Logo"
                                  className={`w-10 h-10 object-contain border rounded bg-white ${
                                    user.IsBanned ? "opacity-50 grayscale" : ""
                                  }`}
                                />
                                <div>
                                  <div
                                    className={`text-sm font-medium ${
                                      user.IsBanned
                                        ? "text-gray-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {user.CompanyName}
                                  </div>
                                  <a
                                    href={user.WebsiteURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`text-xs hover:underline block ${
                                      user.IsBanned
                                        ? "text-gray-500 pointer-events-none"
                                        : "text-blue-500"
                                    }`}
                                  >
                                    {user.WebsiteURL}
                                  </a>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                                    <FiMapPin className="mr-1" />{" "}
                                    {user.CompanyAddress || "Chưa cập nhật"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Chưa cập nhật hồ sơ
                              </span>
                            )
                          ) : activeTab === "candidates" ? (
                            user.FullName ? (
                              <div>
                                <div
                                  className={`text-sm font-medium ${
                                    user.IsBanned
                                      ? "text-gray-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {user.FullName}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center">
                                  <FiMapPin className="mr-1" />{" "}
                                  {user.Address || "Chưa cập nhật"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Chưa cập nhật hồ sơ
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Chưa chọn vai trò
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm flex items-center">
                            <FiPhone className="mr-2 text-gray-400" />
                            {activeTab === "employers"
                              ? user.CompanyPhone || "---"
                              : activeTab === "candidates"
                              ? user.PhoneNumber || "---"
                              : "---"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1.5 text-gray-400" />
                            {new Date(user.CreatedAt).toLocaleDateString(
                              "vi-VN",
                              { timeZone: "UTC" }
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiClock className="mr-1.5 text-gray-400" />
                            {user.LastLoginAt ? (
                              new Date(user.LastLoginAt).toLocaleString(
                                "vi-VN",
                                { timeZone: "UTC" }
                              )
                            ) : (
                              <span className="text-gray-400 italic">
                                Chưa đăng nhập lần nào
                              </span>
                            )}
                          </div>
                        </td>

                        {activeTab !== "no-role" && (
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {user.CurrentVIP ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 mb-1">
                                  <FiStar className="mr-1" /> VIP
                                </span>
                                <span
                                  className="text-xs text-gray-500 truncate max-w-[120px]"
                                  title={user.CurrentVIP}
                                >
                                  {user.CurrentVIP}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                Thường
                              </span>
                            )}
                          </td>
                        )}

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <StatusBadge isVerified={user.IsVerified} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3 items-center">
                            <button
                              onClick={() => handleViewDetail(user)}
                              className={`mr-1 ${
                                user.IsBanned
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-blue-600 hover:text-blue-900"
                              }`}
                              title="Xem chi tiết"
                              disabled={user.IsBanned}
                            >
                              <FiInfo size={20} />
                            </button>

                            <button
                              onClick={() =>
                                confirmToggleBan(
                                  user.FirebaseUserID,
                                  user.IsBanned
                                )
                              }
                              className={`${
                                user.IsBanned
                                  ? "text-gray-600 hover:text-gray-800"
                                  : "text-yellow-600 hover:text-yellow-900"
                              }`}
                              title={
                                user.IsBanned ? "Mở khóa" : "Khóa tài khoản"
                              }
                            >
                              {user.IsBanned ? (
                                <FiUnlock size={18} />
                              ) : (
                                <FiLock size={18} />
                              )}
                            </button>

                            <button
                              onClick={() => confirmDelete(user.FirebaseUserID)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa tài khoản"
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
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {filteredData.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
              <div className="ml-4 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * usersPerPage + 1} -{" "}
                  {Math.min(page * usersPerPage, filteredData.length)}
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

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          type={activeTab}
          onClose={() => setSelectedUser(null)}
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

export default UserManagement;