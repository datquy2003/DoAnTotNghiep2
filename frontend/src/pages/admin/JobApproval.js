import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiEye,
  FiRefreshCw,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { adminApi } from "../../api/adminApi";
import { notificationApi } from "../../api/notificationApi";
import { formatDate } from "../../utils/formatDate";
import { renderSalary } from "../../utils/renderSalary";
import { formatDateOnly } from "../../utils/formatDateOnly";
import { STATUS_CONFIG } from "../../constants/statusConfig";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import AdminJobDetailModal from "./components/AdminJobDetailModal";

const JobApproval = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    jobId: null,
    reason: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false,
    confirmText: "Xác nhận",
  });
  const [page, setPage] = useState(1);
  const jobsPerPage = 10;

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingJobs();
      setJobs(Array.isArray(res?.data) ? res.data : []);
      setPage(1);
    } catch (error) {
      console.error("Lỗi load pending jobs:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách bài chờ duyệt."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const pendingCount = jobs.length;

  const openDetail = async (jobId) => {
    setSelectedJobId(jobId);
    setDetailOpen(true);
    setDetailLoading(true);
    setJobDetail(null);
    try {
      const res = await adminApi.getJobDetail(jobId);
      setJobDetail(res?.data || null);
    } catch (error) {
      console.error("Lỗi load job detail:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải chi tiết bài đăng."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const approve = (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: "Duyệt bài đăng",
      message: "Bạn chắc chắn muốn duyệt bài tuyển dụng này?",
      confirmText: "Duyệt",
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isOpen: false }));
        setActingId(jobId);
        try {
          const res = await adminApi.approveJob(jobId);
          toast.success(res?.data?.message || "Đã duyệt bài đăng.");
          const updated = jobs.filter((j) => j.JobID !== jobId);
          setJobs(updated);
          const newTotalPages = Math.ceil(updated.length / jobsPerPage);
          if (page > newTotalPages && newTotalPages > 0) {
            setPage(newTotalPages);
          }
          if (selectedJobId === jobId) {
            setDetailOpen(false);
            setSelectedJobId(null);
            setJobDetail(null);
          }
          notificationApi.triggerRefresh();
        } catch (error) {
          console.error("Lỗi duyệt job:", error);
          toast.error(
            error?.response?.data?.message || "Không thể duyệt bài đăng."
          );
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const reject = (jobId) => {
    setRejectModal({ isOpen: true, jobId, reason: "" });
  };

  const submitReject = async () => {
    const jobId = rejectModal.jobId;
    const reason = (rejectModal.reason || "").trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    setRejectModal({ isOpen: false, jobId: null, reason: "" });
    setActingId(jobId);
    try {
      const res = await adminApi.rejectJob(jobId, { reasonRejected: reason });
      toast.success(res?.data?.message || "Đã từ chối bài đăng.");
      const updated = jobs.filter((j) => j.JobID !== jobId);
      setJobs(updated);
      const newTotalPages = Math.ceil(updated.length / jobsPerPage);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
      if (selectedJobId === jobId) {
        setDetailOpen(false);
        setSelectedJobId(null);
        setJobDetail(null);
      }
      notificationApi.triggerRefresh();
    } catch (error) {
      console.error("Lỗi reject job:", error);
      toast.error(
        error?.response?.data?.message || "Không thể từ chối bài đăng."
      );
    } finally {
      setActingId(null);
    }
  };

  const tableRows = useMemo(() => jobs, [jobs]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((tableRows?.length || 0) / jobsPerPage);
    return Math.max(1, n);
  }, [tableRows, jobsPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * jobsPerPage;
    return (tableRows || []).slice(start, start + jobsPerPage);
  }, [tableRows, page, jobsPerPage]);

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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold text-gray-900">
            Duyệt bài tuyển dụng
          </div>
          <div className="text-sm text-gray-600">
            Đang chờ duyệt:{" "}
            <span className="font-semibold text-gray-900">{pendingCount}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={loadPending}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Công ty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Mức lương
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chuyên môn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hết hạn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500 text-sm"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500 text-sm"
                  >
                    Không có bài đăng chờ duyệt.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((j) => (
                  <tr key={j.JobID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      <div className="line-clamp-2">{j.JobTitle}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {j.CompanyName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {renderSalary(j.SalaryMin, j.SalaryMax)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {j.SpecializationName ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {j.SpecializationName}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-center">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(() => {
                        const st = STATUS_CONFIG?.[Number(j.Status)] || null;
                        if (!st)
                          return <span className="text-gray-600">—</span>;
                        return (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${st.className}`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(j.CreatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDateOnly(j.ExpiresAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <button
                          title="Xem chi tiết"
                          onClick={() => openDetail(j.JobID)}
                          className="text-blue-700 hover:text-blue-900"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          title="Duyệt"
                          onClick={() => approve(j.JobID)}
                          disabled={actingId === j.JobID}
                          className={`text-emerald-700 hover:text-emerald-900 ${
                            actingId === j.JobID
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <FiCheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          title="Từ chối"
                          onClick={() => reject(j.JobID)}
                          disabled={actingId === j.JobID}
                          className={`text-red-700 hover:text-red-900 ${
                            actingId === j.JobID
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <FiXCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {tableRows.length > 0 && (
          <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
            <div className="ml-4 text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {(page - 1) * jobsPerPage + 1} -{" "}
                {Math.min(page * jobsPerPage, tableRows.length)}
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
                      <span key={`dots-${idx}`} className="px-2 text-gray-500">
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

      <AdminJobDetailModal
        open={detailOpen}
        job={jobDetail}
        loading={detailLoading}
        onClose={() => {
          setDetailOpen(false);
          setSelectedJobId(null);
          setJobDetail(null);
        }}
      />

      {rejectModal.isOpen &&
        (() => {
          const modalContent = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
              <div
                className="absolute inset-0"
                onClick={() =>
                  setRejectModal({ isOpen: false, jobId: null, reason: "" })
                }
              />
              <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-100 p-5">
                <div className="text-lg font-bold text-gray-900">
                  Lý do từ chối
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Nhập lý do để nhà tuyển dụng chỉnh sửa và đăng lại.
                </div>

                <textarea
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal((p) => ({ ...p, reason: e.target.value }))
                  }
                  rows={5}
                  className="mt-4 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Nhập lý do từ chối..."
                />

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRejectModal({ isOpen: false, jobId: null, reason: "" })
                    }
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={submitReject}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          );

          if (typeof document === "undefined") return modalContent;
          return createPortal(modalContent, document.body);
        })()}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm || (() => {})}
      />
    </div>
  );
};

export default JobApproval;