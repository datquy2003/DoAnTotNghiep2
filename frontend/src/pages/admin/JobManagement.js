import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiEye,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { adminApi } from "../../api/adminApi";
import { renderSalary } from "../../utils/renderSalary";
import { formatDate } from "../../utils/formatDate";
import { formatDateOnly } from "../../utils/formatDateOnly";
import AdminJobDetailModal from "./components/AdminJobDetailModal";

const JobManagement = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState(null);
  const [page, setPage] = useState(1);
  const jobsPerPage = 10;

  const loadActiveJobs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await adminApi.getActiveJobs();
      setJobs(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi load active jobs:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách bài đang tuyển."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActiveJobs(false);
  }, []);

  const openDetail = async (jobId) => {
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

  const rows = useMemo(() => jobs, [jobs]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((rows?.length || 0) / jobsPerPage);
    return Math.max(1, n);
  }, [rows, jobsPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * jobsPerPage;
    return (rows || []).slice(start, start + jobsPerPage);
  }, [rows, page, jobsPerPage]);

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
            Quản lý bài tuyển dụng
          </div>
          <div className="text-sm text-gray-600">
            Tổng số:{" "}
            <span className="font-semibold text-gray-900">{rows.length}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadActiveJobs(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
        >
          <FiRefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
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
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hết hạn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500 text-sm"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500 text-sm"
                  >
                    Không có bài nào đang tuyển.
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
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(j.CreatedAt) || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDateOnly(j.ExpiresAt) || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <button
                        title="Xem chi tiết"
                        onClick={() => openDetail(j.JobID)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
            <div className="ml-4 text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {(page - 1) * jobsPerPage + 1} -{" "}
                {Math.min(page * jobsPerPage, rows.length)}
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
          setJobDetail(null);
        }}
      />
    </div>
  );
};

export default JobManagement;