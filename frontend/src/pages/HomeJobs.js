import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { jobApi } from "../api/jobApi";
import { categoryApi } from "../api/categoryApi";
import { locationApi } from "../api/locationApi";
import { renderSalary } from "../utils/renderSalary";
import CvSelectionModal from "../components/modals/CvSelectionModal";

export default function HomeJobs() {
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const roleId = Number(appUser?.RoleID || 0);
  const isCandidate = roleId === 4;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applyingId, setApplyingId] = useState(null);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [q, setQ] = useState("");
  const [categories, setCategories] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedSpecIds, setSelectedSpecIds] = useState([]);

  const [catOpen, setCatOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const catWrapperRef = useRef(null);

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const countryWrapperRef = useRef(null);
  const cityWrapperRef = useRef(null);
  const countryInputRef = useRef(null);
  const cityInputRef = useRef(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await jobApi.getActiveJobs();
      const list = Array.isArray(res?.data) ? res.data : [];
      setJobs(list);
    } catch (err) {
      console.error("Lỗi load active jobs:", err);
      toast.error(
        err?.response?.data?.message || "Không thể tải danh sách việc."
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catWrapperRef.current && !catWrapperRef.current.contains(e.target)) {
        setCatOpen(false);
      }
      if (
        countryWrapperRef.current &&
        !countryWrapperRef.current.contains(e.target)
      ) {
        setCountryOpen(false);
        setCountrySearch("");
      }
      if (
        cityWrapperRef.current &&
        !cityWrapperRef.current.contains(e.target)
      ) {
        setCityOpen(false);
        setCitySearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCatsAndSpecs = async () => {
      try {
        const [catsRes, specsRes] = await Promise.all([
          categoryApi.getCategories(),
          categoryApi.getAllSpecializations(),
        ]);
        const cats = Array.isArray(catsRes?.data) ? catsRes.data : [];
        const specs = Array.isArray(specsRes?.data) ? specsRes.data : [];
        const normalize = (s) => (s || "").toString().trim();
        const catsSorted = [...cats].sort((a, b) =>
          normalize(a.CategoryName).localeCompare(
            normalize(b.CategoryName),
            "vi",
            {
              sensitivity: "base",
            }
          )
        );
        const specsSorted = [...specs].sort((a, b) =>
          normalize(a.SpecializationName).localeCompare(
            normalize(b.SpecializationName),
            "vi",
            { sensitivity: "base" }
          )
        );
        setCategories(catsSorted);
        setSpecializations(specsSorted);
        setActiveCategoryId((prev) => {
          if (prev != null) return prev;
          return catsSorted[0]?.CategoryID ?? null;
        });
      } catch (error) {
        console.error("Lỗi lấy danh mục/chuyên môn:", error);
      }
    };
    fetchCatsAndSpecs();
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await locationApi.getCountries();
        const list = Array.isArray(res) ? res : res?.data || [];
        const sorted = [...list].sort((a, b) =>
          (a.label || "").localeCompare(b.label || "", "vi", {
            sensitivity: "base",
          })
        );
        setCountries(sorted);
      } catch (error) {
        console.error("Lỗi lấy danh sách quốc gia:", error);
      }
    };
    fetchCountries();
  }, []);

  const loadCities = async (cObj) => {
    if (!cObj) {
      setCities([]);
      return;
    }
    try {
      const isVietnam =
        (cObj.code && cObj.code.toUpperCase() === "VN") ||
        (cObj.value || "").toLowerCase().includes("viet nam") ||
        (cObj.value || "").toLowerCase().includes("vietnam");

      let list = [];
      if (isVietnam) {
        const res = await locationApi.getVietnamProvinces();
        list = Array.isArray(res) ? res : res?.data || [];
      } else {
        const res = await locationApi.getStates(cObj.value);
        list = Array.isArray(res) ? res : res?.data || [];
      }

      const sorted = [...list]
        .map((x) => (x || "").toString().trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }));
      setCities(sorted);
    } catch (error) {
      console.error("Lỗi lấy danh sách thành phố:", error);
      setCities([]);
    }
  };

  const specsByCategoryId = useMemo(() => {
    const map = new Map();
    (specializations || []).forEach((s) => {
      const cid = Number(s?.CategoryID);
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid).push(s);
    });
    return map;
  }, [specializations]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const term = countrySearch.toLowerCase();
    return (countries || []).filter((c) =>
      (c.label || "").toLowerCase().includes(term)
    );
  }, [countries, countrySearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    const term = citySearch.toLowerCase();
    return (cities || []).filter((c) => (c || "").toLowerCase().includes(term));
  }, [cities, citySearch]);

  const sorted = useMemo(() => {
    const toTime = (v) => {
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return [...(jobs || [])].sort((a, b) => {
      const lp = toTime(b.LastPushedAt) - toTime(a.LastPushedAt);
      if (lp !== 0) return lp;
      return toTime(b.CreatedAt) - toTime(a.CreatedAt);
    });
  }, [jobs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const catSet = new Set((selectedCategoryIds || []).map((x) => Number(x)));
    const specSet = new Set((selectedSpecIds || []).map((x) => Number(x)));

    const normalize = (v) => (v || "").toString().trim().toLowerCase();

    return (sorted || []).filter((j) => {
      if (term) {
        const hay = [
          j?.JobTitle,
          j?.CompanyName,
          j?.CategoryName,
          j?.SpecializationName,
          j?.Location,
          j?.CompanyCity,
          j?.CompanyCountry,
        ]
          .map(normalize)
          .filter(Boolean)
          .join(" ");
        if (!hay.includes(term)) return false;
      }

      if (catSet.size || specSet.size) {
        const jidCat = Number(j?.CategoryID);
        const jidSpec = Number(j?.SpecializationID);
        const ok =
          (catSet.size && catSet.has(jidCat)) ||
          (specSet.size && specSet.has(jidSpec));
        if (!ok) return false;
      }

      if (country) {
        const jc = normalize(j?.CompanyCountry);
        if (jc !== normalize(country)) return false;
      }
      if (city) {
        const jcity = normalize(j?.CompanyCity);
        if (jcity !== normalize(city)) return false;
      }

      return true;
    });
  }, [sorted, q, selectedCategoryIds, selectedSpecIds, country, city]);

  useEffect(() => {
    setPage(1);
  }, [q, selectedCategoryIds, selectedSpecIds, country, city]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filtered?.length || 0) / PAGE_SIZE);
    return Math.max(1, n);
  }, [filtered, PAGE_SIZE]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (filtered || []).slice(start, start + PAGE_SIZE);
  }, [filtered, page, PAGE_SIZE]);

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

  const selectedCategoryLabels = useMemo(() => {
    const byId = new Map(
      (categories || []).map((c) => [Number(c.CategoryID), c])
    );
    return (selectedCategoryIds || [])
      .map((id) => byId.get(Number(id))?.CategoryName)
      .filter(Boolean);
  }, [categories, selectedCategoryIds]);

  const selectedSpecLabels = useMemo(() => {
    const byId = new Map(
      (specializations || []).map((s) => [Number(s.SpecializationID), s])
    );
    return (selectedSpecIds || [])
      .map((id) => byId.get(Number(id))?.SpecializationName)
      .filter(Boolean);
  }, [specializations, selectedSpecIds]);

  const handleApplyClick = (jobId) => {
    if (!isCandidate) return;
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

  const handleToggleSave = async (jobId, nextSaved) => {
    if (!isCandidate) return;
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
      setJobs((prev) =>
        (prev || []).map((j) =>
          Number(j?.JobID) === Number(jobId) ? { ...j, HasSaved: nextSaved } : j
        )
      );
    } catch (err) {
      console.error("Lỗi toggle save:", err);
      toast.error(
        err?.response?.data?.message || "Không thể cập nhật yêu thích."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                Việc làm đang tuyển
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-7">
                <div className="flex w-full" ref={catWrapperRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCatOpen((o) => !o);
                      setActiveCategoryId((prev) => {
                        if (prev != null) return prev;
                        return categories[0]?.CategoryID ?? null;
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-l-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 whitespace-nowrap"
                    title="Chọn danh mục / chuyên môn"
                  >
                    <span className="text-base font-semibold">
                      Danh mục
                      {selectedCategoryIds.length || selectedSpecIds.length ? (
                        <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          {selectedCategoryIds.length + selectedSpecIds.length}
                        </span>
                      ) : null}
                    </span>
                    <FiChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FiSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Tìm theo tiêu đề, công ty, chuyên môn..."
                      className="w-full pl-10 pr-10 py-3 text-base rounded-r-xl border border-l-0 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {q.trim() ? (
                      <button
                        type="button"
                        onClick={() => setQ("")}
                        className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-800"
                        title="Xóa tìm kiếm"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {catOpen ? (
                    <div className="absolute z-30 mt-[46px] w-full max-w-[680px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="grid grid-cols-2">
                        <div className="border-r bg-gray-50 max-h-80 overflow-y-auto">
                          {(categories || []).length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">
                              Chưa có danh mục
                            </div>
                          ) : (
                            (categories || []).map((c) => {
                              const id = Number(c.CategoryID);
                              const checked = selectedCategoryIds.includes(id);
                              const active = Number(activeCategoryId) === id;
                              return (
                                <div
                                  key={c.CategoryID}
                                  onMouseEnter={() => setActiveCategoryId(id)}
                                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 ${
                                    active
                                      ? "bg-white"
                                      : "bg-gray-50 hover:bg-white"
                                  }`}
                                >
                                  <label className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setSelectedCategoryIds((prev) => {
                                          const set = new Set(prev || []);
                                          if (set.has(id)) set.delete(id);
                                          else set.add(id);
                                          return Array.from(set);
                                        });
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="truncate text-gray-800">
                                      {c.CategoryName}
                                    </span>
                                  </label>
                                  <FiChevronDown
                                    className={`h-4 w-4 text-gray-400 transform -rotate-90 ${
                                      active ? "text-gray-600" : ""
                                    }`}
                                  />
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {activeCategoryId == null ? (
                            <div className="p-3 text-sm text-gray-500">
                              Chọn danh mục để xem chuyên môn
                            </div>
                          ) : (
                            <div className="p-2">
                              {(
                                specsByCategoryId.get(
                                  Number(activeCategoryId)
                                ) || []
                              ).length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">
                                  Danh mục này chưa có chuyên môn
                                </div>
                              ) : (
                                (
                                  specsByCategoryId.get(
                                    Number(activeCategoryId)
                                  ) || []
                                ).map((s) => {
                                  const sid = Number(s.SpecializationID);
                                  const checked = selectedSpecIds.includes(sid);
                                  return (
                                    <label
                                      key={s.SpecializationID}
                                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-blue-50 cursor-pointer text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          setSelectedSpecIds((prev) => {
                                            const set = new Set(prev || []);
                                            if (set.has(sid)) set.delete(sid);
                                            else set.add(sid);
                                            return Array.from(set);
                                          });
                                        }}
                                      />
                                      <span className="text-gray-800">
                                        {s.SpecializationName}
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="text-sm text-gray-600 hover:text-gray-900"
                          onClick={() => {
                            setSelectedCategoryIds([]);
                            setSelectedSpecIds([]);
                          }}
                        >
                          Xóa chọn
                        </button>
                        <button
                          type="button"
                          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                          onClick={() => setCatOpen(false)}
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative" ref={countryWrapperRef}>
                    <div
                      className="w-full border rounded-xl px-4 py-3 bg-white flex items-center justify-between cursor-pointer gap-2"
                      onClick={() => {
                        setCountryOpen((o) => !o);
                        setTimeout(() => countryInputRef.current?.focus?.(), 0);
                      }}
                    >
                      {countryOpen ? (
                        <input
                          ref={countryInputRef}
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Tìm quốc gia..."
                          className="flex-1 border-none focus:outline-none text-base text-gray-800"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-base text-gray-800">
                          {country || "Quốc gia"}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {country ? (
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCountry("");
                              setCity("");
                              setCities([]);
                              setCountrySearch("");
                              setCitySearch("");
                              setCountryOpen(false);
                              setCityOpen(false);
                            }}
                            title="Xóa quốc gia"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        ) : null}
                        <FiChevronDown className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>

                    {countryOpen ? (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto">
                          {(filteredCountries || []).length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Không tìm thấy
                            </div>
                          ) : (
                            (filteredCountries || []).map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                                  c.label === country
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-gray-800"
                                }`}
                                onClick={() => {
                                  setCountry(c.label);
                                  setCity("");
                                  setCities([]);
                                  setCountrySearch("");
                                  setCitySearch("");
                                  setCountryOpen(false);
                                  setCityOpen(false);
                                  loadCities(c);
                                }}
                              >
                                {c.label}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative" ref={cityWrapperRef}>
                    <div
                      className={`w-full border rounded-xl px-4 py-3 bg-white flex items-center justify-between cursor-pointer gap-2 ${
                        !country ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      onClick={() => {
                        if (!country) return;
                        if (cities.length === 0) return;
                        setCityOpen((o) => !o);
                        setTimeout(() => cityInputRef.current?.focus?.(), 0);
                      }}
                    >
                      {cities.length === 0 ? (
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            if (!country) return;
                            setCity(e.target.value);
                          }}
                          placeholder="Thành phố"
                          className="w-full border-none focus:outline-none text-base text-gray-800"
                          disabled={!country}
                        />
                      ) : cityOpen ? (
                        <input
                          ref={cityInputRef}
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="Tìm thành phố..."
                          className="flex-1 border-none focus:outline-none text-base text-gray-800"
                          onClick={(e) => e.stopPropagation()}
                          disabled={!country}
                        />
                      ) : (
                        <span className="text-base text-gray-800">
                          {city || "Thành phố"}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {city ? (
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!country) return;
                              setCity("");
                              setCitySearch("");
                              setCityOpen(false);
                            }}
                            title="Xóa thành phố"
                            disabled={!country}
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        ) : null}
                        <FiChevronDown className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>

                    {cityOpen && cities.length > 0 ? (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto">
                          {(filteredCities || []).length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Không tìm thấy
                            </div>
                          ) : (
                            (filteredCities || []).map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                                  c === city
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-gray-800"
                                }`}
                                onClick={() => {
                                  setCity(c);
                                  setCitySearch("");
                                  setCityOpen(false);
                                }}
                              >
                                {c}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {selectedCategoryLabels.length ||
            selectedSpecLabels.length ||
            country ||
            city ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {selectedCategoryLabels.map((name) => (
                  <span
                    key={`cat-${name}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-800 border border-gray-200 text-sm"
                  >
                    <span className="font-semibold">Danh mục:</span> {name}
                  </span>
                ))}
                {selectedSpecLabels.map((name) => (
                  <span
                    key={`spec-${name}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-sm"
                  >
                    <span className="font-semibold">Chuyên môn:</span> {name}
                  </span>
                ))}
                {country ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm">
                    <span className="font-semibold">Quốc gia:</span> {country}
                  </span>
                ) : null}
                {city ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm">
                    <span className="font-semibold">Thành phố:</span> {city}
                  </span>
                ) : null}

                <button
                  type="button"
                  className="ml-auto text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => {
                    setQ("");
                    setSelectedCategoryIds([]);
                    setSelectedSpecIds([]);
                    setCountry("");
                    setCity("");
                    setCities([]);
                    setCountrySearch("");
                    setCitySearch("");
                    setCatOpen(false);
                    setCountryOpen(false);
                    setCityOpen(false);
                  }}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-gray-600">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
            <FiRefreshCw className="animate-spin h-5 w-5 text-blue-600" />
            <span>Đang tải danh sách việc...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-600">
          Không có tin tuyển dụng phù hợp.
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
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            /{" "}
            <span className="font-semibold text-gray-900">
              {filtered.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((j, idx) => {
              const hasApplied =
                j?.HasApplied === true || Number(j?.HasApplied) === 1;
              const hasSaved =
                j?.HasSaved === true || Number(j?.HasSaved) === 1;
              const disabled =
                !isCandidate || applyingId === j.JobID || hasApplied;
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

                    {isCandidate && (
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
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 overflow-hidden max-w-[150px]">
                      <FiBriefcase className="h-3 w-3 shrink-0" />
                      <span className="min-w-0 truncate">
                        {j.SpecializationName || "—"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 overflow-hidden max-w-[170px]">
                      <span className="min-w-0 truncate">
                        {renderSalary(j.SalaryMin, j.SalaryMax)}
                      </span>
                    </span>
                    {j.CompanyCity ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100 overflow-hidden max-w-[130px]">
                        <FiMapPin className="h-3 w-3 shrink-0" />
                        <span className="min-w-0 truncate">
                          {j.CompanyCity}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-end">
                    {isCandidate ? (
                      <button
                        type="button"
                        onClick={() => handleApplyClick(j.JobID)}
                        disabled={disabled}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        title={
                          !isCandidate
                            ? "Chỉ ứng viên mới có thể ứng tuyển"
                            : hasApplied
                            ? "Bạn đã ứng tuyển công việc này"
                            : ""
                        }
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