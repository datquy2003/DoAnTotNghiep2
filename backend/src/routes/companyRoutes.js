import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("OwnerUserID", sql.NVarChar, firebaseUid)
      .query("SELECT * FROM Companies WHERE OwnerUserID = @OwnerUserID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ công ty." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi GET /companies/me:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.get("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const firebaseUid = req.firebaseUser.uid;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ message: "CompanyID không hợp lệ." });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const blockedCheck = await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .input("CompanyID", sql.Int, Number(id)).query(`
        SELECT TOP 1 1 AS IsBlocked
        FROM BlockedCompanies
        WHERE UserID = @UserID AND CompanyID = @CompanyID
      `);

    if (blockedCheck.recordset.length > 0) {
      return res.status(404).json({
        message: "Nội dung bạn tìm không tồn tại, vui lòng kiểm tra lại.",
      });
    }

    const result = await pool.request().input("CompanyID", sql.Int, Number(id))
      .query(`
        SELECT 
          c.CompanyID,
          c.CompanyName,
          c.CompanyEmail,
          c.CompanyPhone,
          c.WebsiteURL,
          c.LogoURL,
          c.CompanyDescription,
          c.Address,
          c.City,
          c.Country,
          c.Latitude,
          c.Longitude,
          CASE WHEN EXISTS (
            SELECT TOP 1 1
            FROM UserSubscriptions us
            LEFT JOIN SubscriptionPlans sp ON us.PlanID = sp.PlanID
            WHERE us.UserID = c.OwnerUserID
              AND us.Status = 1
              AND us.EndDate > GETDATE()
              AND ISNULL(us.SnapshotPlanType, sp.PlanType) <> 'ONE_TIME'
              AND ISNULL(us.Snapshot_PushTopDaily, sp.Limit_PushTopDaily) > 0
          ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS IsCompanyVip
        FROM Companies c
        JOIN Users u ON u.FirebaseUserID = c.OwnerUserID
        WHERE c.CompanyID = @CompanyID
          AND ISNULL(u.IsBanned, 0) = 0
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Nội dung bạn tìm không tồn tại, vui lòng kiểm tra lại.",
      });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi GET /companies/:id:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.put("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;
  const {
    CompanyName,
    CompanyEmail,
    CompanyPhone,
    WebsiteURL,
    CompanyDescription,
    Address,
    City,
    Country,
    Latitude,
    Longitude,
    LogoURL,
  } = req.body;

  if (!CompanyName) {
    return res.status(400).json({ message: "Tên công ty là bắt buộc." });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const latValue = Latitude ? parseFloat(Latitude) : null;
    const lngValue = Longitude ? parseFloat(Longitude) : null;

    const result = await pool
      .request()
      .input("OwnerUserID", sql.NVarChar, firebaseUid)
      .input("CompanyName", sql.NVarChar, CompanyName)
      .input("CompanyEmail", sql.NVarChar, CompanyEmail || null)
      .input("CompanyPhone", sql.NVarChar, CompanyPhone || null)
      .input("WebsiteURL", sql.NVarChar, WebsiteURL || null)
      .input("LogoURL", sql.NVarChar, LogoURL || null)
      .input("CompanyDescription", sql.NText, CompanyDescription || null)
      .input("Address", sql.NVarChar, Address || null)
      .input("City", sql.NVarChar, City || null)
      .input("Country", sql.NVarChar, Country || null)
      .input("Latitude", sql.Decimal(9, 6), latValue)
      .input("Longitude", sql.Decimal(9, 6), lngValue).query(`
        MERGE INTO Companies AS target
        USING (VALUES (@OwnerUserID)) AS source (OwnerUserID)
        ON (target.OwnerUserID = source.OwnerUserID)
        WHEN MATCHED THEN
          UPDATE SET 
            CompanyName = @CompanyName,
            CompanyEmail = @CompanyEmail,
            CompanyPhone = @CompanyPhone,
            WebsiteURL = @WebsiteURL,
            LogoURL = @LogoURL,
            CompanyDescription = @CompanyDescription,
            Address = @Address,
            City = @City,
            Country = @Country,
            Latitude = @Latitude,
            Longitude = @Longitude
        WHEN NOT MATCHED BY TARGET THEN
          INSERT (OwnerUserID, CompanyName, CompanyEmail, CompanyPhone, WebsiteURL, LogoURL, CompanyDescription, Address, City, Country, Latitude, Longitude)
          VALUES (@OwnerUserID, @CompanyName, @CompanyEmail, @CompanyPhone, @WebsiteURL, @LogoURL, @CompanyDescription, @Address, @City, @Country, @Latitude, @Longitude)
        OUTPUT inserted.*;
      `);

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi PUT /companies/me:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.post("/:id/block", checkAuth, async (req, res) => {
  const { id } = req.params;
  const firebaseUid = req.firebaseUser.uid;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ message: "CompanyID không hợp lệ." });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const companyCheck = await pool
      .request()
      .input("CompanyID", sql.Int, Number(id))
      .query(
        "SELECT TOP 1 CompanyID FROM Companies WHERE CompanyID = @CompanyID"
      );

    if (companyCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy công ty." });
    }

    await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .input("CompanyID", sql.Int, Number(id)).query(`
        IF NOT EXISTS (
          SELECT 1 FROM BlockedCompanies 
          WHERE UserID = @UserID AND CompanyID = @CompanyID
        )
        BEGIN
          INSERT INTO BlockedCompanies (UserID, CompanyID)
          VALUES (@UserID, @CompanyID)
        END
      `);

    res.status(200).json({ message: "Đã chặn công ty thành công." });
  } catch (error) {
    console.error("Lỗi khi POST /companies/:id/block:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.delete("/:id/block", checkAuth, async (req, res) => {
  const { id } = req.params;
  const firebaseUid = req.firebaseUser.uid;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ message: "CompanyID không hợp lệ." });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .input("CompanyID", sql.Int, Number(id)).query(`
        DELETE FROM BlockedCompanies
        WHERE UserID = @UserID AND CompanyID = @CompanyID
      `);

    res.status(200).json({ message: "Đã bỏ chặn công ty thành công." });
  } catch (error) {
    console.error("Lỗi khi DELETE /companies/:id/block:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.get("/blocked/list", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid).query(`
        SELECT 
          c.CompanyID,
          c.CompanyName,
          c.LogoURL,
          bc.BlockedAt
        FROM BlockedCompanies bc
        INNER JOIN Companies c ON bc.CompanyID = c.CompanyID
        WHERE bc.UserID = @UserID
        ORDER BY bc.BlockedAt DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi GET /companies/blocked/list:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

export default router;