import React from "react";
import { FiLock } from "react-icons/fi";

const BannedAccountModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <FiLock className="h-8 w-8 text-red-600" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Tài khoản đã bị khóa
        </h3>

        <p className="text-gray-500 mb-6">
          Tài khoản của bạn đã bị vô hiệu hóa do vi phạm chính sách hoặc theo
          yêu cầu từ quản trị viên.
          <br />
          Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.
        </p>

        <button
          onClick={onClose}
          className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm transition-colors"
        >
          Đã hiểu, quay về đăng nhập
        </button>
      </div>
    </div>
  );
};

export default BannedAccountModal;
