// Đây là 1 file test để tạo mới các user có email không tồn tại mặc định verified để phục vụ cho việc test các tính năng của users sau này
import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import admin from "../config/firebaseAdmin.js";

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

router.post("/create-user", checkAuth, checkAdminRole, async (req, res) => {
  const { email, password, displayName, roleID } = req.body;

  if (!email || !password || !roleID) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, userRecord.uid)
        .input("Email", sql.NVarChar, email)
        .input("DisplayName", sql.NVarChar, displayName)
        .input("RoleID", sql.Int, roleID)
        .input("IsVerified", sql.Bit, 1).query(`
          INSERT INTO Users (FirebaseUserID, Email, DisplayName, RoleID, IsVerified, CreatedAt, UpdatedAt)
          VALUES (@FirebaseUserID, @Email, @DisplayName, @RoleID, 1, GETDATE(), GETDATE())
        `);

      if (roleID == 4) {
        await transaction
          .request()
          .input("UserID", sql.NVarChar, userRecord.uid)
          .input("FullName", sql.NVarChar, displayName).query(`
            INSERT INTO CandidateProfiles (UserID, FullName, ProfileSummary)
            VALUES (@UserID, @FullName, N'Đây là tài khoản thử nghiệm được tạo tự động.')
          `);
      } else if (roleID == 3) {
        await transaction
          .request()
          .input("OwnerUserID", sql.NVarChar, userRecord.uid)
          .input("CompanyName", sql.NVarChar, displayName + " Corp").query(`
            INSERT INTO Companies (OwnerUserID, CompanyName, CompanyDescription)
            VALUES (@OwnerUserID, @CompanyName, N'Công ty thử nghiệm được tạo tự động.')
          `);
      }

      await transaction.commit();
      res
        .status(201)
        .json({ message: "Tạo Test User thành công!", uid: userRecord.uid });
    } catch (sqlError) {
      await transaction.rollback();
      await admin.auth().deleteUser(userRecord.uid);
      throw sqlError;
    }
  } catch (error) {
    console.error("Lỗi tạo test user:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ message: "Email đã tồn tại." });
    }
    res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;