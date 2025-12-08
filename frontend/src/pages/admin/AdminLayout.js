import React from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiLayers,
  FiPackage,
  FiShield,
  FiTool,
} from "react-icons/fi";

const AdminLayout = () => {
  const { appUser } = useAuth();

  if (appUser?.RoleID !== 1 && appUser?.RoleID !== 2) {
    return <Navigate to="/" />;
  }

  const isSuperAdmin = appUser?.RoleID === 2;

  const activeClass =
    "flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-medium transition-colors";
  const inactiveClass =
    "flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors";

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-100">
      <aside className="hidden w-64 bg-white border-r shadow-sm md:block">
        <div className="py-4">
          <nav className="space-y-1">
            {/* Comment từ đoạn này */}
            <div className="px-4 py-2 text-xs font-semibold tracking-wider text-yellow-600 uppercase">
              Công cụ Dev
            </div>
            <NavLink
              to="/admin/test-tools"
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              <FiTool size={20} />
              <span>Tạo User Test</span>
            </NavLink>
            {/* Tới đoạn này */}
            <div className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Người dùng & Tin
            </div>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              <FiUsers size={20} />
              <span>Quản lý người dùng</span>
            </NavLink>

            {isSuperAdmin && (
              <NavLink
                to="/admin/system-admins"
                className={({ isActive }) =>
                  isActive ? activeClass : inactiveClass
                }
              >
                <FiShield size={20} />
                <span>Quản lý admin</span>
              </NavLink>
            )}
            <NavLink
              to="/admin/jobs-approval"
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              <FiCheckCircle size={20} />
              <span>Duyệt bài tuyển dụng</span>
            </NavLink>

            <NavLink
              to="/admin/jobs"
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              <FiBriefcase size={20} />
              <span>Quản lý bài tuyển dụng</span>
            </NavLink>

            <div className="px-4 py-2 mt-6 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Hệ thống
            </div>
            <NavLink
              to="/admin/vip-packages"
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              <FiPackage size={20} />
              <span>Gói VIP</span>
            </NavLink>

            <NavLink
              to="/admin/categories"
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              <FiLayers size={20} />
              <span>Danh mục & Chuyên môn</span>
            </NavLink>
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;