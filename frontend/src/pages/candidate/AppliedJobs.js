import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";
import { jobApi } from "../../api/jobApi";
import { renderSalary } from "../../utils/renderSalary";
import { formatDate } from "../../utils/formatDate";
import { APPLIED_STATUS } from "../../constants/appliedStatus";

export default function AppliedJobs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await jobApi.getAppliedJobs();
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi load applied jobs:", err);
      toast.error(
        err?.response?.data?.message || "Không thể tải danh sách đã ứng tuyển."
      );
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const sorted = useMemo(() => {
    const toTime = (v) => {
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return [...(items || [])].sort(
      (a, b) => toTime(b?.AppliedAt) - toTime(a?.AppliedAt)
    );
  }, [items]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((sorted?.length || 0) / PAGE_SIZE);
    return Math.max(1, n);
  }, [sorted, PAGE_SIZE]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (sorted || []).slice(start, start + PAGE_SIZE);
  }, [sorted, page, PAGE_SIZE]);

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            Việc đã ứng tuyển
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Tổng số:{" "}
            <span className="font-semibold text-gray-900">{sorted.length}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
        >
          <FiRefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-gray-600">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
            <FiRefreshCw className="animate-spin h-5 w-5 text-blue-600" />
            <span>Đang tải danh sách việc đã ứng tuyển...</span>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-600">
          Bạn chưa ứng tuyển công việc nào.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-semibold text-gray-900">
              {(page - 1) * PAGE_SIZE + 1}
            </span>
            {" - "}
            <span className="font-semibold text-gray-900">
              {Math.min(page * PAGE_SIZE, sorted.length)}
            </span>{" "}
            /{" "}
            <span className="font-semibold text-gray-900">{sorted.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((x, idx) => {
              const st = APPLIED_STATUS[Number(x?.CurrentStatus)] || {
                label: `Trạng thái ${x?.CurrentStatus ?? "—"}`,
                className: "bg-gray-50 text-gray-700 border-gray-100",
              };
              const isVip =
                x?.IsCompanyVip === true || Number(x?.IsCompanyVip) === 1;
              const shimmerDelay = isVip ? 2 + (idx % 3) * 0.3 : 0;
              return (
                <div
                  key={x.ApplicationID}
                  onClick={(e) => {
                    if (e.target.closest("button") === null) {
                      navigate(`/jobs/${x.JobID}`);
                    }
                  }}
                  className={`rounded-xl shadow-sm border p-4 flex flex-col relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                    isVip
                      ? "bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 border-yellow-400 vip-shimmer"
                      : "bg-white border-gray-100"
                  }`}
                  style={
                    isVip
                      ? {
                          "--shimmer-delay": `${shimmerDelay}s`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="shrink-0 w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {x.CompanyLogoURL ? (
                          <img
                            src={x.CompanyLogoURL}
                            alt={x.CompanyName || "Logo"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold ${
                            x.CompanyLogoURL ? "hidden" : ""
                          }`}
                        >
                          {x.CompanyName
                            ? x.CompanyName.charAt(0).toUpperCase()
                            : "—"}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold text-gray-900 line-clamp-2">
                          {x.JobTitle || "—"}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {x.CompanyName || "—"}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${st.className}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {x.SpecializationName ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border overflow-hidden max-w-[150px] ${
                          isVip
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        <FiBriefcase className="h-3 w-3 shrink-0" />
                        <span className="min-w-0 truncate">
                          {x.SpecializationName}
                        </span>
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border overflow-hidden max-w-[170px] ${
                        isVip
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        {renderSalary(x.SalaryMin, x.SalaryMax)}
                      </span>
                    </span>
                    {x.CompanyCity ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border overflow-hidden max-w-[130px] ${
                          isVip
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-gray-50 text-gray-700 border-gray-100"
                        }`}
                      >
                        <FiMapPin className="h-3 w-3 shrink-0" />
                        <span className="min-w-0 truncate">
                          {x.CompanyCity}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-3 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>
                        Ứng tuyển lúc:{" "}
                        <span className="font-semibold text-gray-900">
                          {x.AppliedAt ? formatDate(x.AppliedAt) : "—"}
                        </span>
                      </span>
                      {(x.CVFileUrl || x.Snapshot_CVFileUrl) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const cvUrl = x.Snapshot_CVFileUrl || x.CVFileUrl;
                            if (cvUrl) {
                              window.open(
                                cvUrl,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 underline hover:text-red-600 transition-colors"
                          title={x.Snapshot_CVName || x.CVName || "Xem CV"}
                        >
                          <FiFileText className="h-3 w-3" />
                          <span>CV</span>
                        </button>
                      ) : null}
                    </div>
                    {x.CvViewedAt ? (
                      <div>
                        Nhà tuyển dụng đã xem CV lúc:{" "}
                        <span className="font-semibold text-blue-600">
                          {formatDate(x.CvViewedAt)}
                        </span>
                      </div>
                    ) : null}
                    {Number(x.CurrentStatus) === 2 ? (
                      <div>
                        Trạng thái:{" "}
                        <span className="font-semibold text-emerald-600">
                          Phù hợp
                        </span>
                        {x.StatusUpdatedAt ? (
                          <span className="text-gray-600 ml-1">
                            (lúc {formatDate(x.StatusUpdatedAt)})
                          </span>
                        ) : null}
                      </div>
                    ) : Number(x.CurrentStatus) === 3 ? (
                      <div>
                        Trạng thái:{" "}
                        <span className="font-semibold text-red-600">
                          Chưa phù hợp
                        </span>
                        {x.StatusUpdatedAt ? (
                          <span className="text-gray-600 ml-1">
                            (lúc {formatDate(x.StatusUpdatedAt)})
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
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
        </div>
      )}
    </div>
  );
}