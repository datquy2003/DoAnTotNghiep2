import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/firebase.config.js";
import { authApi } from "../api/authApi.js";
import apiClient from "../api/apiClient.js";
import BannedAccountModal from "../components/modals/BannedAccountModal.js";
import SessionExpiredModal from "../components/modals/SessionExpiredModal.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);
  const [isSessionExpiredOpen, setIsSessionExpiredOpen] = useState(false);

  const interceptorId = useRef(null);

  const forceLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Lỗi khi signout:", err);
    }
    setFirebaseUser(null);
    setAppUser(null);
  };

  const handleUserBanned = async () => {
    if (!isBannedModalOpen && !isSessionExpiredOpen) {
      console.warn("Tài khoản bị khóa.");
      setIsBannedModalOpen(true);
      setTimeout(() => forceLogout(), 100);
    }
  };

  const handleSessionExpired = async () => {
    if (!isSessionExpiredOpen && !isBannedModalOpen) {
      console.warn("Tài khoản không tồn tại hoặc hết phiên.");
      setIsSessionExpiredOpen(true);
      setTimeout(() => forceLogout(), 100);
    }
  };

  useEffect(() => {
    interceptorId.current = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 403) {
          const code = error.response.data?.code;
          if (code === "ACCOUNT_BANNED") {
            await handleUserBanned();
          } else if (code === "ACCOUNT_DELETED") {
            await handleSessionExpired();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorId.current !== null) {
        apiClient.interceptors.response.eject(interceptorId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setFirebaseUser(user);
        try {
          const token = await user.getIdToken();
          try {
            const response = await authApi.getMe(token);
            const userData = response.data;

            if (userData && userData.IsBanned) {
              await handleUserBanned();
              setLoading(false);
              return;
            }
            setAppUser(userData);
          } catch (error) {
            if (error.response && error.response.status === 404) {
              setAppUser(null);
            } else {
              console.error("Lỗi khi gọi getMe:", error);
            }
          }
        } catch (tokenError) {
          if (tokenError.code === "auth/user-disabled") {
            await handleUserBanned();
            setLoading(false);
            return;
          }
          if (tokenError.code === "auth/user-not-found") {
            await handleSessionExpired();
            setLoading(false);
            return;
          }
        }
      } else {
        setFirebaseUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let pollingInterval;

    if (firebaseUser) {
      pollingInterval = setInterval(async () => {
        try {
          const token = await firebaseUser.getIdToken(true);

          if (token) {
            await authApi.getMe(token);
          }
        } catch (error) {
          console.error("Polling error:", error);
          if (error.code === "auth/user-disabled") {
            await handleUserBanned();
          } else if (
            error.code === "auth/user-not-found" ||
            error.code === "auth/user-token-expired"
          ) {
            await handleSessionExpired();
          }
        }
      }, 5000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const handleCloseModal = () => {
    setIsBannedModalOpen(false);
    setIsSessionExpiredOpen(false);
    window.location.href = "/login";
  };

  const loginLocal = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/user-disabled") {
        setIsBannedModalOpen(true);
        return;
      }
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        throw new Error("Tài khoản không tồn tại hoặc mật khẩu không đúng.");
      }
      throw error;
    }
  };

  const registerLocal = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password).then(
      (userCredential) => {
        sendEmailVerification(userCredential.user);
      }
    );
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === "auth/user-disabled") {
        setIsBannedModalOpen(true);
        return;
      }
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Lỗi đăng nhập Google:", error);
      }
    }
  };

  const loginWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === "auth/user-disabled") {
        setIsBannedModalOpen(true);
        return;
      }
      if (error.code === "auth/popup-closed-by-user") {
        return;
      }
      if (error.code === "auth/account-exists-with-different-credential") {
        try {
          const email = error.customData.email;
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (!methods || methods.length === 0) {
            alert(
              "Email này hiện tại đã được chuyển giao sang cho google. Vui lòng đăng nhập bằng google."
            );
            return;
          }
        } catch (fetchError) {
          console.error("Lỗi khi kiểm tra provider:", fetchError);
          alert("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
      } else {
        console.error("Lỗi đăng nhập Facebook:", error);
      }
    }
  };

  const sendPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logout = () => {
    return signOut(auth);
  };

  const manualReloadFirebaseUser = async () => {
    if (!auth.currentUser) return null;

    try {
      await auth.currentUser.reload();
      setFirebaseUser(auth.currentUser);

      const token = await auth.currentUser.getIdToken(true);
      const response = await authApi.getMe(token);
      setAppUser(response.data);

      return auth.currentUser;
    } catch (error) {
      console.error("Lỗi khi reload user:", error);

      if (error.code === "auth/user-disabled") {
        await handleUserBanned();
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/user-token-expired"
      ) {
        await handleSessionExpired();
      } else if (error.response?.status === 404) {
        setAppUser(null);
      }

      return null;
    }
  };

  const value = {
    firebaseUser,
    appUser,
    setAppUser,
    loading,
    loginLocal,
    registerLocal,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    manualReloadFirebaseUser,
    sendPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <BannedAccountModal
        isOpen={isBannedModalOpen}
        onClose={handleCloseModal}
      />
      <SessionExpiredModal
        isOpen={isSessionExpiredOpen}
        onClose={handleCloseModal}
      />
    </AuthContext.Provider>
  );
};