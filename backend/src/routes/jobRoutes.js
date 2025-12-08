import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { getMondayOfWeek } from "../config/getMondayOfWeek.js";

const router = express.Router();

router.get("/my-jobs", checkAuth, async (req, res) => {
  const employerId = req.firebaseUser.uid;
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("OwnerUserID", sql.NVarChar, employerId).query(`
        SELECT j.*, c.CompanyName 
        FROM Jobs j
        JOIN Companies c ON j.CompanyID = c.CompanyID
        WHERE c.OwnerUserID = @OwnerUserID
        ORDER BY j.LastPushedAt DESC, j.CreatedAt DESC
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Lỗi lấy danh sách job:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/:id/push-top", checkAuth, async (req, res) => {
  const { id } = req.params;
  const employerId = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input("JobID", sql.Int, id)
      .input("EmployerID", sql.NVarChar, employerId).query(`
        SELECT 
            j.JobID, j.LastPushedAt, 
            c.CompanyID, c.PushTopCount, c.LastPushResetAt,
            -- Lấy giới hạn đẩy top từ gói VIP đang kích hoạt
            (SELECT TOP 1 Snapshot_PushTopDaily 
             FROM UserSubscriptions 
             WHERE UserID = @EmployerID AND Status = 1 AND EndDate > GETDATE()
             ORDER BY EndDate DESC) as VipLimitDaily
        FROM Jobs j
        JOIN Companies c ON j.CompanyID = c.CompanyID
        WHERE j.JobID = @JobID AND c.OwnerUserID = @EmployerID
      `);

    const data = result.recordset[0];

    if (!data) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bài đăng hoặc bạn không có quyền." });
    }

    const isVip = data.VipLimitDaily && data.VipLimitDaily > 0;
    const now = new Date();

    if (isVip) {
      const dailyLimit = data.VipLimitDaily;
      let currentCount = data.PushTopCount || 0;

      if (data.LastPushResetAt) {
        const lastReset = new Date(data.LastPushResetAt);
        const nowVN = new Date(now.getTime() + 7 * 3600000);
        const lastResetVN = new Date(lastReset.getTime() + 7 * 3600000);

        if (
          lastResetVN.getUTCDate() !== nowVN.getUTCDate() ||
          lastResetVN.getUTCMonth() !== nowVN.getUTCMonth() ||
          lastResetVN.getUTCFullYear() !== nowVN.getUTCFullYear()
        ) {
          currentCount = 0;
        }
      } else {
        currentCount = 0;
      }

      if (currentCount >= dailyLimit) {
        return res.status(403).json({
          message: `Bạn đã dùng hết ${currentCount}/${dailyLimit} lượt đẩy top trong ngày hôm nay. Vui lòng quay lại vào ngày mai.`,
        });
      }

      const newCount = currentCount + 1;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        await transaction
          .request()
          .input("CompanyID", sql.Int, data.CompanyID)
          .input("NewCount", sql.Int, newCount).query(`
                    UPDATE Companies 
                    SET PushTopCount = @NewCount, LastPushResetAt = GETDATE() 
                    WHERE CompanyID = @CompanyID
                `);

        await transaction
          .request()
          .input("JobID", sql.Int, id)
          .query(
            "UPDATE Jobs SET LastPushedAt = GETDATE() WHERE JobID = @JobID"
          );

        await transaction.commit();
        return res.status(200).json({
          message: `Đẩy top thành công! (${newCount}/${dailyLimit} lượt hôm nay)`,
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } else {
      if (data.LastPushedAt) {
        const lastPushedDate = new Date(data.LastPushedAt);

        const currentMonday = getMondayOfWeek(now);
        const lastPushMonday = getMondayOfWeek(lastPushedDate);

        if (currentMonday === lastPushMonday) {
          return res.status(403).json({
            message:
              "Tài khoản thường chỉ được đẩy top 1 lần/tuần. Vui lòng quay lại vào Thứ Hai tuần sau.",
          });
        }
      }

      await pool
        .request()
        .input("JobID", sql.Int, id)
        .query("UPDATE Jobs SET LastPushedAt = GETDATE() WHERE JobID = @JobID");

      return res
        .status(200)
        .json({ message: "Đẩy top thành công! (Reset vào Thứ Hai tuần sau)" });
    }
  } catch (error) {
    console.error("Lỗi đẩy top job:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;