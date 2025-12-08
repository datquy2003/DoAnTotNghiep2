import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/me/base", checkAuth, async (req, res) => {
  const { displayName, photoURL } = req.body;
  const firebaseUid = req.firebaseUser.uid;

  if (!displayName) {
    return res.status(400).json({ message: "DisplayName là bắt buộc." });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, firebaseUid)
      .input("DisplayName", sql.NVarChar, displayName)
      .input("PhotoURL", sql.NVarChar, photoURL || null).query(`
          UPDATE Users 
          SET 
            DisplayName = @DisplayName, 
            PhotoURL = @PhotoURL, 
            UpdatedAt = GETDATE()
          WHERE FirebaseUserID = @FirebaseUserID;

          SELECT DisplayName, PhotoURL 
          FROM Users 
          WHERE FirebaseUserID = @FirebaseUserID;
        `);

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi cập nhật /users/me/base:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

export default router;
