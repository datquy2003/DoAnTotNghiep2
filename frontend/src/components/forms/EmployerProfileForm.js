import React, { useState, useEffect, useRef } from "react";
import { profileApi } from "../../api/profileApi";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/urlHelper";
import MapDisplay from "../MapDisplay";
import LocationSelector from "./LocationSelector";

const EmployerProfileForm = () => {
  const [formData, setFormData] = useState({
    CompanyName: "",
    CompanyEmail: "",
    CompanyPhone: "",
    WebsiteURL: "",
    CompanyDescription: "",
    Address: "",
    City: "",
    Country: "",
    Latitude: null,
    Longitude: null,
    LogoURL: null,
  });

  const [newBase64Logo, setNewBase64Logo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mapPosition, setMapPosition] = useState(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const response = await profileApi.getCompanyProfile();
        if (response.data) {
          setFormData({
            ...response.data,
            Latitude: response.data.Latitude || null,
            Longitude: response.data.Longitude || null,
          });
          if (response.data.Latitude && response.data.Longitude) {
            setMapPosition([
              parseFloat(response.data.Latitude),
              parseFloat(response.data.Longitude),
            ]);
          }
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          toast.error("Lỗi tải thông tin công ty.");
        }
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBase64Logo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeocode = async (e) => {
    e.preventDefault();
    if (!formData.Address) {
      toast.error("Vui lòng nhập địa chỉ trước khi xác minh.");
      return;
    }
    setGeoLoading(true);
    const toastId = toast.loading("Đang tìm địa chỉ...");

    try {
      const response = await profileApi.geocodeAddress(formData.Address);
      const { lat, lng } = response.data;

      if (lat && lng) {
        setFormData((prev) => ({
          ...prev,
          Latitude: lat,
          Longitude: lng,
        }));
        setMapPosition([lat, lng]);
        toast.success("Đã tìm thấy toạ độ!", { id: toastId });
      } else {
        setFormData((prev) => ({
          ...prev,
          Latitude: null,
          Longitude: null,
        }));
        setMapPosition(null);
        toast.error("Không tìm thấy địa chỉ.", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Lỗi máy chủ Geocoding. Vui lòng thử lại.", { id: toastId });
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Đang cập nhật...");

    try {
      const finalLogoURL = newBase64Logo || formData.LogoURL;
      const response = await profileApi.updateCompanyProfile({
        ...formData,
        LogoURL: finalLogoURL,
      });
      const updatedCompany = response.data;
      setFormData(updatedCompany);
      setNewBase64Logo(null);
      toast.success("Cập nhật thông tin công ty thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div>Đang tải hồ sơ công ty...</div>;

  const logoPreview = newBase64Logo || getImageUrl(formData.LogoURL);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Thông tin Công ty</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <img
            src={logoPreview || "https://via.placeholder.com/150"}
            alt="Logo"
            className="object-contain w-24 h-24 p-1 border"
          />
          <input
            type="file"
            accept="image/*"
            ref={logoInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => logoInputRef.current.click()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Chọn logo
          </button>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tên công ty
          </label>
          <input
            name="CompanyName"
            type="text"
            value={formData.CompanyName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email công ty
            </label>
            <input
              name="CompanyEmail"
              type="email"
              value={formData.CompanyEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Điện thoại công ty
            </label>
            <input
              name="CompanyPhone"
              type="tel"
              value={formData.CompanyPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            name="WebsiteURL"
            type="url"
            value={formData.WebsiteURL || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Địa chỉ
          </label>
          <div className="flex space-x-2">
            <input
              name="Address"
              type="text"
              value={formData.Address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Nhập địa chỉ đầy đủ (số, đường, phường/xã, quận/huyện...)"
            />
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geoLoading}
              className="flex-shrink-0 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {geoLoading ? "Đang tìm..." : "Xác minh"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Vĩ độ (Latitude)
            </label>
            <input
              name="Latitude"
              type="number"
              value={formData.Latitude || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Kinh độ (Longitude)
            </label>
            <input
              name="Longitude"
              type="number"
              value={formData.Longitude || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
              readOnly
            />
          </div>
        </div>

        {mapPosition && <MapDisplay position={mapPosition} />}

        <LocationSelector
          selectedCountry={formData.Country}
          selectedCity={formData.City}
          onChange={handleLocationChange}
        />

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Mô tả công ty
          </label>
          <textarea
            name="CompanyDescription"
            rows="5"
            value={formData.CompanyDescription}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu thông tin"}
        </button>
      </form>
    </div>
  );
};

export default EmployerProfileForm;