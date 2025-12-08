import React, { useState, useEffect } from "react";
import { categoryApi } from "../../api/categoryApi";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiList,
  FiX,
  FiSave,
  FiSearch,
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
      setSpecs(specs.filter((s) => s.SpecializationID !== id));
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

  const filteredSpecs = specs
    .filter((s) =>
      s.SpecializationName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.SpecializationName.localeCompare(b.SpecializationName));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h3 className="flex items-center text-lg font-bold text-gray-800">
            <FiList className="mr-2" /> Chuyên môn thuộc:{" "}
            <span className="ml-1 text-blue-600">{category.CategoryName}</span>
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleAddSpec} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nhập tên chuyên môn mới..."
              className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={newSpecName}
              onChange={(e) => setNewSpecName(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !newSpecName.trim()}
              className="flex-shrink-0 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang thêm..." : "Thêm"}
            </button>
          </form>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm chuyên môn..."
              className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute text-gray-400 left-3 top-3" />
          </div>

          <div className="space-y-2">
            {filteredSpecs.length > 0 ? (
              filteredSpecs.map((spec) => (
                <div
                  key={spec.SpecializationID}
                  className="flex items-center justify-between p-3 transition-all border border-gray-100 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm"
                >
                  {editingSpecId === spec.SpecializationID ? (
                    <div className="flex items-center flex-1 gap-2">
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
                      <span className="font-medium text-gray-700">
                        {spec.SpecializationName}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(spec)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() =>
                            confirmDeleteSpec(spec.SpecializationID)
                          }
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="py-4 italic text-center text-gray-400">
                {searchTerm
                  ? "Không tìm thấy kết quả."
                  : "Chưa có chuyên môn nào."}
              </p>
            )}
          </div>
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
      <div className="w-full max-w-md bg-white shadow-2xl rounded-xl animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {categoryToEdit ? "Sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tên danh mục
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 mb-4 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên danh mục..."
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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

  const filteredCategories = categories
    .filter((c) =>
      c.CategoryName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.CategoryName.localeCompare(b.CategoryName));

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <h1 className="flex items-center text-2xl font-bold text-gray-800">
            <span className="mr-2 text-blue-600" /> Quản lý Danh mục
          </h1>
          <div className="flex items-center w-full gap-4 md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute text-gray-400 left-3 top-3" />
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCatModalOpen(true);
              }}
              className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 whitespace-nowrap"
            >
              <FiPlus className="mr-2" /> Thêm mới
            </button>
          </div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Tên Danh Mục
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    Chuyên môn
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <tr
                      key={cat.CategoryID}
                      className="transition-colors hover:bg-gray-50 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {cat.CategoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCategoryForSpecs(cat)}
                          className="flex items-center justify-center mx-auto text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FiList className="mr-1" /> Quản lý chuyên môn
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
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