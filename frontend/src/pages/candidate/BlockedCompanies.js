import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiUnlock } from "react-icons/fi";
import { companyApi } from "../../api/companyApi";
import { formatDate } from "../../utils/formatDate";

export default function BlockedCompanies() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlockedCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyApi.getBlockedCompanies();
      setCompanies(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi load blocked companies:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể tải danh sách công ty đã chặn."
      );
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedCompanies();
  }, []);

  const handleUnblock = async (companyId) => {
    setUnblockingId(companyId);
    try {
      await companyApi.unblockCompany(companyId);
      toast.success("Đã bỏ chặn công ty thành công.");
      setCompanies((prev) => prev.filter((c) => c.CompanyID !== companyId));
    } catch (err) {
      console.error("Lỗi bỏ chặn công ty:", err);
      toast.error(err?.response?.data?.message || "Không thể bỏ chặn công ty.");
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Công ty đã chặn
        </h1>
        <p className="text-gray-600">
          Bạn sẽ không thấy các bài viết từ những công ty này và các công ty đã
          bị chặn sẽ không thể thấy hồ sơ của bạn nữa.
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có công ty nào bị chặn
          </h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tên công ty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày chặn
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr
                    key={company.CompanyID}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {company.CompanyName || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {company.BlockedAt
                          ? formatDate(company.BlockedAt)
                          : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleUnblock(company.CompanyID)}
                        disabled={unblockingId === company.CompanyID}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiUnlock className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}