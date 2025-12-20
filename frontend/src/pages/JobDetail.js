import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiSend,
  FiHeart,
  FiExternalLink,
  FiAward,
  FiBook,
  FiUsers,
  FiClock,
  FiStar,
  FiCalendar,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { renderSalary } from "../utils/renderSalary";
import { formatDateOnly } from "../utils/formatDateOnly";
import { formatDate } from "../utils/formatDate";
import { jobApi } from "../api/jobApi";
import { renderJobPostRichText } from "../utils/jobPostRichText";
import CvSelectionModal from "../components/modals/CvSelectionModal";
import { vipApi } from "../api/vipApi";
import { paymentApi } from "../api/paymentApi";
import { vipFeatureApi } from "../api/vipFeatureApi";
import { formatCurrency } from "../utils/formatCurrency";

const JobDetail = () => {
  const { id } = useParams();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const roleId = Number(appUser?.RoleID || 0);
  const isCandidate = roleId === 4;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isApplicantListModalOpen, setIsApplicantListModalOpen] =
    useState(false);
  const [oneTimePlans, setOneTimePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [applicantList, setApplicantList] = useState([]);
  const [loadingApplicantList, setLoadingApplicantList] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!job?.ExpiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const nowStr = now.toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [nowMonth, nowDay, nowYear] = nowStr.split("/");
      const nowDate = new Date(
        parseInt(nowYear),
        parseInt(nowMonth) - 1,
        parseInt(nowDay)
      );

      const expires = new Date(job.ExpiresAt);
      const expiresStr = expires.toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [expMonth, expDay, expYear] = expiresStr.split("/");
      const expiresDate = new Date(
        parseInt(expYear),
        parseInt(expMonth) - 1,
        parseInt(expDay)
      );

      const diffDays = expiresDate.getTime() - nowDate.getTime();

      const nowTime = new Date().getTime();
      const expiresTime = new Date(job.ExpiresAt).getTime();
      const diff = expiresTime - nowTime;

      if (diff <= 0 || diffDays <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });
        return;
      }

      const days = Math.ceil(diffDays / (1000 * 60 * 60 * 24));

      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [job?.ExpiresAt]);

  useEffect(() => {
    const fetchJobDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await jobApi.getJobDetail(id);
        const jobData = response.data;
        setJob(jobData);
        setHasApplied(
          jobData.HasApplied === true || Number(jobData.HasApplied) === 1
        );
        setHasSaved(
          jobData.HasSaved === true || Number(jobData.HasSaved) === 1
        );
      } catch (err) {
        console.error("Lỗi lấy chi tiết công việc:", err);
        const errorMessage =
          err.response?.data?.message || "Không thể tải thông tin công việc.";
        setError(errorMessage);

        if (
          err.response?.status === 404 &&
          errorMessage ===
            "Nội dung bạn tìm không tồn tại, vui lòng kiểm tra lại."
        ) {
          setTimeout(() => {
            navigate("/content-not-found");
          }, 100);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleSave = async () => {
    if (!isCandidate || !job?.JobID) return;
    setSavingId(job.JobID);
    try {
      if (hasSaved) {
        await jobApi.unsaveJob(job.JobID);
      } else {
        await jobApi.saveJob(job.JobID);
      }
      setHasSaved(!hasSaved);
    } catch (error) {
      console.error("Lỗi lưu/bỏ lưu:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi lưu/bỏ lưu.");
    } finally {
      setSavingId(null);
    }
  };

  const handleApply = () => {
    if (!isCandidate || !job?.JobID || hasApplied) return;
    setIsCvModalOpen(true);
  };

  const handleCvSelect = async (cvId) => {
    if (!job?.JobID) return;
    setApplyingId(job.JobID);
    try {
      const res = await jobApi.applyToJob(job.JobID, { cvId });
      toast.success(res?.data?.message || "Ứng tuyển thành công.");
      setHasApplied(true);
    } catch (err) {
      console.error("Lỗi apply:", err);
      toast.error(err?.response?.data?.message || "Không thể ứng tuyển.");
    } finally {
      setApplyingId(null);
      setIsCvModalOpen(false);
    }
  };

  const handleViewCompany = () => {
    if (!job?.CompanyID) return;
    navigate(`/companies/${job.CompanyID}`);
  };

  const loadApplicantList = async () => {
    if (!job?.JobID) return;
    setLoadingApplicantList(true);
    try {
      const res = await vipFeatureApi.getApplicantList(job.JobID);
      setApplicantList(res.data?.applicants || []);
      setIsApplicantListModalOpen(true);
    } catch (error) {
      console.error("Lỗi tải danh sách ứng viên:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách ứng viên."
      );
    } finally {
      setLoadingApplicantList(false);
    }
  };

  const handleViewApplicantCount = async () => {
    if (!job?.JobID || !hasApplied) return;

    try {
      setLoadingApplicantList(true);
      await vipFeatureApi.getApplicationInsight(job.JobID);
      await loadApplicantList();
    } catch (error) {
      if (error.response?.status === 402 || error.response?.status === 403) {
        setIsPurchaseModalOpen(true);
      } else {
        toast.error(
          error.response?.data?.message || "Không thể tải thông tin ứng viên."
        );
      }
    } finally {
      setLoadingApplicantList(false);
    }
  };

  const handlePurchaseFeature = async () => {
    if (!job?.JobID || !selectedPlanId) {
      toast.error("Chưa tìm thấy gói ONE_TIME phù hợp. Vui lòng thử lại.");
      return;
    }
    setPurchasing(true);
    try {
      const returnUrl = `/jobs/${job.JobID}?feature_key=CANDIDATE_COMPETITOR_INSIGHT`;
      const metadata = {
        jobId: job.JobID.toString(),
        jobTitle: job.JobTitle || "",
        featureKey: "CANDIDATE_COMPETITOR_INSIGHT",
      };
      const res = await paymentApi.createCheckoutSession(
        selectedPlanId,
        returnUrl,
        metadata
      );
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Không nhận được đường dẫn thanh toán Stripe.");
        setPurchasing(false);
      }
    } catch (error) {
      console.error("Lỗi tạo phiên thanh toán:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể tạo phiên thanh toán. Vui lòng thử lại."
      );
      setPurchasing(false);
    }
  };

  useEffect(() => {
    const fetchOneTimePlans = async () => {
      if (!isCandidate) return;
      try {
        const res = await vipApi.getVipPackages(4);
        const plans = Array.isArray(res.data)
          ? res.data.filter((p) => p.PlanType === "ONE_TIME")
          : [];
        setOneTimePlans(plans);
        setSelectedPlanId(plans[0]?.PlanID || null);
      } catch (error) {
        console.error("Lỗi tải gói ONE_TIME:", error);
      }
    };
    fetchOneTimePlans();
  }, [isCandidate]);

  useEffect(() => {
    const checkPaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const planId = urlParams.get("plan_id");
      const featureKey = urlParams.get("feature_key");

      if (
        sessionId &&
        planId &&
        featureKey === "CANDIDATE_COMPETITOR_INSIGHT" &&
        job?.JobID
      ) {
        try {
          await paymentApi.verifyPayment(sessionId, planId);
          toast.success(
            "Thanh toán thành công! Đang tải danh sách ứng viên..."
          );
          window.history.replaceState({}, "", `/jobs/${job.JobID}`);
          await loadApplicantList();
        } catch (error) {
          console.error("Lỗi verify payment:", error);
        }
      }
    };

    if (job?.JobID) {
      checkPaymentSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.JobID]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          {error || "Không tìm thấy công việc."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {job.JobTitle || "—"}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shrink-0">
                <FiDollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Mức lương</div>
                <div className="text-sm font-semibold text-gray-900">
                  {renderSalary(job.SalaryMin, job.SalaryMax)}
                </div>
              </div>
            </div>

            {job.CompanyCity && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shrink-0">
                  <FiMapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Địa điểm</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {job.CompanyCity}
                  </div>
                </div>
              </div>
            )}

            {job.Experience && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shrink-0">
                  <FiBriefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">
                    Kinh nghiệm
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {job.Experience}
                  </div>
                </div>
              </div>
            )}
          </div>

          {job.ExpiresAt && (
            <div className="mb-6">
              <div className="text-base text-gray-600 mb-1">
                Hạn nộp hồ sơ:{" "}
                <span className="font-semibold text-gray-900">
                  {formatDateOnly(job.ExpiresAt)}{" "}
                  {countdown && !countdown.expired && (
                    <span className="text-base text-gray-600">
                      (Còn {countdown.days} ngày)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {isCandidate && (
              <>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={hasApplied || applyingId === job.JobID}
                  className={`flex-[4] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    hasApplied || applyingId === job.JobID
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <FiSend className="h-6 w-6" />
                  {hasApplied
                    ? "Đã ứng tuyển"
                    : applyingId === job.JobID
                    ? "Đang xử lý..."
                    : "Ứng tuyển ngay"}
                </button>
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={savingId === job.JobID}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-semibold transition-colors ${
                    hasSaved
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FiHeart
                    className={`h-6 w-6 ${hasSaved ? "fill-current" : ""}`}
                  />
                  {hasSaved ? "Đã lưu" : "Lưu tin"}
                </button>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Thông tin chung
            </h3>
            <div className="flex items-center justify-between gap-4">
              {job.JobType && (
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <FiAward className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Cấp bậc</div>
                    <div className="text-base font-semibold text-gray-900">
                      {job.JobType}
                    </div>
                  </div>
                </div>
              )}

              {job.EducationLevel && (
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <FiBook className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Học vấn</div>
                    <div className="text-base font-semibold text-gray-900">
                      {job.EducationLevel}
                    </div>
                  </div>
                </div>
              )}

              {job.VacancyCount && (
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <FiUsers className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Số lượng tuyển</div>
                    <div className="text-base font-semibold text-gray-900">
                      {job.VacancyCount}{" "}
                      {job.VacancyCount === 1 ? "người" : "người"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
          {job.CompanyName && (
            <div className="flex flex-col items-center text-center space-y-4 w-full">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {job.CompanyLogoURL ? (
                    <img
                      src={job.CompanyLogoURL}
                      alt={job.CompanyName || "Logo"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center text-gray-400 text-lg font-semibold ${
                      job.CompanyLogoURL ? "hidden" : ""
                    }`}
                  >
                    {job.CompanyName
                      ? job.CompanyName.charAt(0).toUpperCase()
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 line-clamp-2">
                  {job.CompanyName}
                </h2>
                {job.IsCompanyVip && (
                  <FiStar className="h-5 w-5 text-yellow-500" />
                )}
              </div>

              {job.CompanyAddress && (
                <div className="flex items-start justify-center gap-2 text-sm text-gray-600">
                  <FiMapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-3 text-center">
                    {job.CompanyAddress}
                  </span>
                </div>
              )}

              {job.CompanyID && (
                <button
                  type="button"
                  onClick={handleViewCompany}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  <FiExternalLink className="h-4 w-4" />
                  Xem trang công ty
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-emerald-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">
              Chi tiết tin tuyển dụng
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          {job.CategoryName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Danh mục:
              </span>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <span className="text-sm font-semibold">
                  {job.CategoryName}
                </span>
              </div>
            </div>
          )}

          {job.SpecializationName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Chuyên môn:
              </span>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <span className="text-sm font-semibold">
                  {job.SpecializationName}
                </span>
              </div>
            </div>
          )}
        </div>

        {job.JobDescription && job.JobDescription.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Mô tả công việc
            </h3>
            <div className="text-sm text-gray-700">
              {renderJobPostRichText(
                Array.isArray(job.JobDescription)
                  ? job.JobDescription.join("\n")
                  : job.JobDescription
              )}
            </div>
          </div>
        )}

        {job.Requirements && job.Requirements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Yêu cầu</h3>
            <div className="text-sm text-gray-700">
              {renderJobPostRichText(
                Array.isArray(job.Requirements)
                  ? job.Requirements.join("\n")
                  : job.Requirements
              )}
            </div>
          </div>
        )}

        {job.CandidateRequirements && job.CandidateRequirements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Yêu cầu ứng viên
            </h3>
            <div className="text-sm text-gray-700">
              {renderJobPostRichText(
                Array.isArray(job.CandidateRequirements)
                  ? job.CandidateRequirements.join("\n")
                  : job.CandidateRequirements
              )}
            </div>
          </div>
        )}

        {job.Benefits && job.Benefits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Phúc lợi</h3>
            <div className="text-sm text-gray-700">
              {renderJobPostRichText(
                Array.isArray(job.Benefits)
                  ? job.Benefits.join("\n")
                  : job.Benefits
              )}
            </div>
          </div>
        )}

        {job.Location && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Địa điểm làm việc
            </h3>
            <div className="flex items-start gap-2 text-gray-700">
              <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{job.Location}</p>
            </div>
          </div>
        )}

        {job.WorkingTimes && job.WorkingTimes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Thời gian làm việc
            </h3>
            <div className="space-y-2">
              {job.WorkingTimes.map((wt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <FiClock className="h-5 w-5 text-gray-400 shrink-0" />
                  <span className="text-sm">
                    {wt.dayFrom}
                    {wt.dayTo && wt.dayTo !== wt.dayFrom
                      ? ` - ${wt.dayTo}`
                      : ""}{" "}
                    ({wt.timeFrom} - {wt.timeTo})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCandidate && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Cách thức ứng tuyển
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Ứng viên nộp hồ sơ trực tuyến bằng cách bấm{" "}
              <span className="font-semibold text-gray-900">
                Ứng tuyển ngay
              </span>{" "}
              dưới đây.
            </p>
          </div>
        )}

        {job.ExpiresAt && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Hạn nộp hồ sơ
            </h3>
            <div className="flex items-center gap-2 text-gray-700">
              <FiCalendar className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-sm font-semibold">
                {formatDateOnly(job.ExpiresAt)}
              </span>
            </div>
          </div>
        )}

        {isCandidate && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <button
                type="button"
                onClick={handleApply}
                disabled={hasApplied || applyingId === job.JobID}
                className={`flex-[4] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  hasApplied || applyingId === job.JobID
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <FiSend className="h-6 w-6" />
                {hasApplied
                  ? "Đã ứng tuyển"
                  : applyingId === job.JobID
                  ? "Đang xử lý..."
                  : "Ứng tuyển ngay"}
              </button>
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={savingId === job.JobID}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-semibold transition-colors ${
                  hasSaved
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FiHeart
                  className={`h-6 w-6 ${hasSaved ? "fill-current" : ""}`}
                />
                {hasSaved ? "Đã lưu" : "Lưu tin"}
              </button>
              {hasApplied && (
                <button
                  type="button"
                  onClick={handleViewApplicantCount}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                >
                  <FiUsers className="h-5 w-5" />
                  <span className="text-sm">Xem số người đã ứng tuyển</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isCandidate && (
        <>
          <CvSelectionModal
            isOpen={isCvModalOpen}
            onClose={() => setIsCvModalOpen(false)}
            onSelect={handleCvSelect}
            jobTitle={job?.JobTitle}
          />

          {isPurchaseModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-[1px] z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-100">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Xem danh sách ứng viên đã ứng tuyển
                  </h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setIsPurchaseModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="px-5 py-4 space-y-3 text-sm text-gray-800">
                  <p>
                    Bạn cần mua để có thể xem danh sách các ứng viên đã ứng
                    tuyển vào công việc:
                    <strong className="ml-1">{job?.JobTitle || "—"}</strong>
                  </p>
                  <p className="text-gray-600">
                    Sau khi thanh toán, bạn sẽ có thể xem danh sách ứng viên đã
                    ứng tuyển vào công việc này.
                  </p>
                  {oneTimePlans.length > 0 ? (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <select
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={selectedPlanId || ""}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                      >
                        {oneTimePlans.map((p) => (
                          <option key={p.PlanID} value={p.PlanID}>
                            {p.PlanName} - {formatCurrency(p.Price || 0)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      Chưa tìm thấy gói ONE_TIME dành cho ứng viên. Vui lòng cấu
                      hình trong trang admin.
                    </p>
                  )}
                </div>
                <div className="px-5 py-4 border-t flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => setIsPurchaseModalOpen(false)}
                  >
                    Để sau
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePurchaseFeature}
                    disabled={!selectedPlanId || purchasing}
                  >
                    {purchasing ? "Đang xử lý..." : "Mua"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isApplicantListModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-[1px] z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Danh sách ứng viên đã ứng tuyển
                  </h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setIsApplicantListModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {loadingApplicantList ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">Đang tải danh sách...</div>
                    </div>
                  ) : applicantList.length === 0 ? (
                    <div className="text-center py-12">
                      <FiUsers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">
                        Chưa có ứng viên nào ứng tuyển vào công việc này.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-4">
                        Tổng số: <strong>{applicantList.length}</strong> ứng
                        viên
                      </p>
                      <div className="space-y-2">
                        {applicantList.map((applicant, idx) => (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">
                                    {applicant.fullName || "Ứng viên"}
                                  </span>
                                  {applicant.isVip && (
                                    <FiStar className="h-4 w-4 text-yellow-500" />
                                  )}
                                </div>
                                {applicant.appliedAt && (
                                  <p className="text-xs text-gray-500">
                                    Ứng tuyển lúc:{" "}
                                    {formatDate(applicant.appliedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobDetail;