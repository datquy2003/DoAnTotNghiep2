import express from "express";
import sql from "mssql";
import axios from "axios";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { uploadCV } from "../config/cloudinaryConfig.js";
import {
  DEFAULT_CV_LIMIT,
  enforceCandidateCvLimit,
  normalizeCandidateCvLimit,
} from "../services/cvStorageService.js";

const router = express.Router();
const ROLE_CANDIDATE = 4;

const roleError = () => {
  const err = new Error("Role not allowed");
  err.code = "ROLE_FORBIDDEN";
  return err;
};

const ensureCandidateRole = async (pool, userId) => {
  const result = await pool
    .request()
    .input("UserID", sql.NVarChar, userId)
    .query("SELECT TOP 1 RoleID FROM Users WHERE FirebaseUserID = @UserID");
  const roleId = result.recordset[0]?.RoleID;
  if (roleId !== ROLE_CANDIDATE) {
    throw roleError();
  }
};

const getEffectiveCvLimit = async (dbConnection, userId) => {
  const limitResult = await dbConnection
    .request()
    .input("UserID", sql.NVarChar, userId).query(`
      SELECT TOP 1 ISNULL(us.Snapshot_CVStorage, sp.Limit_CVStorage) AS LimitCV
      FROM UserSubscriptions us
      LEFT JOIN SubscriptionPlans sp ON us.PlanID = sp.PlanID
      WHERE us.UserID = @UserID AND us.Status = 1 AND us.EndDate > GETDATE()
      ORDER BY us.EndDate DESC
    `);

  const rawLimit = limitResult.recordset[0]?.LimitCV;
  return normalizeCandidateCvLimit(rawLimit ?? DEFAULT_CV_LIMIT);
};

const fetchUserCvs = async (dbConnection, userId) => {
  const result = await dbConnection
    .request()
    .input("UserID", sql.NVarChar, userId).query(`
      SELECT 
        CVID,
        CVName,
        CVFileUrl,
        IsDefault,
        IsLocked,
        CreatedAt
      FROM CVs
      WHERE UserID = @UserID
      ORDER BY IsDefault DESC, CreatedAt DESC, CVID DESC
    `);
  return result.recordset;
};

const buildQuota = (limit, cvs = []) => {
  const unlocked = cvs.filter((cv) => !cv.IsLocked).length;
  return {
    limit,
    used: unlocked,
    remaining: Math.max((limit || 0) - unlocked, 0),
    total: cvs.length,
  };
};

const fetchCvById = async (dbConnection, userId, cvId) => {
  const cvResult = await dbConnection
    .request()
    .input("UserID", sql.NVarChar, userId)
    .input("CVID", sql.Int, cvId).query(`
      SELECT TOP 1 CVID, CVName, CVFileUrl, IsLocked
      FROM CVs
      WHERE CVID = @CVID AND UserID = @UserID
    `);
  return cvResult.recordset[0];
};

router.get("/me", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);
    await ensureCandidateRole(pool, userId);

    const limit = await getEffectiveCvLimit(pool, userId);
    await enforceCandidateCvLimit(pool, userId, limit);

    const cvs = await fetchUserCvs(pool, userId);
    const quota = buildQuota(limit, cvs);
    const defaultCvId = cvs.find((cv) => cv.IsDefault)?.CVID || null;

    return res.status(200).json({ cvs, quota, defaultCvId });
  } catch (error) {
    console.error("Lỗi GET /cvs/me:", error);
    if (error.code === "ROLE_FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "Chỉ ứng viên mới được quản lý CV." });
    }
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách CV." });
  }
});

router.get("/:id/inline", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const cvId = Number(req.params.id);

  if (!cvId || Number.isNaN(cvId)) {
    return res.status(400).json({ message: "CVID không hợp lệ." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    await ensureCandidateRole(pool, userId);

    const cv = await fetchCvById(pool, userId, cvId);
    if (!cv) {
      return res.status(404).json({ message: "Không tìm thấy CV." });
    }
    if (cv.IsLocked) {
      return res.status(400).json({
        message:
          "CV này đang bị khóa do vượt quá giới hạn lưu trữ. Vui lòng xóa bớt hoặc nâng cấp gói.",
      });
    }

    const fileUrl = cv.CVFileUrl;
    if (!fileUrl) {
      return res.status(404).json({ message: "CV chưa có URL hợp lệ." });
    }

    const ext = (fileUrl.split("?")[0].split(".").pop() || "").toLowerCase();
    const isPdf = ext === "pdf";

    const fileResp = await axios.get(fileUrl, {
      responseType: "stream",
      headers: { Accept: isPdf ? "application/pdf" : "*/*" },
    });

    const upstreamType = fileResp.headers["content-type"];
    const contentType = isPdf
      ? "application/pdf"
      : upstreamType || "application/octet-stream";
    const filenameSafe =
      (cv.CVName || "cv").replace(/[^a-zA-Z0-9-_]+/g, "-") ||
      `cv-${cv.CVID || "file"}`;

    res.status(fileResp.status || 200);
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filenameSafe}.${ext || "pdf"}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (fileResp.headers["content-length"]) {
      res.setHeader("Content-Length", fileResp.headers["content-length"]);
    }

    return fileResp.data.pipe(res);
  } catch (error) {
    console.error("Lỗi GET /cvs/:id/inline:", error);
    return res
      .status(500)
      .json({ message: "Không thể tải CV để xem trực tiếp." });
  }
});

router.post("/", checkAuth, uploadCV.single("cvFile"), async (req, res) => {
  const userId = req.firebaseUser.uid;

  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng tải lên tệp CV." });
  }

  const cvUrl = req.file?.secure_url || req.file?.path || req.file?.url;
  if (!cvUrl) {
    return res
      .status(500)
      .json({ message: "Không thể lấy URL tệp CV từ Cloudinary." });
  }

  const cvNameRaw = (
    req.body?.cvName ||
    req.file.originalname ||
    "CV mới"
  ).trim();
  const cvName = cvNameRaw.substring(0, 100);
  const makeDefault =
    req.body?.makeDefault === "true" || req.body?.makeDefault === true;

  try {
    const pool = await sql.connect(sqlConfig);
    await ensureCandidateRole(pool, userId);

    const limit = await getEffectiveCvLimit(pool, userId);

    const unlockedCountResult = await pool
      .request()
      .input("UserID", sql.NVarChar, userId)
      .query(
        "SELECT COUNT(*) AS Cnt FROM CVs WHERE UserID = @UserID AND IsLocked = 0"
      );
    const unlockedCount = unlockedCountResult.recordset[0]?.Cnt || 0;

    if (limit && unlockedCount >= limit) {
      return res.status(400).json({
        message: `Bạn chỉ được lưu tối đa ${limit} CV. Vui lòng xóa bớt hoặc nâng cấp gói.`,
      });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const insertResult = await transaction
        .request()
        .input("UserID", sql.NVarChar, userId)
        .input("CVName", sql.NVarChar, cvName)
        .input("CVFileUrl", sql.NVarChar, cvUrl).query(`
          INSERT INTO CVs (UserID, CVName, CVFileUrl, IsDefault, IsLocked)
          VALUES (@UserID, @CVName, @CVFileUrl, 0, 0);
          SELECT SCOPE_IDENTITY() AS CVID;
        `);

      const newCvId = insertResult.recordset[0]?.CVID;

      const defaultCountResult = await transaction
        .request()
        .input("UserID", sql.NVarChar, userId)
        .query(
          "SELECT COUNT(*) AS DefaultCnt FROM CVs WHERE UserID = @UserID AND IsDefault = 1"
        );
      const shouldSetDefault =
        makeDefault || (defaultCountResult.recordset[0]?.DefaultCnt || 0) === 0;

      if (shouldSetDefault && newCvId) {
        await transaction
          .request()
          .input("UserID", sql.NVarChar, userId)
          .input("CVID", sql.Int, newCvId).query(`
            UPDATE CVs 
            SET IsDefault = CASE WHEN CVID = @CVID THEN 1 ELSE 0 END
            WHERE UserID = @UserID
          `);
      }

      await enforceCandidateCvLimit(transaction, userId, limit);
      await transaction.commit();
    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }

    const cvs = await fetchUserCvs(pool, userId);
    const quota = buildQuota(limit, cvs);
    const defaultCvId = cvs.find((cv) => cv.IsDefault)?.CVID || null;

    return res
      .status(201)
      .json({ message: "Tải lên CV thành công.", cvs, quota, defaultCvId });
  } catch (error) {
    console.error("Lỗi POST /cvs:", error);
    if (error.code === "ROLE_FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "Chỉ ứng viên mới được quản lý CV." });
    }
    return res
      .status(500)
      .json({ message: "Lỗi server khi tải lên hoặc lưu CV." });
  }
});

router.put("/:id/default", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const cvId = Number(req.params.id);

  if (!cvId || Number.isNaN(cvId)) {
    return res.status(400).json({ message: "CVID không hợp lệ." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    await ensureCandidateRole(pool, userId);

    const cvResult = await pool
      .request()
      .input("UserID", sql.NVarChar, userId)
      .input("CVID", sql.Int, cvId).query(`
        SELECT TOP 1 CVID, IsLocked
        FROM CVs
        WHERE CVID = @CVID AND UserID = @UserID
      `);

    const cv = cvResult.recordset[0];
    if (!cv) {
      return res.status(404).json({ message: "Không tìm thấy CV." });
    }

    if (cv.IsLocked) {
      return res.status(400).json({
        message:
          "CV này đang bị khóa do vượt quá giới hạn lưu trữ. Vui lòng xóa bớt hoặc nâng cấp gói.",
      });
    }

    const limit = await getEffectiveCvLimit(pool, userId);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction
        .request()
        .input("UserID", sql.NVarChar, userId)
        .input("CVID", sql.Int, cvId).query(`
          UPDATE CVs
          SET IsDefault = CASE WHEN CVID = @CVID THEN 1 ELSE 0 END
          WHERE UserID = @UserID
        `);

      await enforceCandidateCvLimit(transaction, userId, limit);
      await transaction.commit();
    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }

    const cvs = await fetchUserCvs(pool, userId);
    const quota = buildQuota(limit, cvs);

    return res
      .status(200)
      .json({ message: "Đã đặt CV mặc định.", cvs, quota, defaultCvId: cvId });
  } catch (error) {
    console.error("Lỗi PUT /cvs/:id/default:", error);
    if (error.code === "ROLE_FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "Chỉ ứng viên mới được quản lý CV." });
    }
    return res.status(500).json({ message: "Lỗi server khi cập nhật CV." });
  }
});

router.delete("/:id", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const cvId = Number(req.params.id);

  if (!cvId || Number.isNaN(cvId)) {
    return res.status(400).json({ message: "CVID không hợp lệ." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    await ensureCandidateRole(pool, userId);

    const cvResult = await pool
      .request()
      .input("UserID", sql.NVarChar, userId)
      .input("CVID", sql.Int, cvId).query(`
        SELECT TOP 1 CVID FROM CVs WHERE CVID = @CVID AND UserID = @UserID
      `);
    if (cvResult.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy CV." });
    }

    const usageResult = await pool.request().input("CVID", sql.Int, cvId)
      .query(`
        SELECT COUNT(*) AS UsageCount FROM Applications WHERE CVID = @CVID
      `);
    if ((usageResult.recordset[0]?.UsageCount || 0) > 0) {
      return res.status(400).json({
        message: "CV đang được dùng trong đơn ứng tuyển, không thể xóa.",
      });
    }

    const limit = await getEffectiveCvLimit(pool, userId);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction
        .request()
        .input("UserID", sql.NVarChar, userId)
        .input("CVID", sql.Int, cvId)
        .query("DELETE FROM CVs WHERE CVID = @CVID AND UserID = @UserID");

      const fallbackResult = await transaction
        .request()
        .input("UserID", sql.NVarChar, userId).query(`
          SELECT TOP 1 CVID
          FROM CVs
          WHERE UserID = @UserID AND IsLocked = 0
          ORDER BY IsDefault DESC, CreatedAt DESC, CVID DESC
        `);

      if (fallbackResult.recordset[0]?.CVID) {
        await transaction
          .request()
          .input("UserID", sql.NVarChar, userId)
          .input("CVID", sql.Int, fallbackResult.recordset[0].CVID).query(`
            UPDATE CVs
            SET IsDefault = CASE WHEN CVID = @CVID THEN 1 ELSE 0 END
            WHERE UserID = @UserID
          `);
      }

      await enforceCandidateCvLimit(transaction, userId, limit);
      await transaction.commit();
    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }

    const cvs = await fetchUserCvs(pool, userId);
    const quota = buildQuota(limit, cvs);
    const defaultCvId = cvs.find((cv) => cv.IsDefault)?.CVID || null;

    return res
      .status(200)
      .json({ message: "Đã xóa CV.", cvs, quota, defaultCvId });
  } catch (error) {
    console.error("Lỗi DELETE /cvs/:id:", error);
    if (error.code === "ROLE_FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "Chỉ ứng viên mới được quản lý CV." });
    }
    return res.status(500).json({ message: "Lỗi server khi xóa CV." });
  }
});

export default router;