import React, { useState, useEffect, useMemo } from "react";
import { categoryApi } from "../../api/categoryApi";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiList,
  FiX,
  FiSave,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const ManageSpecsModal = ({ category, onClose }) => {
  const [specs, setSpecs] = useState([]);
  const [newSpecName, setNewSpecName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const specsPerPage = 5;
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const fetchSpecs = async () => {
    try {
      const res = await categoryApi.getSpecializations(category.CategoryID);
      setSpecs(res.data);
    } catch (error) {
      toast.error("Lỗi tải danh sách chuyên môn.");
    }
  };

  useEffect(() => {
    fetchSpecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleAddSpec = async (e) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;
    setLoading(true);
    try {
      await categoryApi.createSpecialization({
        CategoryID: category.CategoryID,
        SpecializationName: newSpecName,
      });
      toast.success("Thêm chuyên môn thành công!");
      setNewSpecName("");
      fetchSpecs();
    } catch (error) {
      toast.error("Lỗi thêm chuyên môn.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteSpec = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Chuyên Môn",
      message:
        "Bạn có chắc chắn muốn xóa chuyên môn này không? Hành động này không thể hoàn tác.",
      isDanger: true,
      confirmText: "Xóa vĩnh viễn",
      onConfirm: () => performDeleteSpec(id),
    });
  };

  const performDeleteSpec = async (id) => {
    try {
      await categoryApi.deleteSpecialization(id);
      toast.success("Đã xóa.");
      const updated = specs.filter((s) => s.SpecializationID !== id);
      setSpecs(updated);
      const newTotalPages = Math.ceil(updated.length / specsPerPage);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi xóa chuyên môn.";
      toast.error(msg);
    }
  };

  const startEdit = (spec) => {
    setEditingSpecId(spec.SpecializationID);
    setEditingName(spec.SpecializationName);
  };

  const saveEdit = async (id) => {
    try {
      await categoryApi.updateSpecialization(id, {
        SpecializationName: editingName,
      });
      toast.success("Cập nhật thành công");
      setEditingSpecId(null);
      fetchSpecs();
    } catch (error) {
      toast.error("Lỗi cập nhật.");
    }
  };

  const filteredSpecs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return specs
      .filter((s) => s.SpecializationName.toLowerCase().includes(term))
      .sort((a, b) => a.SpecializationName.localeCompare(b.SpecializationName));
  }, [specs, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredSpecs?.length || 0) / specsPerPage);
    return Math.max(1, n);
  }, [filteredSpecs, specsPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedSpecs = useMemo(() => {
    const start = (page - 1) * specsPerPage;
    return (filteredSpecs || []).slice(start, start + specsPerPage);
  }, [filteredSpecs, page, specsPerPage]);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <FiList className="mr-2" /> Chuyên môn thuộc:{" "}
            <span className="text-blue-600 ml-1">{category.CategoryName}</span>
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleAddSpec} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nhập tên chuyên môn mới..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newSpecName}
              onChange={(e) => setNewSpecName(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !newSpecName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex-shrink-0"
            >
              {loading ? "Đang thêm..." : "Thêm"}
            </button>
          </form>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm chuyên môn..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>

          <div className="space-y-2">
            {paginatedSpecs.length > 0 ? (
              paginatedSpecs.map((spec) => (
                <div
                  key={spec.SpecializationID}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                >
                  {editingSpecId === spec.SpecializationID ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        className="flex-1 px-2 py-1 border rounded"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <button
                        onClick={() => saveEdit(spec.SpecializationID)}
                        className="text-green-600"
                      >
                        <FiSave />
                      </button>
                      <button
                        onClick={() => setEditingSpecId(null)}
                        className="text-gray-500"
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-700 font-medium">
                        {spec.SpecializationName}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(spec)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() =>
                            confirmDeleteSpec(spec.SpecializationID)
                          }
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4 italic">
                {searchTerm
                  ? "Không tìm thấy kết quả."
                  : "Chưa có chuyên môn nào."}
              </p>
            )}
          </div>
          {filteredSpecs.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 pb-2 border-t border-gray-200 mt-4">
              <div className="ml-0 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * specsPerPage + 1} -{" "}
                  {Math.min(page * specsPerPage, filteredSpecs.length)}
                </span>{" "}
                trong tổng số {filteredSpecs.length} kết quả
              </div>
              {totalPages > 1 && (
                <div className="mr-0 flex items-center gap-2">
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
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
};

const CategoryModal = ({ categoryToEdit, onClose, onSuccess }) => {
  const [name, setName] = useState(
    categoryToEdit ? categoryToEdit.CategoryName : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (categoryToEdit) {
        await categoryApi.updateCategory(categoryToEdit.CategoryID, {
          CategoryName: name,
        });
        toast.success("Cập nhật thành công!");
      } else {
        await categoryApi.createCategory({ CategoryName: name });
        toast.success("Tạo mới thành công!");
      }
      onSuccess();
    } catch (error) {
      toast.error("Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {categoryToEdit ? "Sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên danh mục
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên danh mục..."
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu lại"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const categoriesPerPage = 10;

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryForSpecs, setSelectedCategoryForSpecs] =
    useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getCategories();
      setCategories(res.data);
      setPage(1);
    } catch (error) {
      toast.error("Lỗi tải danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Danh Mục",
      message:
        "Hành động này sẽ xóa danh mục và TẤT CẢ chuyên môn bên trong. Bạn có chắc chắn không?",
      isDanger: true,
      confirmText: "Xóa vĩnh viễn",
      onClose: () => setConfirmModal({ ...confirmModal, isOpen: false }),
      onConfirm: async () => {
        try {
          await categoryApi.deleteCategory(id);
          toast.success("Đã xóa danh mục.");
          fetchCategories();
        } catch (error) {
          const msg = error.response?.data?.message || "Xóa thất bại.";
          toast.error(msg);
        }
      },
    });
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categories
      .filter((c) => c.CategoryName.toLowerCase().includes(term))
      .sort((a, b) => a.CategoryName.localeCompare(b.CategoryName));
  }, [categories, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredCategories?.length || 0) / categoriesPerPage);
    return Math.max(1, n);
  }, [filteredCategories, categoriesPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * categoriesPerPage;
    return (filteredCategories || []).slice(start, start + categoriesPerPage);
  }, [filteredCategories, page, categoriesPerPage]);

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="mr-2 text-blue-600" /> Quản lý Danh mục
          </h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCatModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
            >
              <FiPlus className="mr-2" /> Thêm mới
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên Danh Mục
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chuyên môn
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCategories.length > 0 ? (
                  paginatedCategories.map((cat) => (
                    <tr
                      key={cat.CategoryID}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {cat.CategoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedCategoryForSpecs(cat)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto hover:underline"
                        >
                          <FiList className="mr-1" /> Quản lý chuyên môn
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsCatModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Sửa danh mục"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.CategoryID)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "Không tìm thấy kết quả."
                        : "Chưa có danh mục nào."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {filteredCategories.length > 0 && (
            <div className="flex flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200">
              <div className="ml-4 text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * categoriesPerPage + 1} -{" "}
                  {Math.min(
                    page * categoriesPerPage,
                    filteredCategories.length
                  )}
                </span>{" "}
                trong tổng số {filteredCategories.length} kết quả
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
      </div>

      {isCatModalOpen && (
        <CategoryModal
          categoryToEdit={editingCategory}
          onClose={() => setIsCatModalOpen(false)}
          onSuccess={() => {
            setIsCatModalOpen(false);
            fetchCategories();
          }}
        />
      )}

      {selectedCategoryForSpecs && (
        <ManageSpecsModal
          category={selectedCategoryForSpecs}
          onClose={() => setSelectedCategoryForSpecs(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />
    </>
  );
};

export default CategoryManagement;