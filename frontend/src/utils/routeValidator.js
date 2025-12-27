export const isValidRoute = (pathname, roleId) => {
  if (!pathname || typeof pathname !== "string") return false;

  const path = pathname.split("?")[0].split("#")[0];

  const publicRoutes = [
    "/",
    "/messages",
    "/profile-edit",
    "/change-password",
    "/content-not-found",
  ];

  if (publicRoutes.includes(path)) {
    return true;
  }

  const dynamicRoutePatterns = [
    /^\/jobs\/\d+$/,
    /^\/companies\/\d+$/,
    /^\/payment\/(success|cancel)$/,
  ];

  if (dynamicRoutePatterns.some((pattern) => pattern.test(path))) {
    return true;
  }

  if (roleId === 4) {
    const candidateRoutes = [
      "/candidate/cvs",
      "/candidate/applied-jobs",
      "/candidate/favorite-jobs",
      "/candidate/blocked-companies",
      "/candidate/subscription",
    ];
    if (candidateRoutes.includes(path)) {
      return true;
    }
    if (path.startsWith("/employer/") || path.startsWith("/admin/")) {
      return false;
    }
  }

  if (roleId === 3) {
    const employerRoutes = [
      "/employer/jobs",
      "/employer/applicants",
      "/employer/subscription",
    ];
    if (employerRoutes.includes(path)) {
      return true;
    }
    if (path.startsWith("/candidate/") || path.startsWith("/admin/")) {
      return false;
    }
  }

  if (roleId === 1 || roleId === 2) {
    if (path.startsWith("/admin/")) {
      const adminRoutes = [
        "/admin/test-tools",
        "/admin/users",
        "/admin/jobs",
        "/admin/jobs-approval",
        "/admin/reports/revenue",
        "/admin/reports/new-users",
        "/admin/reports/new-posts",
        "/admin/vip-packages",
        "/admin/categories",
        "/admin/system-admins",
      ];
      if (adminRoutes.includes(path)) {
        return true;
      }
      return false;
    }
    if (path.startsWith("/candidate/") || path.startsWith("/employer/")) {
      return false;
    }
  }

  return false;
};

export const isExternalUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http://") || url.startsWith("https://");
};

export const validateRedirectUrl = (url, roleId) => {
  if (!url || typeof url !== "string") return null;

  if (isExternalUrl(url)) {
    return null;
  }

  if (!url.startsWith("/")) {
    return null;
  }

  // eslint-disable-next-line no-script-url
  if (url.includes("..") || url.includes("//") || url.includes("javascript:")) {
    return null;
  }

  const path = url.split("?")[0].split("#")[0];

  if (isValidRoute(path, roleId)) {
    return url;
  }

  return null;
};