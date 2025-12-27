import React, { useState, useEffect, useMemo } from "react";
import { vipApi } from "../../api/vipApi";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiBriefcase,
  FiUser,
  FiClock,
  FiZap,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  FEATURE_KEYS,
  ONE_TIME_FEATURES,
  buildFixedFeatureText,
} from "../../constants/vipFeatures";
import { DEFAULT_LIMITS } from "../../constants/limitConstants";

const PRICE_MIN = 15000;
const PRICE_MAX = 99999999;

const VipPackageModal = ({ pkgToEdit, roleId, onClose, onSuccess }) => {
  const [mode, setMode] = useState("SUBSCRIPTION");
  const [selectedFeatureKey, setSelectedFeatureKey] = useState(null);

  const [formData, setFormData] = useState({
    PlanName: "",
    Price: "",
    DurationInDays: "30",
    Features: "",
    Limit_JobPostDaily: "",
    Limit_PushTopDaily: "",
    Limit_CVStorage: "",
    Limit_ViewApplicantCount: "",
    Limit_RevealCandidatePhone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkgToEdit) {
      const isSub =
        pkgToEdit.PlanType === "SUBSCRIPTION" ||
        (pkgToEdit.DurationInDays && pkgToEdit.DurationInDays > 0);
      setMode(isSub ? "SUBSCRIPTION" : "ONE_TIME");

      setFormData({
        PlanName: pkgToEdit.PlanName,
        Price: formatNumber(pkgToEdit.Price.toString()),
        DurationInDays: pkgToEdit.DurationInDays || "30",
        Features: pkgToEdit.Features || "",
        Limit_JobPostDaily: pkgToEdit.Limit_JobPostDaily || "",
        Limit_PushTopDaily: pkgToEdit.Limit_PushTopDaily || "",
        Limit_CVStorage: pkgToEdit.Limit_CVStorage || "",
        Limit_ViewApplicantCount: pkgToEdit.Limit_ViewApplicantCount || "",
        Limit_RevealCandidatePhone: pkgToEdit.Limit_RevealCandidatePhone || "",
      });

      if (!isSub) {
        let detectedFeature = null;
        if (pkgToEdit.Limit_ViewApplicantCount > 0) {
          detectedFeature = FEATURE_KEYS.CANDIDATE_COMPETITOR_INSIGHT;
        } else if (pkgToEdit.Limit_RevealCandidatePhone > 0) {
          detectedFeature = FEATURE_KEYS.EMPLOYER_REVEAL_PHONE;
        }
        setSelectedFeatureKey(detectedFeature);

        const matched = (ONE_TIME_FEATURES[roleId] || []).find(
          (f) => f.key === detectedFeature
        );

        setFormData((prev) => ({
          ...prev,
          Features:
            pkgToEdit.Features ||
            matched?.suggestedFeatures ||
            matched?.description ||
            "",
          PlanName: pkgToEdit.PlanName || prev.PlanName || "",
        }));
      } else {
        setSelectedFeatureKey(null);
      }
    } else {
      setMode("SUBSCRIPTION");
      setFormData({
        PlanName: "",
        Price: "",
        DurationInDays: "30",
        Features: "",
        Limit_JobPostDaily: "",
        Limit_PushTopDaily: "",
        Limit_CVStorage: "",
        Limit_ViewApplicantCount: "",
        Limit_RevealCandidatePhone: "",
      });
      setSelectedFeatureKey(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgToEdit]);

  useEffect(() => {
    if (mode !== "ONE_TIME") {
      setSelectedFeatureKey(null);
      if (!pkgToEdit) {
        setFormData((prev) => ({ ...prev, Features: "" }));
      }
    } else if (!selectedFeatureKey && !pkgToEdit) {
      setFormData((prev) => ({ ...prev, Features: "" }));
    }
  }, [mode, pkgToEdit, selectedFeatureKey]);

  useEffect(() => {
    if (pkgToEdit) {
      const isSub =
        pkgToEdit.PlanType === "SUBSCRIPTION" ||
        (pkgToEdit.DurationInDays && pkgToEdit.DurationInDays > 0);
      if (!isSub) return;
    }

    if (mode !== "SUBSCRIPTION") return;
    const limitJob = parseInt(formData.Limit_JobPostDaily) || 0;
    const limitPush = parseInt(formData.Limit_PushTopDaily) || 0;
    const limitCv = parseInt(formData.Limit_CVStorage) || 0;

    const nextFeatures = buildFixedFeatureText(roleId, {
      Limit_JobPostDaily: limitJob,
      Limit_PushTopDaily: limitPush,
      Limit_CVStorage: limitCv,
    });
    if (formData.Features !== nextFeatures) {
      setFormData((prev) => ({ ...prev, Features: nextFeatures }));
    }
  }, [
    mode,
    roleId,
    formData.Limit_JobPostDaily,
    formData.Limit_PushTopDaily,
    formData.Limit_CVStorage,
    formData.Features,
    pkgToEdit,
  ]);

  const isEmployer = roleId === 3;
  const availableOneTimeFeatures = ONE_TIME_FEATURES[roleId] || [];
  const isEditing = Boolean(pkgToEdit);
  const isEditingOneTime = isEditing && mode === "ONE_TIME";

  const formatNumber = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    if (isEditingOneTime && e.target.name !== "Price") {
      return;
    }
    let { name, value } = e.target;
    if (name === "Price") value = formatNumber(value);
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectOneTimeFeature = (feature) => {
    if (isEditingOneTime) return;
    setSelectedFeatureKey(feature.key);
    setFormData((prev) => ({
      ...prev,
      PlanName: prev.PlanName || feature.suggestedName,
      Features: feature.suggestedFeatures,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveFeatureKey =
      selectedFeatureKey ||
      (pkgToEdit?.Limit_ViewApplicantCount > 0
        ? FEATURE_KEYS.CANDIDATE_COMPETITOR_INSIGHT
        : pkgToEdit?.Limit_RevealCandidatePhone > 0
        ? FEATURE_KEYS.EMPLOYER_REVEAL_PHONE
        : null);

    if (mode === "ONE_TIME" && !effectiveFeatureKey) {
      toast.error("Vui lòng chọn tính năng mua 1 lần cho gói dịch vụ.");
      return;
    }

    const hasJob = formData.Limit_JobPostDaily !== "";
    const hasPush = formData.Limit_PushTopDaily !== "";
    const hasCv = formData.Limit_CVStorage !== "";

    const limitJob = hasJob ? parseInt(formData.Limit_JobPostDaily) || 0 : 0;
    const limitPush = hasPush ? parseInt(formData.Limit_PushTopDaily) || 0 : 0;
    const limitCv = hasCv ? parseInt(formData.Limit_CVStorage) || 0 : 0;

    if (mode === "SUBSCRIPTION") {
      if (isEmployer && hasJob) {
        const baseJob = DEFAULT_LIMITS.EMPLOYER.JOB_POST_DAILY || 0;
        if (limitJob <= baseJob) {
          toast.error(
            `Giới hạn đăng tin mỗi ngày phải lớn hơn mặc định là ${baseJob}.`
          );
          return;
        }
      }

      if (hasPush) {
        if (limitPush <= 0) {
          toast.error("Giới hạn đẩy top mỗi ngày phải lớn hơn 0.");
          return;
        }
      }

      if (!isEmployer && hasCv) {
        const baseCv = DEFAULT_LIMITS.CANDIDATE.CV_STORAGE || 0;
        if (limitCv <= baseCv) {
          toast.error(`Giới hạn lưu CV phải lớn hơn mặc định là ${baseCv}.`);
          return;
        }
      }
    }

    const numericPrice = parseFloat(formData.Price.replace(/\./g, ""));
    if (Number.isNaN(numericPrice)) {
      toast.error("Giá không hợp lệ.");
      return;
    }
    if (numericPrice < PRICE_MIN || numericPrice > PRICE_MAX) {
      toast.error(
        `Giá phải nằm trong khoảng ${PRICE_MIN.toLocaleString(
          "vi-VN"
        )} - ${PRICE_MAX.toLocaleString("vi-VN")} VNĐ.`
      );
      return;
    }

    setLoading(true);
    try {
      const cleanedFeatures = formData.Features.split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .join("\n");

      const limitView =
        mode === "ONE_TIME"
          ? effectiveFeatureKey === FEATURE_KEYS.CANDIDATE_COMPETITOR_INSIGHT
            ? 1
            : 0
          : parseInt(formData.Limit_ViewApplicantCount) || 0;
      const limitReveal =
        mode === "ONE_TIME"
          ? effectiveFeatureKey === FEATURE_KEYS.EMPLOYER_REVEAL_PHONE
            ? 1
            : 0
          : parseInt(formData.Limit_RevealCandidatePhone) || 0;

      const payload = {
        ...formData,
        RoleID: roleId,
        Price: numericPrice,
        DurationInDays:
          mode === "SUBSCRIPTION" ? parseInt(formData.DurationInDays) : 0,
        PlanType: mode,
        Features:
          mode === "SUBSCRIPTION"
            ? buildFixedFeatureText(roleId, {
                Limit_JobPostDaily: limitJob,
                Limit_PushTopDaily: limitPush,
                Limit_CVStorage: limitCv,
              })
            : cleanedFeatures,
        Limit_JobPostDaily: limitJob,
        Limit_PushTopDaily: limitPush,
        Limit_CVStorage: limitCv,
        Limit_ViewApplicantCount: limitView,
        Limit_RevealCandidatePhone: limitReveal,
      };

      if (pkgToEdit) {
        await vipApi.updateVipPackage(pkgToEdit.PlanID, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await vipApi.createVipPackage(payload);
        toast.success("Thêm mới thành công!");
      }
      onSuccess();
    } catch (error) {
      const msg = error.response?.data?.message || "Có lỗi xảy ra.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            {pkgToEdit ? "Cập nhật Gói/Dịch vụ" : "Thêm Gói/Dịch vụ Mới"}
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="vipForm" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) setMode("SUBSCRIPTION");
                }}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                  mode === "SUBSCRIPTION"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500"
                } ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={isEditing}
              >
                <FiClock className="inline mr-1" /> Gói Định Kỳ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) setMode("ONE_TIME");
                }}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                  mode === "ONE_TIME"
                    ? "bg-white shadow text-purple-600"
                    : "text-gray-500"
                } ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={isEditing}
              >
                <FiZap className="inline mr-1" /> Mua 1 Lần
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên gói / Dịch vụ
                </label>
                <input
                  type="text"
                  name="PlanName"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    isEditingOneTime ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isEditingOneTime}
                  value={formData.PlanName}
                  onChange={handleChange}
                />
              </div>
              <div className={mode === "SUBSCRIPTION" ? "" : "col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá (VNĐ)
                </label>
                <input
                  type="text"
                  name="Price"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.Price}
                  onChange={handleChange}
                />
              </div>
              {mode === "SUBSCRIPTION" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạn (Ngày)
                  </label>
                  <input
                    type="number"
                    name="DurationInDays"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.DurationInDays}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {mode === "ONE_TIME" && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-purple-800">
                    Chọn tính năng mua 1 lần
                  </h4>
                </div>
                {availableOneTimeFeatures.length > 0 ? (
                  <div className="space-y-3">
                    {availableOneTimeFeatures.map((feature) => {
                      const isSelected = selectedFeatureKey === feature.key;
                      return (
                        <button
                          type="button"
                          key={feature.key}
                          onClick={() => handleSelectOneTimeFeature(feature)}
                          className={`w-full text-left rounded-xl border p-4 transition group ${
                            isSelected
                              ? "border-purple-500 bg-white shadow-md"
                              : "border-transparent bg-white/70 hover:border-purple-300"
                          } ${
                            isEditingOneTime
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={isEditingOneTime}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {feature.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {feature.description}
                              </p>
                            </div>
                            {isSelected && (
                              <FiCheck className="text-purple-600 mt-1" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Role này hiện chưa có tính năng mua một lần.
                  </p>
                )}
              </div>
            )}

            {mode === "SUBSCRIPTION" && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">
                  Cấu hình giới hạn
                </h4>

                {isEmployer && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Số bài đăng / ngày
                    </label>
                    <input
                      type="number"
                      name="Limit_JobPostDaily"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-blue-500"
                      value={formData.Limit_JobPostDaily}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {!isEmployer && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lưu trữ tối đa CV
                    </label>
                    <input
                      type="number"
                      name="Limit_CVStorage"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-blue-500"
                      value={formData.Limit_CVStorage}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Số lần Đẩy Top / ngày
                  </label>
                  <input
                    type="number"
                    name="Limit_PushTopDaily"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-blue-500"
                    value={formData.Limit_PushTopDaily}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả hiển thị
              </label>
              <textarea
                name="Features"
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  mode === "SUBSCRIPTION"
                    ? "bg-gray-100 cursor-not-allowed"
                    : isEditingOneTime
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
                disabled={mode === "SUBSCRIPTION" || isEditingOneTime}
                value={formData.Features}
                onChange={handleChange}
              ></textarea>
              {mode !== "SUBSCRIPTION" && !isEditingOneTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Xuống dòng để tạo gạch đầu dòng.
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 font-medium"
          >
            Hủy
          </button>
          <button
            form="vipForm"
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Đang lưu..." : "Lưu lại"}
          </button>
        </div>
      </div>
    </div>
  );
};

const VipManagement = () => {
  const [activeTab, setActiveTab] = useState(3);
  const [packages, setPackages] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const packagesPerPage = 5;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await vipApi.getVipPackages(activeTab);
      setPackages(res.data || []);
      setPage(1);
    } catch (error) {
      if (error.response?.status !== 404) toast.error("Lỗi kết nối server.");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Gói",
      message: "Bạn có chắc chắn?",
      isDanger: true,
      confirmText: "Xóa",
      onClose: () => setConfirmModal({ ...confirmModal, isOpen: false }),
      onConfirm: async () => {
        try {
          await vipApi.deleteVipPackage(id);
          toast.success("Đã xóa.");
          fetchPackages();
        } catch (error) {
          const serverMsg = error.response?.data?.message;
          if (serverMsg) {
            toast.error(serverMsg);
            return;
          }
          toast.error("Không thể xóa vì gói đang được sử dụng.");
        }
      },
    });
  };

  const filteredPackages = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return packages.filter((pkg) => pkg.PlanName?.toLowerCase().includes(term));
  }, [packages, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeTab]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredPackages?.length || 0) / packagesPerPage);
    return Math.max(1, n);
  }, [filteredPackages, packagesPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedPackages = useMemo(() => {
    const start = (page - 1) * packagesPerPage;
    return (filteredPackages || []).slice(start, start + packagesPerPage);
  }, [filteredPackages, page, packagesPerPage]);

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Quản lý Gói & Dịch Vụ
          </h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={() => {
                setEditingPkg(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm whitespace-nowrap"
            >
              <FiPlus className="mr-2" /> Thêm Mới
            </button>
          </div>
        </div>

        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab(3)}
            className={`flex items-center px-6 py-3 font-medium transition-colors ${
              activeTab === 3
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FiBriefcase className="mr-2" /> Công ty
          </button>
          <button
            onClick={() => setActiveTab(4)}
            className={`flex items-center px-6 py-3 font-medium transition-colors ${
              activeTab === 4
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FiUser className="mr-2" /> Ứng Viên
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tên Gói / Dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Thời hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPackages.length > 0 ? (
                  paginatedPackages.map((pkg) => (
                    <tr
                      key={pkg.PlanID}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {pkg.PlanName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pkg.PlanType === "SUBSCRIPTION" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FiClock className="mr-1" /> Định kỳ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <FiZap className="mr-1" /> Một lần
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                        {formatCurrency(pkg.Price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {pkg.DurationInDays
                          ? pkg.DurationInDays + " ngày"
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-line">
                        {pkg.Features}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setEditingPkg(pkg);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 mr-3"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.PlanID)}
                          className="text-red-600"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Chưa có gói dịch vụ nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredPackages.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
              <div className="ml-4 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * packagesPerPage + 1} -{" "}
                  {Math.min(page * packagesPerPage, filteredPackages.length)}
                </span>{" "}
                trong tổng số {filteredPackages.length} kết quả
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
        <VipPackageModal
          pkgToEdit={editingPkg}
          roleId={activeTab}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPackages();
          }}
        />
      )}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />
    </>
  );
};

export default VipManagement;