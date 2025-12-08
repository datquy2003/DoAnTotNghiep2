import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import bannerLogin from "../assets/bannerLogin.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setMessage(
        "Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư (kể cả spam)."
      );
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Không tìm thấy tài khoản nào được đăng ký với email này.");
      } else {
        setError("Gửi email thất bại. Vui lòng thử lại.");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-gray-900"
      style={{
        backgroundImage: `url(${bannerLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-8 lg:px-12">
        <div className="w-full p-10 border shadow-2xl bg-inherit backdrop-blur-sm border-white/30 rounded-2xl">
          <h2 className="mb-8 text-4xl font-bold text-center text-white">
            Quên Mật khẩu
          </h2>

          {message && (
            <div className="p-4 mb-4 text-sm text-green-100 border rounded-lg bg-green-900/60 border-green-200/30">
              {message}
            </div>
          )}
          {error && (
            <div className="p-4 mb-4 text-sm text-red-100 border rounded-lg bg-red-900/60 border-red-200/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-medium text-white"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email đã đăng ký"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 font-semibold text-white transition duration-300 ease-in-out bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Gửi Email Đặt Lại"}
            </button>
          </form>
          <p className="mt-6 text-center text-white/70">
            Nhớ mật khẩu?{" "}
            <Link to="/login" className="font-semibold text-green-500 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;