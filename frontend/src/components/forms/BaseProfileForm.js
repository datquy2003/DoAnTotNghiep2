import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../api/profileApi";
import toast from "react-hot-toast";
import { FaUserCircle } from "react-icons/fa";
import { getImageUrl } from "../../utils/urlHelper";

const BaseProfileForm = () => {
  const { appUser, firebaseUser, setAppUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState(null);
  const [newBase64, setNewBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (appUser) {
      setDisplayName(appUser.DisplayName || "");
      const url = appUser.PhotoURL || firebaseUser?.photoURL;
      setPhotoURL(url);
    }
  }, [appUser, firebaseUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Đang cập nhật...");

    try {
      const finalPhotoURL = newBase64 || photoURL;
      const response = await profileApi.updateBaseProfile({
        displayName: displayName,
        photoURL: finalPhotoURL,
      });
      const updatedProfile = response.data;

      setAppUser((prev) => ({
        ...prev,
        DisplayName: updatedProfile.DisplayName,
        PhotoURL: updatedProfile.PhotoURL,
      }));

      setPhotoURL(updatedProfile.PhotoURL);
      setNewBase64(null);

      toast.success("Cập nhật thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Cập nhật thất bại.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const preview = newBase64 || getImageUrl(photoURL);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border"
            />
          ) : (
            <FaUserCircle size={96} className="text-gray-300" />
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Chọn ảnh
          </button>
        </div>

        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tên hiển thị
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
};

export default BaseProfileForm;
