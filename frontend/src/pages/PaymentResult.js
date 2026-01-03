import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentApi } from "../api/paymentApi";
import { useAuth } from "../context/AuthContext";
import { validateRedirectUrl } from "../utils/routeValidator";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { manualReloadFirebaseUser, appUser } = useAuth();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Đang kết nối tới máy chủ...");
  const [countdown, setCountdown] = useState(5);
  const [redirectUrl, setRedirectUrl] = useState(null);

  const sessionId = searchParams.get("session_id");
  const planId = searchParams.get("plan_id");
  const returnUrl = searchParams.get("return_url");

  const handleRedirect = useCallback(
    (fallback) => {
      const roleId = appUser?.RoleID;

      if (returnUrl) {
        const validUrl = validateRedirectUrl(returnUrl, roleId);
        if (validUrl) {
          navigate(validUrl, { replace: true });
        } else {
          navigate("/content-not-found", { replace: true });
        }
        return;
      }

      if (fallback) {
        const validUrl = validateRedirectUrl(fallback, roleId);
        if (validUrl) {
          navigate(validUrl, { replace: true });
        } else {
          navigate("/content-not-found", { replace: true });
        }
        return;
      }

      if (roleId === 3) {
        navigate("/employer/subscription", { state: { reload: true } });
      } else if (roleId === 4) {
        navigate("/candidate/subscription", { state: { reload: true } });
      } else {
        navigate("/");
      }
    },
    [returnUrl, navigate, appUser?.RoleID]
  );

  const isCalled = useRef(false);

  useEffect(() => {
    const verify = async () => {
      if (isCalled.current) return;
      isCalled.current = true;

      if (!sessionId || !planId) {
        setStatus("error");
        setMessage("Thiếu thông tin giao dịch. Vui lòng liên hệ hỗ trợ.");
        return;
      }

      try {
        setMessage("Đang xác thực giao dịch với Stripe...");
        const res = await paymentApi.verifyPayment(sessionId, planId);

        await manualReloadFirebaseUser();

        setStatus("success");
        setMessage("Thanh toán thành công! Gói dịch vụ đã được kích hoạt.");
        if (res.data?.redirectUrl) {
          setRedirectUrl(res.data.redirectUrl);
        }
      } catch (error) {
        console.error("Lỗi verify:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Xác thực thanh toán thất bại. Vui lòng liên hệ hỗ trợ."
        );
      }
    };

    if (window.location.pathname.includes("success")) {
      verify();
    } else {
      setStatus("error");
      setMessage("Bạn đã hủy giao dịch.");
    }
  }, [sessionId, planId, manualReloadFirebaseUser, handleRedirect]);

  useEffect(() => {
    let timer;
    if (status === "success") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleRedirect(redirectUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, redirectUrl]);

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-fadeIn">
        {status === "processing" && (
          <>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
              <FiLoader className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Đang xử lý...
            </h2>
            <p className="text-gray-600 text-sm">{message}</p>
            <p className="text-xs text-gray-400 mt-4">
              Vui lòng không tắt trình duyệt.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <FiCheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thành công!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-blue-500 mb-6 font-medium">
              Tự động quay lại trang gói dịch vụ sau {countdown}s...
            </p>
            <button
              onClick={() => handleRedirect()}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              Quay về
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <FiXCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thất bại</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;