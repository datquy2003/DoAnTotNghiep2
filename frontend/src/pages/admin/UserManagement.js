import React, { useState, useEffect } from "react";
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
      if (!isOneTime && isExpired) {
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Hết hạn
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Đang dùng
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
    return <span className="text-xs text-gray-400">---</span>;
  };

  if (loading)
    return (
      <div className="py-4 italic text-center text-gray-500">
        Đang tải lịch sử...
      </div>
    );

  if (history.length === 0)
    return (
      <div className="py-6 text-center border border-gray-300 border-dashed rounded-lg bg-gray-50">
        <FiStar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">
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
      <ul className="mt-2 space-y-1 text-xs text-gray-600">
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
      <div className="flex flex-wrap gap-2 mt-2">
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
    <div className="mt-3 overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">
              Gói Dịch Vụ
            </th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">
              Giá
            </th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">
              Quyền lợi snapshot
            </th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">
              Thời Gian
            </th>
            <th className="px-3 py-2 text-xs font-medium text-center text-gray-500 uppercase">
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
                <td className="px-3 py-2 text-sm text-gray-800">
                  <p className="font-medium">Tính năng tại thời điểm mua</p>
                  {renderFeatures(item.Features) || (
                    <span className="text-xs italic text-gray-400">
                      Không có mô tả
                    </span>
                  )}
                  {renderLimitBadges(item)}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {isOneTime ? (
                    <span>Mua: {formatDate(item.StartDate)}</span>
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
        <div className="p-4 text-sm text-gray-600 border border-gray-300 border-dashed rounded-lg bg-gray-50">
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
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-yellow-600 uppercase">
              Gói đang sử dụng
            </p>
            <h5 className="mt-1 text-xl font-bold text-gray-900">
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
              <p className="mt-1 text-xs text-gray-600">
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
                className="px-2 py-1 text-xs font-medium text-yellow-700 border border-yellow-200 rounded-full bg-white/70"
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
          <p className="mt-3 text-sm italic text-gray-500">
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
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 bg-gray-100 border-b">
          <h3 className="flex items-center text-lg font-bold text-gray-800">
            <TypeIcon className="mr-2" /> {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 transition-colors rounded-full hover:text-gray-700 hover:bg-gray-200"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col items-center pb-6 mb-8 border-b border-gray-300 border-dashed md:flex-row md:items-start">
            <img
              src={avatarUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="object-cover w-24 h-24 mb-4 bg-gray-100 border-4 border-white rounded-full shadow-lg md:w-32 md:h-32 md:mb-0 md:mr-6"
            />
            <div className="flex-1 pt-2 text-center md:text-left">
              <h2 className="flex items-center justify-center mb-1 text-2xl font-bold text-gray-900 md:justify-start">
                {isEmployer
                  ? user.CompanyName
                  : user.FullName || user.DisplayName}
                {user.CurrentVIP && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <FiStar className="mr-1" /> {user.CurrentVIP}
                  </span>
                )}
              </h2>
              <p className="mb-3 text-gray-500">{user.Email}</p>

              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
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
                  <span className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                    Đang bị khóa
                  </span>
                )}
                <span className="px-3 py-1 text-xs font-medium text-blue-600 rounded-full bg-blue-50">
                  ID: {user.FirebaseUserID}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="pb-2 mb-3 text-sm font-semibold tracking-wider text-gray-400 uppercase border-b">
                Thông tin liên hệ
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
              <h4 className="pb-2 mb-3 text-sm font-semibold tracking-wider text-gray-400 uppercase border-b">
                {isEmployer ? "Thông tin doanh nghiệp" : "Thông tin cá nhân"}
              </h4>

              {isNoRole ? (
                <p className="text-sm italic text-gray-500">
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
              <div className="col-span-1 mt-2 md:col-span-2">
                <h4 className="pb-2 mb-3 text-sm font-semibold tracking-wider text-gray-400 uppercase border-b">
                  {isEmployer ? "Mô tả công ty" : "Giới thiệu bản thân"}
                </h4>
                <div className="p-4 overflow-y-auto text-sm leading-relaxed text-gray-700 whitespace-pre-line border border-gray-100 rounded-lg bg-gray-50 max-h-60">
                  {isEmployer
                    ? user.CompanyDescription || "Chưa có mô tả"
                    : user.ProfileSummary || "Chưa có giới thiệu"}
                </div>
              </div>
            )}

            {!isNoRole && (
              <div className="col-span-1 mt-2 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center text-sm font-bold tracking-wider text-gray-800 uppercase">
                    <FiStar className="mr-2 text-yellow-500" /> Gói Dịch Vụ &
                    Lịch Sử
                  </h4>
                  {user.CurrentVIP ? (
                    <span className="px-3 py-1 text-xs font-bold text-green-600 bg-green-100 rounded-full">
                      Đang sử dụng: {user.CurrentVIP}
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
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

        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
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
    <span className="flex items-center mb-1 text-xs text-gray-500">
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </span>
    {isLink && value ? (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-blue-600 truncate hover:underline"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.DisplayName?.toLowerCase().includes(term) ||
      item.Email?.toLowerCase().includes(term) ||
      item.FullName?.toLowerCase().includes(term) ||
      item.CompanyName?.toLowerCase().includes(term)
    );
  });

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
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Người dùng
          </h1>
          <div className="relative w-80">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute text-gray-400 left-3 top-3" />
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
                      Thông tin tài khoản
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      {activeTab === "employers"
                        ? "Thông tin Công ty"
                        : activeTab === "candidates"
                        ? "Hồ sơ cá nhân"
                        : "Thông tin bổ sung"}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Đăng nhập gần nhất
                    </th>
                    {activeTab !== "no-role" && (
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                        Loại tài khoản
                      </th>
                    )}
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((user) => (
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
                            <div className="flex-shrink-0 w-10 h-10">
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
                                  <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <FiMapPin className="mr-1" />{" "}
                                    {user.CompanyAddress || "Chưa cập nhật"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm italic text-gray-400">
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
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <FiMapPin className="mr-1" />{" "}
                                  {user.Address || "Chưa cập nhật"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm italic text-gray-400">
                                Chưa cập nhật hồ sơ
                              </span>
                            )
                          ) : (
                            <span className="text-sm italic text-gray-400">
                              Chưa chọn vai trò
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <FiPhone className="mr-2 text-gray-400" />
                            {activeTab === "employers"
                              ? user.CompanyPhone || "---"
                              : activeTab === "candidates"
                              ? user.PhoneNumber || "---"
                              : "---"}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1.5 text-gray-400" />
                            {new Date(user.CreatedAt).toLocaleDateString(
                              "vi-VN",
                              { timeZone: "UTC" }
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiClock className="mr-1.5 text-gray-400" />
                            {user.LastLoginAt ? (
                              new Date(user.LastLoginAt).toLocaleString(
                                "vi-VN",
                                { timeZone: "UTC" }
                              )
                            ) : (
                              <span className="italic text-gray-400">
                                Chưa đăng nhập lần nào
                              </span>
                            )}
                          </div>
                        </td>

                        {activeTab !== "no-role" && (
                          <td className="px-6 py-4 text-center whitespace-nowrap">
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

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <StatusBadge isVerified={user.IsVerified} />
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-3">
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