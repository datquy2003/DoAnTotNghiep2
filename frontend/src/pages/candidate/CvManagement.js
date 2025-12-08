import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiUpload,
  FiStar,
  FiCheckCircle,
  FiTrash2,
  FiExternalLink,
  FiAlertTriangle,
} from "react-icons/fi";
import { cvApi } from "../../api/cvApi";
import { profileApi } from "../../api/profileApi";
import { useAuth } from "../../context/AuthContext";
import { DEFAULT_LIMITS } from "../../constants/limitConstants";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/formatDate";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const CvManagement = () => {
  const { appUser } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [quota, setQuota] = useState({
    limit: DEFAULT_LIMITS.CANDIDATE.CV_STORAGE,
    used: 0,
    remaining: DEFAULT_LIMITS.CANDIDATE.CV_STORAGE,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cvName, setCvName] = useState("");
  const [file, setFile] = useState(null);
  const [makeDefault, setMakeDefault] = useState(false);
  const fileInputRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pushTopInfo, setPushTopInfo] = useState({
    remaining: null,
    limit: null,
    scope: null,
    usedToday: null,
    usedThisWeek: null,
    loading: true,
  });
  const [profilePreview, setProfilePreview] = useState({
    loading: true,
    data: null,
  });

  const effectiveLimit = useMemo(() => {
    if (quota?.limit) return quota.limit;
    if (appUser?.CurrentVIPLimitCVStorage)
      return appUser.CurrentVIPLimitCVStorage;
    return DEFAULT_LIMITS.CANDIDATE.CV_STORAGE;
  }, [quota?.limit, appUser?.CurrentVIPLimitCVStorage]);

  const applyResponse = (data) => {
    setCvs(data?.cvs || []);
    if (data?.quota) {
      setQuota(data.quota);
    }
  };

  const sortedCvs = useMemo(() => {
    const toTime = (val) => {
      const t = new Date(val).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return [...(cvs || [])].sort((a, b) => {
      if (a?.IsDefault && !b?.IsDefault) return -1;
      if (!a?.IsDefault && b?.IsDefault) return 1;
      return toTime(a?.CreatedAt) - toTime(b?.CreatedAt);
    });
  }, [cvs]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await cvApi.listMyCvs();
      applyResponse(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách CV:", err);
      toast.error(err.response?.data?.message || "Không thể tải danh sách CV.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPushTopRemaining();
    loadProfilePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPushTopRemaining = async () => {
    try {
      const res = await profileApi.getPushTopRemaining();
      const data = res.data || {};
      setPushTopInfo({
        remaining: data.remaining ?? null,
        limit: data.limit ?? null,
        scope: data.scope ?? null,
        usedToday: data.usedToday ?? null,
        usedThisWeek: data.usedThisWeek ?? null,
        loading: false,
      });
    } catch (err) {
      console.error("Lỗi lấy lượt đẩy top:", err);
      toast.error(
        err.response?.data?.message || "Không thể lấy lượt đẩy top còn lại."
      );
      setPushTopInfo((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadProfilePreview = async () => {
    try {
      const res = await profileApi.getCandidateProfile();
      setProfilePreview({ loading: false, data: res.data || null });
    } catch (err) {
      console.error("Lỗi lấy hồ sơ ứng viên:", err);
      toast.error(
        err.response?.data?.message || "Không thể lấy thông tin hồ sơ."
      );
      setProfilePreview({ loading: false, data: null });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Vui lòng chọn tệp CV trước khi tải lên.");
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("cvFile", file);
    if (cvName.trim()) formData.append("cvName", cvName.trim());
    formData.append("makeDefault", makeDefault);

    try {
      const res = await cvApi.uploadCv(formData);
      applyResponse(res.data);
      toast.success(res.data?.message || "Đã tải lên CV.");
      setFile(null);
      setCvName("");
      setMakeDefault(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Lỗi tải lên CV:", err);
      toast.error(err.response?.data?.message || "Không thể tải lên CV.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (cvId) => {
    try {
      const res = await cvApi.setDefault(cvId);
      applyResponse(res.data);
      toast.success(res.data?.message || "Đã đặt CV mặc định.");
    } catch (err) {
      console.error("Lỗi đặt CV mặc định:", err);
      toast.error(err.response?.data?.message || "Không thể đặt CV mặc định.");
    }
  };

  const handleDelete = async (cvId) => {
    try {
      const res = await cvApi.removeCv(cvId);
      applyResponse(res.data);
      toast.success(res.data?.message || "Đã xóa CV.");
    } catch (err) {
      console.error("Lỗi xóa CV:", err);
      toast.error(err.response?.data?.message || "Không thể xóa CV.");
    }
  };

  const askDelete = (cv) => {
    setDeleteTarget(cv);
  };

  const handleView = async (cv) => {
    try {
      if (cv.CVFileUrl) {
        window.open(cv.CVFileUrl, "_blank", "noopener");
      } else {
        toast.error("Không tìm thấy đường dẫn CV.");
      }
    } catch (err) {
      console.error("Lỗi mở CV:", err);
      toast.error("Không thể mở CV để xem.");
    }
  };

  const isUploadDisabled =
    uploading || (quota?.remaining !== undefined && quota.remaining <= 0);

  const pushTopRemaining =
    pushTopInfo?.remaining ??
    appUser?.PushTopRemainingToday ??
    appUser?.PushTopRemaining ??
    null;
  const pushTopLimit =
    pushTopInfo?.limit ??
    appUser?.PushTopLimitToday ??
    appUser?.PushTopLimit ??
    null;

  const defaultCvName = useMemo(() => {
    const def = cvs.find((cv) => cv.IsDefault);
    return def?.CVName || null;
  }, [cvs]);

  const defaultCvUrl = useMemo(() => {
    const def = cvs.find((cv) => cv.IsDefault);
    return def?.CVFileUrl || null;
  }, [cvs]);

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <div className="grid items-start gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Quản lý CV</h1>
                <p className="text-sm text-gray-500">
                  Lưu trữ và chọn CV mặc định để hiển thị cho nhà tuyển dụng.
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 text-blue-700 rounded-lg bg-blue-50">
                <FiCheckCircle />
                <span className="text-sm font-semibold">
                  {quota.used}/{effectiveLimit} CV đang dùng
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
              <span>
                Còn lại:{" "}
                <strong>{Math.max(effectiveLimit - quota.used, 0)}</strong> CV
              </span>
              {appUser?.CurrentVIP && (
                <span>
                  Gói hiện tại: <strong>{appUser.CurrentVIP}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-800">
              <FiUpload /> Tải lên CV mới
            </h2>
            <form className="space-y-4" onSubmit={handleUpload}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Tên CV
                  </label>
                  <input
                    type="text"
                    value={cvName}
                    onChange={(e) => setCvName(e.target.value)}
                    placeholder="Đặt tên gợi nhớ cho CV của bạn"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Chọn tệp CV
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Chỉ hỗ trợ định dạng PDF. Vui lòng chọn file PDF.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="makeDefault"
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="makeDefault"
                  className="text-sm text-gray-700 select-none"
                >
                  Đặt làm CV mặc định sau khi tải lên
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isUploadDisabled}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                    isUploadDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <FiUpload />
                  {uploading ? "Đang tải lên..." : "Tải lên CV"}
                </button>
                {quota?.remaining !== undefined && quota.remaining <= 0 && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <FiAlertTriangle /> Bạn đã dùng hết giới hạn CV. Hãy xóa bớt
                    hoặc nâng cấp gói.
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Danh sách CV
              </h2>
              <span className="text-sm text-gray-500">
                Tổng cộng: {quota.total || cvs.length} CV
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Đang tải danh sách CV...</p>
            ) : cvs.length === 0 ? (
              <p className="text-sm text-gray-500">Bạn chưa có CV nào.</p>
            ) : (
              <div className="space-y-3">
                {sortedCvs.map((cv) => (
                  <div
                    key={cv.CVID}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border border-gray-100 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-gray-800">
                          {cv.CVName}
                        </span>
                        {cv.IsDefault ? (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 rounded-full bg-blue-50">
                            <FiStar /> Mặc định
                          </span>
                        ) : null}
                        {cv.IsLocked && (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 rounded-full bg-red-50">
                            <FiAlertTriangle /> Đã khóa (vượt giới hạn)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        Tải lên lúc: {formatDate(cv.CreatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(cv)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 rounded-lg bg-blue-50 hover:bg-blue-100"
                      >
                        <FiExternalLink /> Xem CV
                      </button>
                      {!cv.IsDefault && !cv.IsLocked && (
                        <button
                          onClick={() => handleSetDefault(cv.CVID)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-700 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                        >
                          <FiStar /> Đặt mặc định
                        </button>
                      )}
                      <button
                        onClick={() => askDelete(cv)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-700 rounded-lg bg-red-50 hover:bg-red-100"
                      >
                        <FiTrash2 /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col p-5 space-y-4 bg-white border border-gray-100 shadow-sm rounded-xl md:sticky md:top-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Đẩy top hồ sơ
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-3 text-blue-800 rounded-lg bg-blue-50">
            <span className="text-sm font-semibold">
              Lượt còn lại{" "}
              {pushTopInfo?.scope === "weekly" ? "tuần này" : "hôm nay"}
            </span>
            <span className="text-xl font-bold">
              {pushTopInfo.loading ? "…" : pushTopRemaining ?? "—"}/
              {pushTopInfo.loading ? "…" : pushTopLimit ?? "—"}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            Đẩy hồ sơ lên đầu danh sách mà nhà tuyển dụng đang xem. Số lượt được
            reset mỗi tuần. Nếu bạn là VIP, số lượt được reset mỗi ngày.
          </p>

          <button
            type="button"
            onClick={() =>
              toast("Tính năng đẩy top sẽ được cập nhật ở bước tiếp theo.")
            }
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={pushTopInfo.loading ? true : (pushTopRemaining ?? 0) <= 0}
          >
            🚀 Đẩy top hồ sơ
          </button>

          <div className="pt-4 border-t">
            <h4 className="mb-2 text-sm font-semibold text-gray-800">
              Thông tin của bạn sẽ được hiển thị như sau với nhà tuyển dụng:
            </h4>
            {profilePreview.loading ? (
              <p className="text-sm text-gray-500">
                Đang tải thông tin hồ sơ...
              </p>
            ) : (
              <dl className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">Họ và tên</dt>
                  <dd className="text-right">
                    {profilePreview.data?.FullName || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">Ngày sinh</dt>
                  <dd className="text-right">
                    {profilePreview.data?.Birthday
                      ? new Date(
                          profilePreview.data.Birthday
                        ).toLocaleDateString("vi-VN", {
                          timeZone: "UTC",
                        })
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">Số điện thoại</dt>
                  <dd className="text-right">
                    {profilePreview.data?.PhoneNumber || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">Tỉnh thành</dt>
                  <dd className="text-right">
                    {profilePreview.data?.City || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">Quốc gia</dt>
                  <dd className="text-right">
                    {profilePreview.data?.Country || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">Chuyên môn</dt>
                  <dd className="text-right">
                    {profilePreview.data?.Specializations?.length
                      ? profilePreview.data.Specializations.map(
                          (s) => s.SpecializationName
                        ).join(", ")
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-gray-800">CV mặc định</dt>
                  <dd className="text-right">
                    {defaultCvName ? (
                      <a
                        href={defaultCvUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {defaultCvName}
                      </a>
                    ) : (
                      "Chưa chọn"
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.CVID) {
            handleDelete(deleteTarget.CVID);
          }
        }}
        title="Xóa CV?"
        message={`Bạn có chắc muốn xóa "${
          deleteTarget?.CVName || "CV"
        }"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger
      />
    </div>
  );
};

export default CvManagement;