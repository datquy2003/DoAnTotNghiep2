import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiFile, FiStar, FiCheckCircle } from "react-icons/fi";
import { cvApi } from "../../api/cvApi";
import toast from "react-hot-toast";

const CvSelectionModal = ({ isOpen, onClose, onSelect, jobTitle }) => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCvId, setSelectedCvId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCvs();
      setSelectedCvId(null);
    }
  }, [isOpen]);

  const loadCvs = async () => {
    setLoading(true);
    try {
      const res = await cvApi.listMyCvs();
      const cvList = res?.data?.cvs || [];
      setCvs(cvList);
      const defaultCv = cvList.find((cv) => cv.IsDefault);
      if (defaultCv) {
        setSelectedCvId(defaultCv.CVID);
      } else if (cvList.length > 0) {
        setSelectedCvId(cvList[0].CVID);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách CV:", err);
      toast.error(err.response?.data?.message || "Không thể tải danh sách CV.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedCvId) {
      toast.error("Vui lòng chọn một CV để ứng tuyển.");
      return;
    }
    onSelect(selectedCvId);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all scale-100 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Chọn CV để ứng tuyển
            </h3>
            {jobTitle && (
              <p className="text-sm text-gray-500 mt-1">{jobTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Đóng"
          >
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Đang tải danh sách CV...</div>
            </div>
          ) : cvs.length === 0 ? (
            <div className="text-center py-12">
              <FiFile className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Bạn chưa có CV nào.</p>
              <p className="text-sm text-gray-500">
                Vui lòng tải lên CV trước khi ứng tuyển.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cvs.map((cv) => {
                const isSelected = selectedCvId === cv.CVID;
                return (
                  <button
                    key={cv.CVID}
                    type="button"
                    onClick={() => setSelectedCvId(cv.CVID)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FiFile className="h-5 w-5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-900 truncate">
                            {cv.CVName || "CV không tên"}
                          </span>
                          {cv.IsDefault && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                              <FiStar className="h-3 w-3" />
                              Mặc định
                            </span>
                          )}
                        </div>
                        {cv.CreatedAt && (
                          <p className="text-xs text-gray-500">
                            Tải lên:{" "}
                            {new Date(cv.CreatedAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <FiCheckCircle className="h-6 w-6 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors focus:outline-none"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCvId || loading || cvs.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Ứng tuyển
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
};

export default CvSelectionModal;