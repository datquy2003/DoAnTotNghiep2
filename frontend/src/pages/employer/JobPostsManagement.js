import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiEye, FiEdit2, FiTrash, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import { jobApi } from "../../api/jobApi";
import { categoryApi } from "../../api/categoryApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { JOB_TYPES } from "../../constants/jobTypes";
import { EXPERIENCE_AMOUNT } from "../../constants/experienceAmount";
import { STATUS_CONFIG } from "../../constants/statusConfig";

const JobPostsManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [specMap, setSpecMap] = useState({});
  const [categories, setCategories] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [specSearch, setSpecSearch] = useState("");
  const [jobTypeSearch, setJobTypeSearch] = useState("");
  const [experienceSearch, setExperienceSearch] = useState("");
  const categoryRef = useRef(null);
  const specRef = useRef(null);
  const jobTypeRef = useRef(null);
  const experienceRef = useRef(null);
  const initialJobState = {
    JobTitle: "",
    CategoryID: "",
    SpecializationID: "",
    Location: "",
    JobType: "",
    SalaryMin: "",
    SalaryMax: "",
    Experience: "",
    JobDescription: "",
    Requirements: "",
    ExpiresAt: "",
  };
  const [newJob, setNewJob] = useState(initialJobState);

  const resetFormState = () => {
    setNewJob(initialJobState);
    setCategorySearch("");
    setSpecSearch("");
    setJobTypeSearch("");
    setExperienceSearch("");
    setCategoryOpen(false);
    setSpecOpen(false);
    setJobTypeOpen(false);
    setExperienceOpen(false);
  };

  const loadJobs = async () => {
    setRefreshing(true);
    try {
      const res = await jobApi.getMyJobs();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setJobs(list);
    } catch (error) {
      console.error("Lỗi lấy danh sách bài đăng:", error);
      const message =
        error.response?.data?.message ||
        "Không thể tải danh sách bài đăng. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sortByName = (list, key) =>
    [...list].sort((a, b) =>
      ((a?.[key] || "") + "")
        .trim()
        .localeCompare(((b?.[key] || "") + "").trim(), "vi", {
          sensitivity: "base",
        })
    );

  const loadSpecializations = async () => {
    try {
      const res = await categoryApi.getAllSpecializations();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const sorted = sortByName(list, "SpecializationName");
      setSpecializations(sorted);
      const map = {};
      sorted.forEach((item) => {
        if (item?.SpecializationID) {
          map[item.SpecializationID] = item.SpecializationName || "—";
        }
      });
      setSpecMap(map);
    } catch (error) {
      console.error("Lỗi tải chuyên môn:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const sorted = sortByName(list, "CategoryName");
      setCategories(sorted);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  useEffect(() => {
    loadJobs();
    loadSpecializations();
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
      if (specRef.current && !specRef.current.contains(e.target)) {
        setSpecOpen(false);
      }
      if (jobTypeRef.current && !jobTypeRef.current.contains(e.target)) {
        setJobTypeOpen(false);
      }
      if (experienceRef.current && !experienceRef.current.contains(e.target)) {
        setExperienceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((c) =>
      (c.CategoryName || "").toLowerCase().includes(keyword)
    );
  }, [categories, categorySearch]);

  const filteredSpecsGlobal = useMemo(() => {
    const keyword = specSearch.trim().toLowerCase();
    if (!keyword) return specializations;
    return specializations.filter((s) =>
      (s.SpecializationName || "").toLowerCase().includes(keyword)
    );
  }, [specializations, specSearch]);

  const jobTypeList = useMemo(
    () =>
      Object.entries(JOB_TYPES)
        .filter(([key]) => key !== "ALL")
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) =>
          (a.value || "").localeCompare(b.value || "", "vi", {
            sensitivity: "base",
          })
        ),
    []
  );

  const filteredJobTypes = useMemo(() => {
    const keyword = jobTypeSearch.trim().toLowerCase();
    if (!keyword) return jobTypeList;
    return jobTypeList.filter((t) =>
      (t.value || "").toLowerCase().includes(keyword)
    );
  }, [jobTypeList, jobTypeSearch]);

  const experienceList = useMemo(
    () =>
      Object.entries(EXPERIENCE_AMOUNT)
        .filter(([key]) => key !== "ALL")
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) =>
          (a.value || "").localeCompare(b.value || "", "vi", {
            sensitivity: "base",
          })
        ),
    []
  );

  const filteredExperiences = useMemo(() => {
    const keyword = experienceSearch.trim().toLowerCase();
    if (!keyword) return experienceList;
    return experienceList.filter((e) =>
      (e.value || "").toLowerCase().includes(keyword)
    );
  }, [experienceList, experienceSearch]);

  const renderSalary = (min, max) => {
    if (min == null || max == null) return "Thỏa thuận";
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const renderExpiresAt = (value) => {
    const formatted = formatDate(value);
    if (!formatted) return "—";
    const [datePart] = formatted.split(",");
    return datePart || formatted;
  };

  const detailRows = useMemo(() => {
    if (!detailJob) return [];
    return [
      { label: "Tiêu đề", value: detailJob.JobTitle },
      {
        label: "Mức lương",
        value: renderSalary(detailJob.SalaryMin, detailJob.SalaryMax),
      },
      { label: "Kinh nghiệm", value: detailJob.Experience || "—" },
      {
        label: "Chuyên môn",
        value: specMap[detailJob.SpecializationID] || "—",
      },
      { label: "Ngày hết hạn", value: renderExpiresAt(detailJob.ExpiresAt) },
      {
        label: "Trạng thái",
        value:
          STATUS_CONFIG[detailJob.Status]?.label ||
          `Trạng thái ${detailJob.Status}`,
      },
    ];
  }, [detailJob, specMap]);

  const renderAddModal = () => {
    if (!addModalOpen) return null;

    const handleInputChange = (key, value) => {
      setNewJob((prev) => ({ ...prev, [key]: value }));
    };

    const handleClose = () => {
      resetFormState();
      setAddModalOpen(false);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!newJob.JobTitle || !newJob.JobDescription || !newJob.ExpiresAt) {
        toast.error("Vui lòng nhập Tiêu đề, Mô tả và Ngày hết hạn.");
        return;
      }

      const payload = {
        ...newJob,
        CategoryID: newJob.CategoryID ? Number(newJob.CategoryID) : null,
        SpecializationID: newJob.SpecializationID
          ? Number(newJob.SpecializationID)
          : null,
        SalaryMin: newJob.SalaryMin ? Number(newJob.SalaryMin) : null,
        SalaryMax: newJob.SalaryMax ? Number(newJob.SalaryMax) : null,
        ExpiresAt: newJob.ExpiresAt,
      };

      try {
        const res = await jobApi.createJob(payload);
        toast.success("Tạo bài đăng thành công.");
        handleClose();
        setJobs((prev) => [res.data || res, ...prev]);
      } catch (error) {
        console.error("Lỗi tạo bài đăng:", error);
        const message =
          error.response?.data?.message ||
          "Không thể tạo bài đăng. Vui lòng thử lại.";
        toast.error(message);
      }
    };

    const formatSalaryDisplay = (value) => {
      if (!value) return "";
      const num = Number(value);
      if (Number.isNaN(num)) return "";
      return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 0,
      }).format(num);
    };

    const handleSalaryChange = (key, raw) => {
      const digitsOnly = raw.replace(/[^\d]/g, "");
      handleInputChange(key, digitsOnly);
    };

    const filteredSpecs = [...filteredSpecsGlobal]
      .filter((s) =>
        newJob.CategoryID ? s.CategoryID === Number(newJob.CategoryID) : true
      )
      .sort((a, b) =>
        ((a.SpecializationName || "") + "")
          .trim()
          .localeCompare(((b.SpecializationName || "") + "").trim(), "vi", {
            sensitivity: "base",
          })
      );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-white border border-gray-100 shadow-2xl rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Thêm mới bài đăng
              </h3>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-4 text-gray-700 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">Tiêu đề</span>
                  <input
                    type="text"
                    required
                    value={newJob.JobTitle}
                    onChange={(e) =>
                      handleInputChange("JobTitle", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm" ref={categoryRef}>
                  <span className="font-semibold text-gray-800">Danh mục</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="-- Chọn danh mục --"
                      value={
                        categorySearch !== ""
                          ? categorySearch
                          : categories.find(
                              (c) =>
                                String(c.CategoryID) ===
                                String(newJob.CategoryID)
                            )?.CategoryName || ""
                      }
                      onFocus={() => setCategoryOpen(true)}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setCategoryOpen(true);
                      }}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {(categorySearch !== "" || newJob.CategoryID) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("CategoryID", "");
                          handleInputChange("SpecializationID", "");
                          setCategorySearch("");
                          setSpecSearch("");
                          setSpecOpen(false);
                          setCategoryOpen(true);
                        }}
                        className="absolute inset-y-0 px-2 text-gray-400 right-2 hover:text-gray-600"
                        aria-label="Xóa danh mục"
                      >
                        ×
                      </button>
                    )}
                    {categoryOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="overflow-y-auto max-h-56">
                          {filteredCategories.map((c) => (
                            <button
                              type="button"
                              key={c.CategoryID}
                              onClick={() => {
                                handleInputChange("CategoryID", c.CategoryID);
                                handleInputChange("SpecializationID", "");
                                setCategoryOpen(false);
                                setCategorySearch(c.CategoryName || "");
                                setSpecSearch("");
                                setSpecOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                String(newJob.CategoryID) ===
                                String(c.CategoryID)
                                  ? "bg-blue-50 text-blue-700"
                                  : ""
                              }`}
                            >
                              {c.CategoryName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label className="space-y-1 text-sm" ref={specRef}>
                  <span className="font-semibold text-gray-800">
                    Chuyên môn
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        newJob.CategoryID
                          ? "-- Chọn chuyên môn --"
                          : "Chọn danh mục trước"
                      }
                      value={
                        specSearch !== ""
                          ? specSearch
                          : filteredSpecs.find(
                              (s) =>
                                String(s.SpecializationID) ===
                                String(newJob.SpecializationID)
                            )?.SpecializationName || ""
                      }
                      onFocus={() => newJob.CategoryID && setSpecOpen(true)}
                      onChange={(e) => {
                        if (!newJob.CategoryID) return;
                        setSpecSearch(e.target.value);
                        setSpecOpen(true);
                      }}
                      disabled={!newJob.CategoryID}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    {(specSearch !== "" || newJob.SpecializationID) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("SpecializationID", "");
                          setSpecSearch("");
                          setSpecOpen(!!newJob.CategoryID);
                        }}
                        className="absolute inset-y-0 px-2 text-gray-400 right-2 hover:text-gray-600"
                        aria-label="Xóa chuyên môn"
                      >
                        ×
                      </button>
                    )}
                    {specOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="overflow-y-auto max-h-56">
                          {filteredSpecs.map((s) => (
                            <button
                              type="button"
                              key={s.SpecializationID}
                              onClick={() => {
                                handleInputChange(
                                  "SpecializationID",
                                  s.SpecializationID
                                );
                                setSpecOpen(false);
                                setSpecSearch(s.SpecializationName || "");
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                String(newJob.SpecializationID) ===
                                String(s.SpecializationID)
                                  ? "bg-blue-50 text-blue-700"
                                  : ""
                              }`}
                            >
                              {s.SpecializationName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">
                    Địa điểm làm việc
                  </span>
                  <input
                    type="text"
                    value={newJob.Location}
                    onChange={(e) =>
                      handleInputChange("Location", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">
                    Vị trí công việc
                  </span>
                  <div className="relative" ref={jobTypeRef}>
                    <input
                      type="text"
                      placeholder="-- Chọn vị trí công việc --"
                      value={
                        jobTypeSearch !== ""
                          ? jobTypeSearch
                          : jobTypeList.find((t) => t.value === newJob.JobType)
                              ?.value || ""
                      }
                      onFocus={() => setJobTypeOpen(true)}
                      onChange={(e) => {
                        setJobTypeSearch(e.target.value);
                        setJobTypeOpen(true);
                      }}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {(jobTypeSearch !== "" || newJob.JobType) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("JobType", "");
                          setJobTypeSearch("");
                          setJobTypeOpen(true);
                        }}
                        className="absolute inset-y-0 px-2 text-gray-400 right-2 hover:text-gray-600"
                        aria-label="Xóa vị trí công việc"
                      >
                        ×
                      </button>
                    )}
                    {jobTypeOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="overflow-y-auto max-h-56">
                          {filteredJobTypes.map((t) => (
                            <button
                              type="button"
                              key={t.key}
                              onClick={() => {
                                handleInputChange("JobType", t.value);
                                setJobTypeOpen(false);
                                setJobTypeSearch(t.value || "");
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                newJob.JobType === t.value
                                  ? "bg-blue-50 text-blue-700"
                                  : ""
                              }`}
                            >
                              {t.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">
                    Lương tối thiểu
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatSalaryDisplay(newJob.SalaryMin)}
                    onChange={(e) =>
                      handleSalaryChange("SalaryMin", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">
                    Lương tối đa
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatSalaryDisplay(newJob.SalaryMax)}
                    onChange={(e) =>
                      handleSalaryChange("SalaryMax", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm" ref={experienceRef}>
                  <span className="font-semibold text-gray-800">
                    Kinh nghiệm
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="-- Chọn kinh nghiệm --"
                      value={
                        experienceSearch !== ""
                          ? experienceSearch
                          : experienceList.find(
                              (e) => e.value === newJob.Experience
                            )?.value || ""
                      }
                      onFocus={() => setExperienceOpen(true)}
                      onChange={(e) => {
                        setExperienceSearch(e.target.value);
                        setExperienceOpen(true);
                      }}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {(experienceSearch !== "" || newJob.Experience) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("Experience", "");
                          setExperienceSearch("");
                          setExperienceOpen(true);
                        }}
                        className="absolute inset-y-0 px-2 text-gray-400 right-2 hover:text-gray-600"
                        aria-label="Xóa kinh nghiệm"
                      >
                        ×
                      </button>
                    )}
                    {experienceOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="overflow-y-auto max-h-56">
                          {filteredExperiences.map((e) => (
                            <button
                              type="button"
                              key={e.key}
                              onClick={() => {
                                handleInputChange("Experience", e.value);
                                setExperienceOpen(false);
                                setExperienceSearch(e.value || "");
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                newJob.Experience === e.value
                                  ? "bg-blue-50 text-blue-700"
                                  : ""
                              }`}
                            >
                              {e.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">
                    Ngày hết hạn
                  </span>
                  <input
                    type="date"
                    value={newJob.ExpiresAt}
                    onChange={(e) =>
                      handleInputChange("ExpiresAt", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">Mô tả</span>
                  <textarea
                    rows={3}
                    value={newJob.JobDescription}
                    onChange={(e) =>
                      handleInputChange("JobDescription", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-gray-800">Yêu cầu</span>
                  <textarea
                    rows={3}
                    value={newJob.Requirements}
                    onChange={(e) =>
                      handleInputChange("Requirements", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                onClick={handleClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Lưu bài đăng
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!detailJob) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-white border border-gray-100 shadow-2xl rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết bài đăng
              </h3>
              <p className="text-sm text-gray-500">
                Nội dung đầy đủ sẽ được bổ sung trong bước tiếp theo.
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setDetailJob(null)}
            >
              ✕
            </button>
          </div>
          <div className="px-6 py-6 space-y-4">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-4 text-sm text-gray-800"
              >
                <span className="font-semibold text-gray-600">{row.label}</span>
                <span className="text-right">{row.value || "—"}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end px-6 py-4 border-t">
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              onClick={() => setDetailJob(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-600">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl">
          <FiRefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span>Đang tải danh sách bài đăng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý tin tuyển dụng
          </h1>
          <p className="text-gray-600">
            Danh sách các bài viết bạn đã đăng. Bạn có thể xem chi tiết, sửa
            hoặc xóa.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadJobs}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => {
              resetFormState();
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
          >
            <FiPlus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Mức lương
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Kinh nghiệm
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Chuyên môn
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Ngày hết hạn
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-sm text-center text-gray-500"
                  >
                    Chưa có bài đăng nào.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.JobID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {job.JobTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {renderSalary(job.SalaryMin, job.SalaryMax)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {job.Experience || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {specMap[job.SpecializationID] || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {renderExpiresAt(job.ExpiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          STATUS_CONFIG[job.Status]?.className ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_CONFIG[job.Status]?.label ||
                          `Trạng thái ${job.Status}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailJob(job)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <FiEye className="w-4 h-4" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() =>
                            toast("Tính năng chỉnh sửa sẽ được bổ sung sau.")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() =>
                            toast("Tính năng xóa sẽ được bổ sung sau.")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
                        >
                          <FiTrash className="w-4 h-4" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {renderAddModal()}
      {renderDetailModal()}
    </div>
  );
};

export default JobPostsManagement;