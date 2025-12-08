import React from "react";
import { FiClock } from "react-icons/fi";

const SessionExpiredModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <FiClock className="h-8 w-8 text-yellow-600" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Phiên đăng nhập hết hạn
        </h3>

        <p className="text-gray-500 mb-6">
          Thông tin tài khoản không còn khả dụng hoặc phiên làm việc của bạn đã
          kết thúc.
          <br />
          Vui lòng đăng nhập lại để tiếp tục.
        </p>

        <button
          onClick={onClose}
          className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
        >
          Đăng nhập lại
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
