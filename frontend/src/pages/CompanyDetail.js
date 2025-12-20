import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiGlobe,
  FiPhone,
  FiMail,
  FiSlash,
  FiStar,
  FiMapPin,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiHeart,
  FiSend,
} from "react-icons/fi";
import { companyApi } from "../api/companyApi";
import { jobApi } from "../api/jobApi";
import { getImageUrl } from "../utils/urlHelper";
import { renderSalary } from "../utils/renderSalary";
import MapDisplay from "../components/MapDisplay";
import { useAuth } from "../context/AuthContext";
import CvSelectionModal from "../components/modals/CvSelectionModal";

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const roleId = Number(appUser?.RoleID || 0);
  const isCandidate = roleId === 4;
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const jobsPerPage = 5;

  useEffect(() => {
    const fetchCompanyDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await companyApi.getCompanyDetail(id);
        setCompany(response.data);
      } catch (err) {
        console.error("Lỗi tải thông tin công ty:", err);
        const errorMessage = err.response?.data?.message || "";
        if (
          errorMessage.includes("Nội dung bạn tìm không tồn tại") ||
          err.response?.status === 404
        ) {
          navigate("/content-not-found", { replace: true });
          return;
        }
        setError(errorMessage || "Không thể tải thông tin công ty.");
        toast.error(errorMessage || "Không thể tải thông tin công ty.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetail();
  }, [id, navigate]);

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      if (!id) return;
      setLoadingJobs(true);
      try {
        const response = await jobApi.getActiveJobs();
        const companyJobs = response.data.filter(
          (job) => job.CompanyID === Number(id) && job.Status === 1
        );
        setJobs(companyJobs);
      } catch (err) {
        console.error("Lỗi tải danh sách việc làm:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    if (company) {
      fetchCompanyJobs();
    }
  }, [id, company]);

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return job.JobTitle?.toLowerCase().includes(query);
  });

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getMapPosition = () => {
    if (company?.Latitude && company?.Longitude) {
      return [parseFloat(company.Latitude), parseFloat(company.Longitude)];
    }
    return null;
  };

  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;

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

    const expires = new Date(expiresAt);
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

    const diff = expiresDate.getTime() - nowDate.getTime();
    if (diff <= 0) return 0;

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleToggleSave = async (jobId, currentSaved) => {
    if (!isCandidate) return;
    setSavingId(jobId);
    try {
      if (currentSaved) {
        await jobApi.unsaveJob(jobId);
        toast.success("Đã bỏ lưu công việc.");
      } else {
        await jobApi.saveJob(jobId);
        toast.success("Đã lưu công việc.");
      }
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.JobID === jobId ? { ...job, HasSaved: !currentSaved } : job
        )
      );
    } catch (err) {
      console.error("Lỗi lưu/bỏ lưu công việc:", err);
      toast.error(
        err.response?.data?.message || "Không thể lưu/bỏ lưu công việc."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleApplyClick = (jobId) => {
    if (!isCandidate) return;
    setSelectedJobId(jobId);
    setIsCvModalOpen(true);
  };

  const handleCvSelect = async (cvId) => {
    if (!selectedJobId) return;
    setApplyingId(selectedJobId);
    try {
      const res = await jobApi.applyToJob(selectedJobId, { cvId });
      toast.success(res?.data?.message || "Ứng tuyển thành công.");
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.JobID === selectedJobId ? { ...job, HasApplied: true } : job
        )
      );
    } catch (err) {
      console.error("Lỗi apply:", err);
      toast.error(err?.response?.data?.message || "Không thể ứng tuyển.");
    } finally {
      setApplyingId(null);
      setIsCvModalOpen(false);
      setSelectedJobId(null);
    }
  };

  const handleBlockCompany = async () => {
    if (!id || !isCandidate) return;
    try {
      await companyApi.blockCompany(id);
      toast.success("Đã chặn công ty thành công.");
      navigate("/candidate/blocked-companies");
    } catch (err) {
      console.error("Lỗi chặn công ty:", err);
      toast.error(err?.response?.data?.message || "Không thể chặn công ty.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          {error || "Không tìm thấy công ty."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
        <div className="bg-gradient-to-r from-teal-600 via-emerald-500 to-green-400 h-48 sm:h-56">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white opacity-30"></div>
          <div className="relative h-full flex items-center px-6 sm:px-8">
            <div className="flex-shrink-0 mr-6 sm:mr-8">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl shadow-lg flex items-center justify-center p-4">
                {company.LogoURL ? (
                  <img
                    src={getImageUrl(company.LogoURL)}
                    alt={company.CompanyName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-3xl sm:text-4xl font-semibold">
                    {company.CompanyName?.charAt(0)?.toUpperCase() || "C"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {company.CompanyName || "—"}
                </h1>
                {company.IsCompanyVip && (
                  <FiStar className="h-5 w-5 text-yellow-300" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white">
                {company.WebsiteURL && (
                  <div className="flex items-center gap-2">
                    <FiGlobe className="h-5 w-5" />
                    <a
                      href={company.WebsiteURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {company.WebsiteURL}
                    </a>
                  </div>
                )}
                {company.CompanyEmail && (
                  <div className="flex items-center gap-2">
                    <FiMail className="h-5 w-5" />
                    <a
                      href={`mailto:${company.CompanyEmail}`}
                      className="hover:underline"
                    >
                      {company.CompanyEmail}
                    </a>
                  </div>
                )}
                {company.CompanyPhone && (
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-5 w-5" />
                    <span>{company.CompanyPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {isCandidate && (
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={handleBlockCompany}
                  className="bg-white text-red-600 px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-md"
                >
                  <FiSlash className="h-5 w-5" />
                  <span className="hidden sm:inline">Chặn công ty</span>
                  <span className="sm:hidden">Chặn</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-emerald-700 text-white px-6 py-3">
              <h2 className="text-lg font-bold">Giới thiệu công ty</h2>
            </div>
            <div className="p-6">
              <div className="text-gray-700 whitespace-pre-wrap">
                {showFullDescription
                  ? company.CompanyDescription || "Chưa có mô tả."
                  : (company.CompanyDescription || "Chưa có mô tả.").substring(
                      0,
                      300
                    )}
                {!showFullDescription &&
                  company.CompanyDescription &&
                  company.CompanyDescription.length > 300 && <span>...</span>}
              </div>
              {company.CompanyDescription &&
                company.CompanyDescription.length > 300 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    {showFullDescription ? "Thu gọn" : "Xem thêm"}
                    <FiChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showFullDescription ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-emerald-700 text-white px-6 py-3">
              <h2 className="text-lg font-bold">Tuyển dụng</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tên kiếm theo công việc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <FiSearch className="h-5 w-5" />
                  Tìm kiếm
                </button>
              </div>

              {loadingJobs ? (
                <div className="text-center text-gray-500 py-8">
                  Đang tải danh sách việc làm...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchQuery
                    ? "Không tìm thấy việc làm phù hợp."
                    : "Chưa có việc làm nào đang tuyển dụng."}
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedJobs.map((job, idx) => {
                      const hasSaved =
                        job?.HasSaved === true || Number(job?.HasSaved) === 1;
                      const hasApplied =
                        job?.HasApplied === true ||
                        Number(job?.HasApplied) === 1;
                      const daysRemaining = calculateDaysRemaining(
                        job.ExpiresAt
                      );
                      const isVip =
                        job?.IsCompanyVip === true ||
                        Number(job?.IsCompanyVip) === 1;
                      const shimmerDelay = isVip ? 2 + (idx % 3) * 0.3 : 0;

                      return (
                        <div
                          key={job.JobID}
                          onClick={(e) => {
                            if (e.target.closest("button") === null) {
                              navigate(`/jobs/${job.JobID}`);
                            }
                          }}
                          className={`rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer relative ${
                            isVip
                              ? "bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 border-yellow-400 vip-shimmer"
                              : "bg-emerald-50 border-emerald-100"
                          }`}
                          style={
                            isVip
                              ? {
                                  "--shimmer-delay": `${shimmerDelay}s`,
                                }
                              : {}
                          }
                        >
                          <div className="absolute top-3 right-3 flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                            <span>
                              {renderSalary(job.SalaryMin, job.SalaryMax)}
                            </span>
                          </div>

                          <div className="flex items-start gap-4 pr-32">
                            <div className="shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                              {job.CompanyLogoURL ? (
                                <img
                                  src={getImageUrl(job.CompanyLogoURL)}
                                  alt={job.CompanyName || "Logo"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400 text-xl font-semibold">
                                  {job.CompanyName
                                    ? job.CompanyName.charAt(0).toUpperCase()
                                    : "—"}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                                {job.JobTitle}
                              </h3>

                              <div className="text-sm text-gray-600 mb-2">
                                {job.CompanyName || "—"}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {daysRemaining !== null &&
                                  daysRemaining > 0 && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                        isVip
                                          ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      Còn {daysRemaining} ngày để ứng tuyển
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>

                          {isCandidate && (
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyClick(job.JobID);
                                }}
                                disabled={
                                  hasApplied || applyingId === job.JobID
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                  hasApplied || applyingId === job.JobID
                                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                              >
                                <FiSend className="h-3.5 w-3.5" />
                                <span>
                                  {applyingId === job.JobID
                                    ? "Đang xử lý..."
                                    : hasApplied
                                    ? "Đã ứng tuyển"
                                    : "Ứng tuyển"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSave(job.JobID, hasSaved);
                                }}
                                disabled={savingId === job.JobID}
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition ${
                                  hasSaved
                                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                                title={hasSaved ? "Bỏ yêu thích" : "Yêu thích"}
                              >
                                <FiHeart
                                  className={`h-4 w-4 ${
                                    hasSaved ? "fill-current" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-600">
                        Hiển thị {startIndex + 1} -{" "}
                        {Math.min(endIndex, filteredJobs.length)} /{" "}
                        {filteredJobs.length} việc làm
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage <= 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <FiChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage >= totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <FiChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-emerald-700 text-white px-6 py-3">
              <h2 className="text-lg font-bold">Vị trí</h2>
            </div>
            <div className="p-6 space-y-4">
              {company.Address || getMapPosition() ? (
                <>
                  {(company.City || company.Country) && (
                    <div className="text-gray-700 text-sm mb-3">
                      {company.City && (
                        <>
                          Tỉnh/Thành phố/Bang:{" "}
                          <span className="font-semibold">{company.City}</span>
                        </>
                      )}
                      {company.City && company.Country && ", "}
                      {company.Country && (
                        <>
                          Quốc gia:{" "}
                          <span className="font-semibold">
                            {company.Country}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {company.Address && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FiMapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div className="font-semibold text-gray-900">
                          Địa chỉ công ty
                        </div>
                      </div>
                      <div className="text-gray-700 text-sm ml-7 mb-3">
                        {company.Address}
                      </div>
                      {company.Address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            company.Address
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-2 ml-7"
                        >
                          Xem địa chỉ trên Google Maps
                        </a>
                      )}
                    </div>
                  )}

                  {getMapPosition() && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FiMapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                        <h3 className="font-semibold text-gray-900">Bản đồ</h3>
                      </div>
                      <div className="ml-7">
                        <MapDisplay position={getMapPosition()} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  Không có thông tin vị trí công ty
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCandidate && (
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
      )}
    </div>
  );
};

export default CompanyDetail;