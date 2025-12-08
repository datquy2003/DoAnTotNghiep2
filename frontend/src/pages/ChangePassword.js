import React, { useState } from "react";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { FiLock, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";

const ChangePassword = () => {
  const { firebaseUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      await updatePassword(firebaseUser, newPassword);

      toast.success("Đổi mật khẩu thành công!", { id: toastId });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        toast.error("Mật khẩu hiện tại không đúng.", { id: toastId });
      } else if (error.code === "auth/requires-recent-login") {
        toast.error(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đổi mật khẩu.",
          { id: toastId }
        );
      } else {
        toast.error("Đổi mật khẩu thất bại. Vui lòng thử lại.", {
          id: toastId,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto mt-10 bg-white shadow-md rounded-xl">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-3 bg-blue-100 rounded-full h-14 w-14">
          <FiLock className="text-blue-600 h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Đổi Mật Khẩu</h2>
        <p className="mt-1 text-sm text-center text-gray-500">
          Để bảo mật, vui lòng nhập mật khẩu hiện tại của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Mật khẩu mới
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center"
        >
          {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
        </button>
      </form>

      <div className="flex items-start p-3 mt-6 border border-yellow-100 rounded-lg bg-yellow-50">
        <FiAlertTriangle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-700">
          Lưu ý: Sau khi đổi mật khẩu thành công, bạn có thể cần đăng nhập lại
          trên các thiết bị khác.
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;