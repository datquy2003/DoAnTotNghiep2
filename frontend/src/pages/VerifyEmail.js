import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { FiRefreshCw, FiLogOut, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import { sendEmailVerification } from "firebase/auth";

const VerifyEmail = () => {
  const { firebaseUser, appUser, logout, manualReloadFirebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [verificationError, setVerificationError] = useState("");

  const hasSentAutoEmail = useRef(false);

  useEffect(() => {
    const autoSendEmail = async () => {
      if (!firebaseUser?.emailVerified && !hasSentAutoEmail.current) {
        try {
          hasSentAutoEmail.current = true;
          await sendEmailVerification(firebaseUser);
          toast.success("Hệ thống đã tự động gửi email xác thực.");
          setCountdown(60);
        } catch (error) {
          console.error("Lỗi gửi email tự động:", error);
        }
      }
    };

    if (firebaseUser) {
      autoSendEmail();
    }
  }, [firebaseUser]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setVerificationError("");
    try {
      await sendEmailVerification(firebaseUser);
      toast.success("Đã gửi lại email xác thực.");
      setCountdown(60);
    } catch (error) {
      if (error.code === "auth/too-many-requests") {
        toast.error("Vui lòng đợi một lát trước khi gửi lại.");
      } else {
        toast.error("Gửi email thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setVerificationError("");
    try {
      const user = await manualReloadFirebaseUser();

      if (user && user.emailVerified) {
        toast.success("Xác thực thành công!");
        window.location.reload();
      } else {
        setVerificationError(
          "Chưa xác thực thành công. Vui lòng kiểm tra lại email."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kiểm tra trạng thái.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="absolute top-6 right-6">
        <button
          onClick={logout}
          className="flex items-center text-gray-500 hover:text-red-600 transition-colors font-medium"
        >
          <FiLogOut className="mr-2" /> Đăng xuất
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
          <FiShield className="h-10 w-10 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Xác thực tài khoản Admin
        </h2>

        <div className="text-sm text-gray-500 mb-6">
          Xin chào <strong>{appUser?.DisplayName}</strong>,<br />
          Đây là yêu cầu bảo mật bắt buộc đối với Quản trị viên.
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-8 border border-gray-200">
          Hệ thống đã gửi email xác thực đến: <br />
          <strong>{firebaseUser?.email}</strong>
          <p className="mt-2 text-xs text-gray-500">
            Vui lòng kiểm tra hộp thư đến hoặc mục Spam.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
            >
              {loading ? <FiRefreshCw className="animate-spin mr-2" /> : null}
              Tôi đã xác thực xong
            </button>

            {verificationError && (
              <p className="text-red-600 text-sm mt-2 animate-fadeIn">
                {verificationError}
              </p>
            )}
          </div>

          <button
            onClick={handleResendEmail}
            disabled={loading || countdown > 0}
            className="w-full flex justify-center items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {countdown > 0
              ? `Gửi lại sau ${countdown}s`
              : "Gửi lại email xác thực"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
