import React from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiHome } from "react-icons/fi";

export default function ContentNotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4 overflow-hidden">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <FiSearch className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Không thể tìm thấy nội dung bạn tìm kiếm
          </h1>
          <p className="text-gray-600">
            Nội dung bạn đang tìm kiếm có thể đã bị xóa, chuyển đi hoặc không
            tồn tại.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiHome className="h-5 w-5" />
            <span>Về trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
}