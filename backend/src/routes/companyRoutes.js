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

export default router;
