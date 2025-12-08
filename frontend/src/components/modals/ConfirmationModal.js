import React from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = false,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md overflow-hidden transition-all transform scale-100 bg-white shadow-2xl rounded-xl">
        <div className="p-6 text-center">
          <div
            className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
              isDanger ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            {isDanger ? (
              <FiAlertTriangle className="w-8 h-8 text-red-600" />
            ) : (
              <FiInfo className="w-8 h-8 text-blue-600" />
            )}
          </div>

          <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>

          <p className="mb-6 text-sm text-gray-500">{message}</p>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm focus:outline-none ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;