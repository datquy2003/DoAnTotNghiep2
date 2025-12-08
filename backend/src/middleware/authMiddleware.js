import admin from "../config/firebaseAdmin.js";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";

export const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có quyền truy cập. Vui lòng cung cấp token." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decodedToken;
    try {
      const pool = await sql.connect(sqlConfig);
      const result = await pool
        .request()
        .input("FirebaseUserID", sql.NVarChar, decodedToken.uid)
        .query(
          "SELECT IsBanned FROM Users WHERE FirebaseUserID = @FirebaseUserID"
        );
      const user = result.recordset[0];
      if (user && user.IsBanned) {
        return res.status(403).json({
          message: "Tài khoản của bạn đã bị khóa.",
          code: "ACCOUNT_BANNED",
        });
      }
    } catch (dbError) {
      console.error("Lỗi kiểm tra DB trong middleware:", dbError);
    }
    next();
  } catch (error) {
    console.error("Lỗi xác thực token:", error);
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};
