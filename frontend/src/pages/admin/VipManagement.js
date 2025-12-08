import React, { useState, useEffect } from "react";
import { vipApi } from "../../api/vipApi";
import {
  FiPackage,
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
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  FEATURE_KEYS,
  ONE_TIME_FEATURES,
  buildFixedFeatureText,
} from "../../constants/vipFeatures";

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
        if (pkgToEdit.Limit_ViewApplicantCount > 0) {
          setSelectedFeatureKey(FEATURE_KEYS.CANDIDATE_COMPETITOR_INSIGHT);
        } else if (pkgToEdit.Limit_RevealCandidatePhone > 0) {
          setSelectedFeatureKey(FEATURE_KEYS.EMPLOYER_REVEAL_PHONE);
        } else {
          setSelectedFeatureKey(null);
        }
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

      const limitJob = parseInt(formData.Limit_JobPostDaily) || 0;
      const limitPush = parseInt(formData.Limit_PushTopDaily) || 0;
      const limitCv = parseInt(formData.Limit_CVStorage) || 0;

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
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 border-b bg-gray-50">
          <h3 className="flex items-center text-lg font-bold text-gray-800">
            {pkgToEdit ? "Cập nhật Gói/Dịch vụ" : "Thêm Gói/Dịch vụ Mới"}
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
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
                <label className="block mb-1 text-sm font-medium text-gray-700">
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
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Giá (VNĐ)
                </label>
                <input
                  type="text"
                  name="Price"
                  required
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Price}
                  onChange={handleChange}
                />
              </div>
              {mode === "SUBSCRIPTION" && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Hạn (Ngày)
                  </label>
                  <input
                    type="number"
                    name="DurationInDays"
                    required
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.DurationInDays}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {mode === "ONE_TIME" && (
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
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
                              <p className="mt-1 text-xs text-gray-600">
                                {feature.description}
                              </p>
                            </div>
                            {isSelected && (
                              <FiCheck className="mt-1 text-purple-600" />
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
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="pb-2 mb-3 text-sm font-bold text-gray-800 border-b">
                  Cấu hình giới hạn
                </h4>

                {isEmployer && (
                  <div className="mb-3">
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Số bài đăng / ngày
                    </label>
                    <input
                      type="number"
                      name="Limit_JobPostDaily"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-blue-500"
                      value={formData.Limit_JobPostDaily}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {!isEmployer && (
                  <div className="mb-3">
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Lưu trữ tối đa CV
                    </label>
                    <input
                      type="number"
                      name="Limit_CVStorage"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-blue-500"
                      value={formData.Limit_CVStorage}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    Số lần Đẩy Top / ngày
                  </label>
                  <input
                    type="number"
                    name="Limit_PushTopDaily"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-blue-500"
                    value={formData.Limit_PushTopDaily}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
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
              {mode !== "SUBSCRIPTION" && (
                <p className="mt-1 text-xs text-gray-500">
                  Xuống dòng để tạo gạch đầu dòng.
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end flex-shrink-0 gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            form="vipForm"
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await vipApi.getVipPackages(activeTab);
      setPackages(res.data || []);
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

  const filteredPackages = packages.filter((pkg) =>
    pkg.PlanName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <h1 className="flex items-center text-2xl font-bold text-gray-800">
            <FiPackage className="mr-2 text-blue-600" /> Quản lý Gói & Dịch Vụ
          </h1>
          <div className="flex items-center w-full gap-4 md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute text-gray-400 left-3 top-3" />
            </div>
            <button
              onClick={() => {
                setEditingPkg(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg shadow-sm whitespace-nowrap"
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

        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Tên Gói / Dịch vụ
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-center text-gray-500 uppercase">
                    Thời hạn
                  </th>
                  <th className="w-1/3 px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-right text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.length > 0 ? (
                  filteredPackages.map((pkg) => (
                    <tr
                      key={pkg.PlanID}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {pkg.PlanName}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
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
                      <td className="px-6 py-4 font-medium text-green-600 whitespace-nowrap">
                        {formatCurrency(pkg.Price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 whitespace-nowrap">
                        {pkg.DurationInDays
                          ? pkg.DurationInDays + " ngày"
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-line">
                        {pkg.Features}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingPkg(pkg);
                            setIsModalOpen(true);
                          }}
                          className="mr-3 text-blue-600"
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