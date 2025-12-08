import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("UserID", sql.NVarChar, userId)
      .input("Limit", sql.Int, limit)
      .query(
        `
        SELECT TOP (@Limit)
          NotificationID,
          Message,
          LinkURL,
          Type,
          ReferenceID,
          IsRead,
          CreatedAt
        FROM Notifications
        WHERE UserID = @UserID
        ORDER BY CreatedAt DESC
      `
      );

    res.status(200).json(result.recordset || []);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Lỗi lấy thông báo." });
  }
});

router.post("/:id/read", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const { id } = req.params;

  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("NotificationID", sql.Int, id)
      .input("UserID", sql.NVarChar, userId)
      .query(
        `
        UPDATE Notifications
        SET IsRead = 1
        WHERE NotificationID = @NotificationID AND UserID = @UserID
      `
      );

    res.status(200).json({ message: "Đã đánh dấu đã đọc." });
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({ message: "Không thể cập nhật thông báo." });
  }
});

router.post("/mark-all-read", checkAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("UserID", sql.NVarChar, userId)
      .query(
        `
        UPDATE Notifications
        SET IsRead = 1
        WHERE UserID = @UserID AND IsRead = 0
      `
      );

    res.status(200).json({ message: "Đã đánh dấu tất cả thông báo." });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    res.status(500).json({ message: "Không thể cập nhật thông báo." });
  }
});

export default router;