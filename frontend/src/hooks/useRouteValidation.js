import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isValidRoute } from "../utils/routeValidator";

export const useRouteValidation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser } = useAuth();

  useEffect(() => {
    const pathname = location.pathname;

    const skipValidationRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/verify-email",
      "/choose-role",
      "/content-not-found",
    ];

    if (skipValidationRoutes.includes(pathname)) {
      return;
    }

    if (appUser === undefined) {
      return;
    }

    const roleId = appUser?.RoleID;
    const isValid = isValidRoute(pathname, roleId);

    if (!isValid) {
      navigate("/content-not-found", { replace: true });
    }
  }, [location.pathname, appUser, navigate]);
};