import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { FiUnlock, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { companyApi } from "../../api/companyApi";
import { formatDate } from "../../utils/formatDate";

export default function BlockedCompanies() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);
  const [page, setPage] = useState(1);
  const companiesPerPage = 5;

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
      const remaining = companies.filter((c) => c.CompanyID !== companyId);
      const newTotalPages = Math.ceil(remaining.length / companiesPerPage);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
    } catch (err) {
      console.error("Lỗi bỏ chặn công ty:", err);
      toast.error(err?.response?.data?.message || "Không thể bỏ chặn công ty.");
    } finally {
      setUnblockingId(null);
    }
  };

  const totalPages = useMemo(() => {
    const n = Math.ceil((companies?.length || 0) / companiesPerPage);
    return Math.max(1, n);
  }, [companies, companiesPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * companiesPerPage;
    return (companies || []).slice(start, start + companiesPerPage);
  }, [companies, page, companiesPerPage]);

  const pageItems = useMemo(() => {
    const tp = totalPages;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const items = new Set([1, tp, page - 1, page, page + 1]);
    const arr = Array.from(items)
      .filter((x) => x >= 1 && x <= tp)
      .sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      out.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("…");
    }
    return out;
  }, [page, totalPages]);

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
                {paginatedCompanies.map((company) => (
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
          {companies.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
              <div className="ml-4 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * companiesPerPage + 1} -{" "}
                  {Math.min(page * companiesPerPage, companies.length)}
                </span>{" "}
                kết quả
              </div>
              {totalPages > 1 && (
                <div className="mr-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {pageItems.map((it, idx) =>
                      it === "…" ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 text-gray-500"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={`p-${it}`}
                          type="button"
                          onClick={() => setPage(Number(it))}
                          className={`min-w-9 px-3 py-2 rounded-lg border text-sm ${
                            Number(it) === page
                              ? "border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {it}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}