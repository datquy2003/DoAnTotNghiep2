import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";
import { jobApi } from "../../api/jobApi";
import { renderSalary } from "../../utils/renderSalary";
import CvSelectionModal from "../../components/modals/CvSelectionModal";

export default function FavoriteJobs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await jobApi.getSavedJobs();
      const list = Array.isArray(res?.data) ? res.data : [];
      setJobs(list);
    } catch (err) {
      console.error("Lỗi load saved jobs:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể tải danh sách việc yêu thích."
      );
      setJobs([]);
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
    return [...(jobs || [])].sort(
      (a, b) => toTime(b?.SavedAt) - toTime(a?.SavedAt)
    );
  }, [jobs]);

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

  const handleToggleSave = async (jobId, nextSaved) => {
    if (!jobId) return;
    setSavingId(jobId);
    try {
      if (nextSaved) {
        await jobApi.saveJob(jobId);
        toast.success("Đã thêm vào việc yêu thích.");
      } else {
        await jobApi.unsaveJob(jobId);
        toast.success("Đã bỏ yêu thích.");
      }
      if (!nextSaved) {
        setJobs((prev) =>
          (prev || []).filter((j) => Number(j?.JobID) !== Number(jobId))
        );
      } else {
        setJobs((prev) =>
          (prev || []).map((j) =>
            Number(j?.JobID) === Number(jobId) ? { ...j, HasSaved: true } : j
          )
        );
      }
    } catch (err) {
      console.error("Lỗi toggle save:", err);
      toast.error(
        err?.response?.data?.message || "Không thể cập nhật yêu thích."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleApplyClick = (jobId) => {
    if (!jobId) return;
    const already = (jobs || []).some(
      (j) =>
        Number(j?.JobID) === Number(jobId) &&
        (j?.HasApplied === true || Number(j?.HasApplied) === 1)
    );
    if (already) return;
    setSelectedJobId(jobId);
    setIsCvModalOpen(true);
  };

  const handleCvSelect = async (cvId) => {
    if (!selectedJobId) return;
    setApplyingId(selectedJobId);
    try {
      const res = await jobApi.applyToJob(selectedJobId, { cvId });
      toast.success(res?.data?.message || "Ứng tuyển thành công.");
      setJobs((prev) =>
        (prev || []).map((j) =>
          Number(j?.JobID) === Number(selectedJobId)
            ? { ...j, HasApplied: true }
            : j
        )
      );
    } catch (err) {
      console.error("Lỗi apply:", err);
      toast.error(err?.response?.data?.message || "Không thể ứng tuyển.");
    } finally {
      setApplyingId(null);
      setSelectedJobId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="text-2xl font-bold text-gray-900">Việc yêu thích</div>
          <div className="mt-1 text-sm text-gray-600">
            Tổng số:{" "}
            <span className="font-semibold text-gray-900">
              {loading ? "…" : sorted.length}
            </span>
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
          <span>Làm mới</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-gray-600">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
            <FiRefreshCw className="animate-spin h-5 w-5 text-blue-600" />
            <span>Đang tải danh sách việc yêu thích...</span>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-600">
          Bạn chưa yêu thích bài tuyển dụng nào.
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
            {paged.map((j, idx) => {
              const hasApplied =
                j?.HasApplied === true || Number(j?.HasApplied) === 1;
              const hasSaved =
                j?.HasSaved === true || Number(j?.HasSaved) === 1;
              const applyDisabled = applyingId === j.JobID || hasApplied;
              const isVip =
                j?.IsCompanyVip === true || Number(j?.IsCompanyVip) === 1;
              const shimmerDelay = isVip ? 2 + (idx % 3) * 0.3 : 0;
              return (
                <div
                  key={j.JobID}
                  onClick={(e) => {
                    if (e.target.closest("button") === null) {
                      navigate(`/jobs/${j.JobID}`);
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
                        {j.CompanyLogoURL ? (
                          <img
                            src={j.CompanyLogoURL}
                            alt={j.CompanyName || "Logo"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold ${
                            j.CompanyLogoURL ? "hidden" : ""
                          }`}
                        >
                          {j.CompanyName
                            ? j.CompanyName.charAt(0).toUpperCase()
                            : "—"}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold text-gray-900 line-clamp-2">
                          {j.JobTitle}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {j.CompanyName || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleSave(j.JobID, !hasSaved)}
                        disabled={savingId === j.JobID}
                        className={`h-10 w-10 rounded-full border flex items-center justify-center transition ${
                          hasSaved
                            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={hasSaved ? "Bỏ yêu thích" : "Yêu thích"}
                      >
                        <FiHeart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {j.SpecializationName ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border overflow-hidden max-w-[150px] ${
                          isVip
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        <FiBriefcase className="h-3 w-3 shrink-0" />
                        <span className="min-w-0 truncate">
                          {j.SpecializationName}
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
                        {renderSalary(j.SalaryMin, j.SalaryMax)}
                      </span>
                    </span>
                    {j.CompanyCity ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border overflow-hidden max-w-[130px] ${
                          isVip
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-gray-50 text-gray-700 border-gray-100"
                        }`}
                      >
                        <FiMapPin className="h-3 w-3 shrink-0" />
                        <span className="min-w-0 truncate">
                          {j.CompanyCity}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleApplyClick(j.JobID)}
                      disabled={applyDisabled}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      title={hasApplied ? "Bạn đã ứng tuyển công việc này" : ""}
                    >
                      <FiSend className="h-4 w-4" />
                      <span>
                        {applyingId === j.JobID
                          ? "Đang gửi..."
                          : hasApplied
                          ? "Đã ứng tuyển"
                          : "Ứng tuyển"}
                      </span>
                    </button>
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

      <CvSelectionModal
        isOpen={isCvModalOpen}
        onClose={() => {
          setIsCvModalOpen(false);
          setSelectedJobId(null);
        }}
        onSelect={handleCvSelect}
        jobTitle={
          selectedJobId
            ? jobs.find((j) => Number(j.JobID) === Number(selectedJobId))
                ?.JobTitle
            : null
        }
      />
    </div>
  );
}