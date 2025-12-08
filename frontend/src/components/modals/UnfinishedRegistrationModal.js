import React from "react";
import { FiAlertCircle } from "react-icons/fi";

const UnfinishedRegistrationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
          <FiAlertCircle className="h-8 w-8 text-blue-600" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Bạn có chắc chắn muốn rời đi?
        </h3>

        <div className="text-gray-600 mb-6 text-sm text-left bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="mb-2">
            <strong>Tài khoản của bạn đã được tạo thành công.</strong>
          </p>
          <p className="mb-2">Nếu bạn thoát bây giờ:</p>
          <ul className="list-disc list-inside space-y-1 ml-1 text-gray-500">
            <li>Thông tin đăng nhập (Email/Mật khẩu) đã được lưu.</li>
            <li>
              Bạn <strong>không thể đăng ký lại</strong> bằng email này.
            </li>
            <li>
              Lần tới đăng nhập, bạn sẽ được đưa trở lại màn hình này để chọn
              vai trò.
            </li>
          </ul>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm transition-colors"
          >
            Ở lại hoàn tất
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm transition-colors"
          >
            Xác nhận rời đi
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnfinishedRegistrationModal;
