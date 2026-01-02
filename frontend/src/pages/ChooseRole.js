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
      className="relative min-h-screen flex items-center justify-center bg-gray-900"
      style={{
        backgroundImage: `url(${bannerLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-8 lg:px-12">
        <div className="bg-inherit backdrop-blur-sm border border-white/30 p-10 rounded-2xl shadow-2xl w-full text-center">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            Chỉ một bước nữa!
          </h2>
          <p className="text-white/80 mb-8">
            Hãy cho chúng tôi biết bạn tham gia với tư cách nào.
          </p>

          {firebaseUser?.providerData[0].providerId === "password" &&
            !firebaseUser.emailVerified && (
              <div
                className="p-4 mb-4 text-sm text-yellow-100 rounded-lg bg-yellow-900/60 border border-yellow-200/30"
                role="alert"
              >
                <span className="font-medium">Cảnh báo!</span> Bạn cần xác thực
                email trước khi tiếp tục. Vui lòng kiểm tra hộp thư đến của bạn.
                <button
                  onClick={handleVerificationCheck}
                  disabled={loading}
                  className="mt-3 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out font-semibold text-sm disabled:opacity-50"
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
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition duration-300 ease-in-out font-semibold text-lg disabled:opacity-50 flex justify-center items-center"
            >
              <FiUser className="mr-2" /> Tôi là Ứng viên
            </button>

            <button
              onClick={() => handleRoleSelect(ROLE_EMPLOYER)}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 transition duration-300 ease-in-out font-semibold text-lg disabled:opacity-50 flex justify-center items-center"
            >
              <FiBriefcase className="mr-2" /> Tôi là Nhà tuyển dụng
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-300 text-center mt-4">{error}</p>
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