import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/urlHelper";
import { notificationApi } from "../api/notificationApi";
import { formatDate } from "../utils/formatDate";
import { auth } from "../firebase/firebase.config";

import {
  FiBell,
  // FiMessageSquare,
  FiChevronDown,
  FiEdit,
  FiLogOut,
  FiBriefcase,
  FiFileText,
  FiHeart,
  FiSlash,
  FiPackage,
  FiHome,
  FiClipboard,
  FiUsers,
  FiLock,
  FiStar,
} from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";

const HeaderNavLink = ({ to, children }) => {
  const activeClass = "text-blue-600 font-semibold border-b-2 border-blue-600";
  const inactiveClass = "text-gray-600 hover:text-blue-600";

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `${
          isActive ? activeClass : inactiveClass
        } h-full flex items-center px-2`
      }
    >
      {children}
    </NavLink>
  );
};

const NotificationBell = () => {
  const { appUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [sseConnected, setSseConnected] = useState(false);
  const containerRef = useRef(null);
  const sseRef = useRef(null);
  const unreadCount = items.filter((item) => !item.IsRead).length;
  const displayCount = unreadCount >= 10 ? "10+" : unreadCount;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications(10);
      setItems(res.data || []);
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupSSE = useCallback(async () => {
    if (sseRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const sseUrl = `http://localhost:8080/api/notifications/stream?token=${token}`;
      const eventSource = new EventSource(sseUrl);
      sseRef.current = eventSource;

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        if (event.data === "connected") return;

        try {
          const newNotification = JSON.parse(event.data);

          setItems((prev) => {
            const exists = prev.some(
              (item) => item.NotificationID === newNotification.NotificationID
            );
            if (exists) {
              return prev;
            }

            return [newNotification, ...prev].slice(0, 10);
          });
        } catch (error) {
          console.error("Error parsing SSE notification:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setSseConnected(false);
        setTimeout(setupSSE, 5000);
      };

      eventSource.onclose = () => {
        setSseConnected(false);
      };
    } catch (error) {
      console.error("Failed to setup SSE:", error);
    }
  }, []);

  const cleanupSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
      setSseConnected(false);
    }
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pollingIntervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    const interval = open ? 30 * 1000 : 3 * 1000;
    pollingIntervalRef.current = setInterval(fetchNotifications, interval);
  }, [fetchNotifications, open]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    setupSSE();

    if (!open) {
      startPolling();
    }

    const handleFocus = () => fetchNotifications();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    const handleRefreshEvent = () => {
      fetchNotifications();
    };
    window.addEventListener("refreshNotifications", handleRefreshEvent);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      cleanupSSE();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("refreshNotifications", handleRefreshEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    fetchNotifications,
    setupSSE,
    cleanupSSE,
    startPolling,
    stopPolling,
    open,
  ]);

  useEffect(() => {
    stopPolling();
    startPolling();
  }, [open, startPolling, stopPolling]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item.NotificationID === id ? { ...item, IsRead: true } : item
        )
      );
    } catch (error) {
      console.error("Lỗi cập nhật thông báo:", error);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, IsRead: true })));
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả thông báo:", error);
    }
  };

  const navigate = useNavigate();

  const resolveLink = (item) => {
    switch (item.Type) {
      case "JOB_STATUS_CHANGE":
        return "/employer/jobs";

      case "CANDIDATE_APPLIED":
        return "/employer/jobs";

      case "APPLICATION_SUBMITTED":
        if (item.ReferenceID && !isNaN(Number(item.ReferenceID))) {
          return `/jobs/${item.ReferenceID}`;
        }
        if (item.LinkURL && item.LinkURL.includes("/jobs/")) {
          return item.LinkURL;
        }
        return "/candidate/applied-jobs";

      case "APPLICATION_STATUS_CHANGE":
        return "/candidate/applied-jobs";

      case "VIP_PURCHASE":
        if (
          item.LinkURL &&
          (item.LinkURL.includes("/subscription") ||
            item.LinkURL === "/employer/subscription" ||
            item.LinkURL === "/candidate/subscription")
        ) {
          return item.LinkURL;
        }

        if (
          item.LinkURL &&
          (item.LinkURL.includes("/applicants") ||
            item.LinkURL.includes("/jobs/") ||
            item.LinkURL.includes("/cvs"))
        ) {
          if (appUser?.RoleID === 3) {
            return "/employer/applicants";
          }
          if (appUser?.RoleID === 4) {
            if (item.ReferenceID && !isNaN(Number(item.ReferenceID))) {
              const jobId = Number(item.ReferenceID);
              return `/jobs/${jobId}`;
            }
            if (item.LinkURL && item.LinkURL.includes("/jobs/")) {
              return item.LinkURL;
            }
            return "/candidate/applied-jobs";
          }
        }

        const msg = (item.Message || "").toLowerCase();
        const isOneTimeByMessage =
          msg.includes("tính năng") || msg.includes("trả");

        if (isOneTimeByMessage && !item.LinkURL?.includes("/subscription")) {
          if (appUser?.RoleID === 3) {
            return "/employer/applicants";
          }
          if (appUser?.RoleID === 4) {
            if (item.ReferenceID && !isNaN(Number(item.ReferenceID))) {
              const jobId = Number(item.ReferenceID);
              return `/jobs/${jobId}`;
            }
            return "/candidate/applied-jobs";
          }
        }

        return (
          item.LinkURL ||
          (appUser?.RoleID === 3
            ? "/employer/subscription"
            : "/candidate/subscription")
        );

      case "VIP_EXPIRY":
        return item.LinkURL || "/employer/subscription";

      case "VIP_ONE_TIME_PURCHASE":
        if (appUser?.RoleID === 3) {
          return "/employer/applicants";
        }
        if (appUser?.RoleID === 4) {
          if (item.ReferenceID && !isNaN(Number(item.ReferenceID))) {
            return `/jobs/${item.ReferenceID}`;
          }
          if (item.LinkURL && item.LinkURL.includes("/jobs/")) {
            return item.LinkURL;
          }
          return "/candidate/applied-jobs";
        }
        return "/employer/applicants";

      default:
        return item.LinkURL || null;
    }
  };

  const handleNavigate = (item) => {
    const target = resolveLink(item);
    if (target) {
      navigate(target);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggle}
        className="text-gray-600 hover:text-blue-600 relative flex items-center justify-center w-8 h-8"
      >
        <FiBell size={22} />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full ${
              displayCount === "10+" ? "px-1" : "px-1.5"
            }`}
          >
            {displayCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <p className="text-sm font-semibold text-gray-700">
              Thông báo gần đây
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="text-xs text-gray-600 hover:text-blue-600 disabled:opacity-60"
                title="Làm mới"
              >
                ↻
              </button>
              <button
                onClick={handleMarkAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-500 py-6 text-sm">
                Đang tải...
              </p>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">
                Chưa có thông báo nào.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.NotificationID}
                  className={`px-4 py-3 border-b last:border-b-0 ${
                    item.IsRead ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <p className="text-sm text-gray-800 whitespace-pre-line">
                    {item.Message}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(item.CreatedAt)}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      {!item.IsRead && (
                        <button
                          onClick={() => handleMarkRead(item.NotificationID)}
                          className="text-blue-600 hover:underline"
                        >
                          Đã đọc
                        </button>
                      )}
                      {item.LinkURL && (
                        <button
                          onClick={() => {
                            handleNavigate(item);
                            handleMarkRead(item.NotificationID);
                          }}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Xem
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileMenu = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { appUser, logout, firebaseUser } = useAuth();
  const dropdownRef = useRef(null);
  const isAdmin = appUser?.RoleID === 1 || appUser?.RoleID === 2;
  const isPasswordUser = firebaseUser?.providerData.some(
    (provider) => provider.providerId === "password"
  );
  const isVipUser = Boolean(appUser?.CurrentVIP);
  const vipPlanName = appUser?.CurrentVIP;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const photoToDisplay = getImageUrl(
    appUser?.PhotoURL || firebaseUser?.photoURL
  );

  return (
    <div className="flex items-center space-x-3">
      {/* {!isAdmin && (
        <Link
          to="/messages"
          className="text-gray-600 hover:text-blue-600 relative flex items-center justify-center w-8 h-8"
        >
          <FiMessageSquare size={22} />
        </Link>
      )} */}
      {!isAdmin && <NotificationBell />}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
        >
          {photoToDisplay ? (
            <img
              src={photoToDisplay}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle size={28} className="text-gray-400" />
          )}
          <div className="hidden md:flex items-center space-x-1">
            <span className="font-medium text-sm">
              {appUser?.DisplayName || "Tài khoản"}
            </span>
            {isVipUser && (
              <FiStar
                size={14}
                className="text-yellow-500"
                title={vipPlanName || "VIP"}
              />
            )}
          </div>
          <FiChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 border z-50">
            <Link
              to="/profile-edit"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsDropdownOpen(false)}
            >
              <FiEdit className="mr-2" /> Chỉnh sửa thông tin
            </Link>
            {isPasswordUser && (
              <Link
                to="/change-password"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FiLock className="mr-2" /> Đổi mật khẩu
              </Link>
            )}
            <div className="border-t my-1"></div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <FiLogOut className="mr-2" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidateHeader = () => {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center h-16 px-4">
        <div className="flex space-x-6 h-full">
          <HeaderNavLink to="/">
            <FiHome className="mr-1.5" /> Trang chủ
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/cvs">
            <FiFileText className="mr-1.5" /> Quản lý CV
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/applied-jobs">
            <FiBriefcase className="mr-1.5" /> Việc đã ứng tuyển
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/favorite-jobs">
            <FiHeart className="mr-1.5" /> Việc yêu thích
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/blocked-companies">
            <FiSlash className="mr-1.5" /> Công ty đã chặn
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/subscription">
            <FiPackage className="mr-1.5" /> Gói VIP
          </HeaderNavLink>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
};

const EmployerHeader = () => {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center h-16 px-4">
        <div className="flex space-x-6 h-full">
          <HeaderNavLink to="/">
            <FiHome className="mr-1.5" /> Trang chủ
          </HeaderNavLink>
          <HeaderNavLink to="/employer/jobs">
            <FiClipboard className="mr-1.5" /> Quản lý tin
          </HeaderNavLink>
          <HeaderNavLink to="/employer/applicants">
            <FiUsers className="mr-1.5" /> Ứng viên
          </HeaderNavLink>
          <HeaderNavLink to="/employer/subscription">
            <FiPackage className="mr-1.5" /> Gói VIP
          </HeaderNavLink>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
};

const AdminHeader = () => {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center h-16 px-4">
        <div className="flex space-x-6 h-full">
          <HeaderNavLink to="/admin/users">
            <FiHome className="mr-1.5" /> Trang chủ
          </HeaderNavLink>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
};

const Header = () => {
  const { appUser } = useAuth();

  switch (appUser?.RoleID) {
    case 4:
      return <CandidateHeader />;
    case 3:
      return <EmployerHeader />;
    case 2:
      return <AdminHeader />;
    case 1:
      return <AdminHeader />;
    default:
      return null;
  }
};

export default Header;