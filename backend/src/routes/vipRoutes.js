import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const checkAdminRole = async (req, res, next) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, req.firebaseUser.uid)
      .query("SELECT RoleID FROM Users WHERE FirebaseUserID = @FirebaseUserID");

    const roleID = result.recordset[0]?.RoleID;
    if (roleID === 1 || roleID === 2) next();
    else res.status(403).json({ message: "Không có quyền truy cập." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

router.get("/", async (req, res) => {
  const { roleId } = req.query;
  try {
    const pool = await sql.connect(sqlConfig);
    let query = "SELECT * FROM SubscriptionPlans";
    const request = pool.request();

    if (roleId) {
      query += " WHERE RoleID = @RoleID";
      request.input("RoleID", sql.Int, roleId);
    }

    query += " ORDER BY PlanType DESC, Price ASC";

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy danh sách gói." });
  }
});

router.post("/", checkAuth, checkAdminRole, async (req, res) => {
  const {
    RoleID,
    PlanName,
    Price,
    DurationInDays,
    Features,
    PlanType,
    Limit_JobPostDaily,
    Limit_PushTopDaily,
    Limit_CVStorage,
    Limit_ViewApplicantCount,
    Limit_RevealCandidatePhone,
  } = req.body;

  if (!PlanName || !RoleID || !PlanType) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("RoleID", sql.Int, RoleID)
      .input("PlanName", sql.NVarChar, PlanName)
      .input("Price", sql.Decimal(18, 2), Price || 0)
      .input(
        "DurationInDays",
        sql.Int,
        PlanType === "SUBSCRIPTION" && DurationInDays > 0
          ? DurationInDays
          : null
      )
      .input("Features", sql.NText, Features || "")
      .input("PlanType", sql.NVarChar, PlanType)
      .input("Limit_JobPostDaily", sql.Int, Limit_JobPostDaily || 0)
      .input("Limit_PushTopDaily", sql.Int, Limit_PushTopDaily || 0)
      .input("Limit_CVStorage", sql.Int, Limit_CVStorage || 0)
      .input(
        "Limit_ViewApplicantCount",
        sql.Int,
        Limit_ViewApplicantCount || 0
      )
      .input(
        "Limit_RevealCandidatePhone",
        sql.Int,
        Limit_RevealCandidatePhone || 0
      ).query(`
        INSERT INTO SubscriptionPlans (
          RoleID, PlanName, Price, DurationInDays, Features, PlanType,
          Limit_JobPostDaily, Limit_PushTopDaily, Limit_CVStorage,
          Limit_ViewApplicantCount, Limit_RevealCandidatePhone
        )
        VALUES (
          @RoleID, @PlanName, @Price, @DurationInDays, @Features, @PlanType,
          @Limit_JobPostDaily, @Limit_PushTopDaily, @Limit_CVStorage,
          @Limit_ViewApplicantCount, @Limit_RevealCandidatePhone
        )
      `);
    res.status(201).json({ message: "Thêm gói thành công." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi thêm gói." });
  }
});

router.put("/:id", checkAuth, checkAdminRole, async (req, res) => {
  const { id } = req.params;
  const {
    PlanName,
    Price,
    DurationInDays,
    Features,
    PlanType,
    Limit_JobPostDaily,
    Limit_PushTopDaily,
    Limit_CVStorage,
    Limit_ViewApplicantCount,
    Limit_RevealCandidatePhone,
  } = req.body;

  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("PlanID", sql.Int, id)
      .input("PlanName", sql.NVarChar, PlanName)
      .input("Price", sql.Decimal(18, 2), Price)
      .input(
        "DurationInDays",
        sql.Int,
        PlanType === "SUBSCRIPTION" && DurationInDays > 0
          ? DurationInDays
          : null
      )
      .input("Features", sql.NText, Features)
      .input("PlanType", sql.NVarChar, PlanType)
      .input("Limit_JobPostDaily", sql.Int, Limit_JobPostDaily || 0)
      .input("Limit_PushTopDaily", sql.Int, Limit_PushTopDaily || 0)
      .input("Limit_CVStorage", sql.Int, Limit_CVStorage || 0)
      .input(
        "Limit_ViewApplicantCount",
        sql.Int,
        Limit_ViewApplicantCount || 0
      )
      .input(
        "Limit_RevealCandidatePhone",
        sql.Int,
        Limit_RevealCandidatePhone || 0
      ).query(`
        UPDATE SubscriptionPlans 
        SET PlanName = @PlanName, 
            Price = @Price, 
            DurationInDays = @DurationInDays, 
            Features = @Features,
            PlanType = @PlanType,
            Limit_JobPostDaily = @Limit_JobPostDaily,
            Limit_PushTopDaily = @Limit_PushTopDaily,
            Limit_CVStorage = @Limit_CVStorage,
            Limit_ViewApplicantCount = @Limit_ViewApplicantCount,
            Limit_RevealCandidatePhone = @Limit_RevealCandidatePhone
        WHERE PlanID = @PlanID
      `);
    res.status(200).json({ message: "Cập nhật thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật." });
  }
});

router.delete("/:id", checkAuth, checkAdminRole, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("PlanID", sql.Int, id)
      .query("DELETE FROM SubscriptionPlans WHERE PlanID = @PlanID");
    res.status(200).json({ message: "Đã xóa gói." });
  } catch (error) {
    if (error.number === 547) {
      return res
        .status(400)
        .json({ message: "Không thể xóa gói này vì đã có người sử dụng." });
    }
    res.status(500).json({ message: "Lỗi xóa gói." });
  }
});

export default router;