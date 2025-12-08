import React, { useState, useEffect, useRef } from "react";
import { profileApi } from "../../api/profileApi";
import { categoryApi } from "../../api/categoryApi";
import toast from "react-hot-toast";
import { FiChevronDown, FiX, FiLoader } from "react-icons/fi";
import LocationSelector from "./LocationSelector";

const CandidateProfileForm = () => {
  const [formData, setFormData] = useState({
    FullName: "",
    PhoneNumber: "",
    Birthday: "",
    Address: "",
    City: "",
    Country: "",
    ProfileSummary: "",
    IsSearchable: false,
  });

  const [categories, setCategories] = useState([]);
  const [specsCache, setSpecsCache] = useState({});
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [selectedSpecs, setSelectedSpecs] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setInitialLoading(true);
      try {
        const [profileRes, catsRes] = await Promise.all([
          profileApi.getCandidateProfile().catch(() => ({ data: null })),
          categoryApi.getCategories().catch(() => ({ data: [] })),
        ]);

        setCategories(catsRes.data || []);

        const data = profileRes.data;
        if (data) {
          setFormData({
            FullName: data.FullName || "",
            PhoneNumber: data.PhoneNumber || "",
            Birthday: data.Birthday ? data.Birthday.split("T")[0] : "",
            Address: data.Address || "",
            City: data.City || "",
            Country: data.Country || "",
            ProfileSummary: data.ProfileSummary || "",
            IsSearchable: data.IsSearchable || false,
          });

          if (data.Specializations && Array.isArray(data.Specializations)) {
            setSelectedSpecs(data.Specializations);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
      }
    };
    initData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryHover = async (catId) => {
    setActiveCategoryId(catId);
    if (!specsCache[catId]) {
      try {
        const res = await categoryApi.getSpecializations(catId);
        setSpecsCache((prev) => ({ ...prev, [catId]: res.data }));
      } catch (err) {
        console.error("Lỗi load specs", err);
      }
    }
  };

  const toggleSpec = (spec) => {
    const isSelected = selectedSpecs.some(
      (s) => s.SpecializationID === spec.SpecializationID
    );

    if (isSelected) {
      setSelectedSpecs((prev) =>
        prev.filter((s) => s.SpecializationID !== spec.SpecializationID)
      );
    } else {
      if (selectedSpecs.length >= 5) {
        toast.error("Bạn chỉ được chọn tối đa 5 chuyên môn.");
        return;
      }
      setSelectedSpecs((prev) => [...prev, spec]);
    }
  };

  const removeSpec = (id) => {
    setSelectedSpecs((prev) => prev.filter((s) => s.SpecializationID !== id));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Đang lưu hồ sơ...");

    try {
      const dataToSubmit = {
        ...formData,
        Birthday: formData.Birthday || null,
        SpecializationIDs: selectedSpecs.map((s) => s.SpecializationID),
      };
      await profileApi.updateCandidateProfile(dataToSubmit);
      toast.success("Cập nhật hồ sơ ứng viên thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Cập nhật thất bại.", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading)
    return (
      <div className="flex justify-center p-8">
        <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">
        Hồ sơ Ứng viên
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Họ và tên
            </label>
            <input
              name="FullName"
              type="text"
              value={formData.FullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              name="PhoneNumber"
              type="tel"
              value={formData.PhoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Ngày sinh
            </label>
            <input
              name="Birthday"
              type="date"
              value={formData.Birthday}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Địa chỉ
            </label>
            <input
              name="Address"
              type="text"
              value={formData.Address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <LocationSelector
          selectedCountry={formData.Country}
          selectedCity={formData.City}
          onChange={handleLocationChange}
        />

        <div className="relative" ref={dropdownRef}>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Chuyên môn (Tối đa 5)
          </label>

          <div
            className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedSpecs.length === 0 && (
              <span className="text-gray-400 select-none">
                Chọn chuyên môn...
              </span>
            )}
            {selectedSpecs.map((spec) => (
              <span
                key={spec.SpecializationID}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {spec.SpecializationName}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSpec(spec.SpecializationID);
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-900 focus:outline-none"
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
            <div className="ml-auto">
              <FiChevronDown
                className={`text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-20 flex w-full mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xl h-72">
              <div className="w-1/3 overflow-y-auto border-r border-gray-200 bg-gray-50">
                {categories.map((cat) => (
                  <div
                    key={cat.CategoryID}
                    onMouseEnter={() => handleCategoryHover(cat.CategoryID)}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                      activeCategoryId === cat.CategoryID
                        ? "bg-white text-blue-600 font-semibold border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat.CategoryName}
                  </div>
                ))}
              </div>

              <div className="w-2/3 p-2 overflow-y-auto bg-white">
                {activeCategoryId ? (
                  specsCache[activeCategoryId] ? (
                    specsCache[activeCategoryId].length > 0 ? (
                      <div className="grid grid-cols-1 gap-1">
                        {specsCache[activeCategoryId].map((spec) => {
                          const isChecked = selectedSpecs.some(
                            (s) => s.SpecializationID === spec.SpecializationID
                          );
                          return (
                            <label
                              key={spec.SpecializationID}
                              className="flex items-center px-3 py-2 rounded cursor-pointer select-none hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={isChecked}
                                onChange={() => toggleSpec(spec)}
                              />
                              <span
                                className={`ml-3 text-sm ${
                                  isChecked
                                    ? "text-blue-700 font-medium"
                                    : "text-gray-700"
                                }`}
                              >
                                {spec.SpecializationName}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-10 text-sm text-center text-gray-400">
                        Danh mục này chưa có chuyên môn.
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-blue-500">
                      <FiLoader className="animate-spin" />
                    </div>
                  )
                ) : (
                  <div className="mt-20 text-sm text-center text-gray-400">
                    Di chuột vào danh mục bên trái để xem chuyên môn.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Giới thiệu bản thân
          </label>
          <textarea
            name="ProfileSummary"
            rows="5"
            value={formData.ProfileSummary}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="flex items-center">
          <input
            name="IsSearchable"
            type="checkbox"
            checked={formData.IsSearchable}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="block ml-2 text-sm text-gray-900">
            Cho phép nhà tuyển dụng tìm kiếm hồ sơ
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
      </form>
    </div>
  );
};

export default CandidateProfileForm;