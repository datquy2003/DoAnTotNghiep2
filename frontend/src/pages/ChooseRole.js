import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { FiUser, FiBriefcase } from "react-icons/fi";
import UnfinishedRegistrationModal from "../components/modals/UnfinishedRegistrationModal";
import bannerLogin from "../assets/bannerLogin.png";

const ROLE_EMPLOYER = 3;
const ROLE_CANDIDATE = 4;

const ChooseRole = () => {
  const { firebaseUser, logout, manualReloadFirebaseUser } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);

  const handleRoleSelect = async (roleID) => {
    if (!firebaseUser) {
      setError("Bạn chưa đăng nhập! Vui lòng quay lại trang đăng nhập.");
      return;
    }

    if (
      firebaseUser.providerData[0].providerId === "password" &&
      !firebaseUser.emailVerified
    ) {
      setError(
        "Vui lòng xác thực email của bạn trước khi tiếp tục. (Kiểm tra hộp thư đến)"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await firebaseUser.getIdToken();
      await authApi.registerInDb(token, roleID);

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Đã xảy ra lỗi khi chọn vai trò. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const handleVerificationCheck = async () => {
    setLoading(true);
    setError("");
    try {
      const refreshedUser = await manualReloadFirebaseUser();

      if (!refreshedUser.emailVerified) {
        setError(
          "Email vẫn chưa được xác thực. Vui lòng kiểm tra lại hộp thư."
        );
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi khi kiểm tra xác thực. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  const handleConfirmExit = async () => {
    setShowExitModal(false);
    await logout();
    navigate("/login");
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
        <div className="w-full p-10 text-center border shadow-2xl bg-inherit backdrop-blur-sm border-white/30 rounded-2xl">
          <h2 className="mb-4 text-4xl font-bold text-center text-white">
            Chỉ một bước nữa!
          </h2>
          <p className="mb-8 text-white/80">
            Hãy cho chúng tôi biết bạn tham gia với tư cách nào.
          </p>

          {firebaseUser?.providerData[0].providerId === "password" &&
            !firebaseUser.emailVerified && (
              <div
                className="p-4 mb-4 text-sm text-yellow-100 border rounded-lg bg-yellow-900/60 border-yellow-200/30"
                role="alert"
              >
                <span className="font-medium">Cảnh báo!</span> Bạn cần xác thực
                email trước khi tiếp tục. Vui lòng kiểm tra hộp thư đến của bạn.
                <button
                  onClick={handleVerificationCheck}
                  disabled={loading}
                  className="w-full py-2 mt-3 text-sm font-semibold text-white transition duration-300 ease-in-out bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading
                    ? "Đang kiểm tra..."
                    : "Tôi đã xác thực. Kiểm tra lại."}
                </button>
              </div>
            )}

          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect(ROLE_CANDIDATE)}
              disabled={loading}
              className="flex items-center justify-center w-full py-3 text-lg font-semibold text-white transition duration-300 ease-in-out bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <FiUser className="mr-2" /> Tôi là Ứng viên (Tìm việc)
            </button>

            <button
              onClick={() => handleRoleSelect(ROLE_EMPLOYER)}
              disabled={loading}
              className="flex items-center justify-center w-full py-3 text-lg font-semibold text-white transition duration-300 ease-in-out bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <FiBriefcase className="mr-2" /> Tôi là Nhà tuyển dụng (Đăng tin)
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-center text-red-300">{error}</p>
          )}

          <button
            onClick={() => setShowExitModal(true)}
            className="mt-6 text-sm text-white/80 hover:underline"
          >
            Quay lại (Đăng xuất)
          </button>
        </div>
      </div>
      <UnfinishedRegistrationModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleConfirmExit}
      />
    </div>
  );
};
export default ChooseRole;