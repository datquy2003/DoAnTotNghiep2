import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  FiRefreshCw,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiFile,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { jobApi } from "../../../api/jobApi";
import { formatDate } from "../../../utils/formatDate";

const JobApplicantsModal = ({ open, job, onClose }) => {
  const jobId = job?.JobID;
  const jobTitle = job?.JobTitle || "";

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ total: 0, applicants: [] });
  const [viewingCvId, setViewingCvId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [page, setPage] = useState(1);
  const applicantsPerPage = 10;

  const load = async (isRefresh = false) => {
    if (!jobId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await jobApi.getJobApplicants(jobId);
      const payload = res?.data || {};
      setData({
        total:
          payload.total ??
          (Array.isArray(payload.applicants) ? payload.applicants.length : 0),
        applicants: Array.isArray(payload.applicants) ? payload.applicants : [],
      });
    } catch (err) {
      console.error("Lỗi load applicants:", err);
      toast.error(
        err?.response?.data?.message || "Không thể tải danh sách ứng viên."
      );
      setData({ total: 0, applicants: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setPage(1);
      return;
    }
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId]);

  const sorted = useMemo(() => {
    const toTime = (v) => {
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return [...(data.applicants || [])].sort(
      (a, b) => toTime(b?.appliedAt) - toTime(a?.appliedAt)
    );
  }, [data.applicants]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((sorted?.length || 0) / applicantsPerPage);
    return Math.max(1, n);
  }, [sorted, applicantsPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedApplicants = useMemo(() => {
    const start = (page - 1) * applicantsPerPage;
    return (sorted || []).slice(start, start + applicantsPerPage);
  }, [sorted, page, applicantsPerPage]);

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

  const handleViewCv = async (applicationId, cvUrl) => {
    if (!jobId || !applicationId) return;

    setViewingCvId(applicationId);
    try {
      await jobApi.viewApplicantCv(jobId, applicationId);
      await load(true);
      if (cvUrl) {
        window.open(cvUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Lỗi xem CV:", err);
      toast.error(err?.response?.data?.message || "Không thể ghi nhận xem CV.");
    } finally {
      setViewingCvId(null);
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    if (!jobId || !applicationId) return;

    setUpdatingStatusId(applicationId);
    try {
      await jobApi.updateApplicantStatus(jobId, applicationId, status);
      toast.success(
        status === 2 ? "Đã đánh dấu phù hợp." : "Đã đánh dấu chưa phù hợp."
      );
      await load(true);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      toast.error(
        err?.response?.data?.message || "Không thể cập nhật trạng thái."
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusLabel = (status) => {
    switch (Number(status)) {
      case 0:
        return "Đã ứng tuyển";
      case 1:
        return "Đã xem CV";
      case 2:
        return "Phù hợp";
      case 3:
        return "Chưa phù hợp";
      default:
        return "—";
    }
  };

  const getStatusColor = (status) => {
    switch (Number(status)) {
      case 0:
        return "bg-gray-100 text-gray-700 border-gray-200";
      case 1:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case 2:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 3:
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FiUsers className="h-5 w-5 text-blue-600" />
              <div className="text-lg font-bold text-gray-900">
                Ứng viên đã ứng tuyển
              </div>
            </div>
            <div className="mt-1 text-sm text-gray-600 line-clamp-2">
              {jobTitle ? jobTitle : `JobID: ${jobId || "—"}`}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Tổng số:{" "}
              <span className="font-semibold text-gray-900">
                {loading ? "…" : data.total}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              <FiRefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-10 text-center text-gray-600">
              Đang tải danh sách ứng viên...
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-10 text-center text-gray-600">
              Chưa có ứng viên nào ứng tuyển.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ứng viên
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SĐT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CV
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedApplicants.map((a) => {
                    const hasViewedCv = Number(a.currentStatus) >= 1;
                    const isSuitable = Number(a.currentStatus) === 2;
                    const isNotSuitable = Number(a.currentStatus) === 3;
                    return (
                      <tr key={a.applicationId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{a.fullName || a.candidateId || "—"}</span>
                            {a.isVip && (
                              <FiStar size={14} className="text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {a.candidateEmail || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {a.phoneNumber || a.phoneMasked || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {a.appliedAt ? formatDate(a.appliedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {a.cv?.url ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleViewCv(a.applicationId, a.cv.url)
                              }
                              disabled={viewingCvId === a.applicationId}
                              className="inline-flex items-center gap-2 text-blue-600 hover:underline disabled:opacity-60"
                              title={a.cv?.name || "Xem CV"}
                            >
                              <FiFile className="h-4 w-4" />
                              {viewingCvId === a.applicationId
                                ? "Đang xem..."
                                : "Xem CV"}
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              a.currentStatus
                            )}`}
                          >
                            {getStatusLabel(a.currentStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(a.applicationId, 2)
                              }
                              disabled={
                                !hasViewedCv ||
                                isSuitable ||
                                updatingStatusId === a.applicationId
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !hasViewedCv ? "Vui lòng xem CV trước" : ""
                              }
                            >
                              <FiCheckCircle className="h-3.5 w-3.5" />
                              Phù hợp
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(a.applicationId, 3)
                              }
                              disabled={
                                !hasViewedCv ||
                                isNotSuitable ||
                                updatingStatusId === a.applicationId
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !hasViewedCv ? "Vui lòng xem CV trước" : ""
                              }
                            >
                              <FiXCircle className="h-3.5 w-3.5" />
                              Chưa phù hợp
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {sorted.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 border-t border-gray-200">
              <div className="ml-4 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * applicantsPerPage + 1} -{" "}
                  {Math.min(page * applicantsPerPage, sorted.length)}
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
    </div>
  );

  return createPortal(modal, document.body);
};

export default JobApplicantsModal;