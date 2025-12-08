import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import bannerLogin from "../assets/bannerLogin.png";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { registerLocal } = useAuth();
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    try {
      await registerLocal(email, password);
    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setError("Email này đã được sử dụng.");
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại.");
      }
    }
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
            Tạo tài khoản
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
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
                placeholder="Nhập email của bạn"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium text-white"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 text-sm font-medium text-white"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

          {error && <p className="text-sm text-center text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 font-semibold text-white transition duration-300 ease-in-out bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Đăng ký
          </button>
          </form>

          <p className="mt-6 text-center text-white/70">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold text-green-500 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;