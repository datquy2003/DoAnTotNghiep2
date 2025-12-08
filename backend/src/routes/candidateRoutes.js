import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { getMondayOfWeek } from "../config/getMondayOfWeek.js";

const router = express.Router();

router.get("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);

    const profileResult = await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .query("SELECT * FROM CandidateProfiles WHERE UserID = @UserID");

    if (profileResult.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ." });
    }

    const profile = profileResult.recordset[0];

    const specsResult = await pool
      .request()
      .input("CandidateID", sql.NVarChar, firebaseUid).query(`
        SELECT s.SpecializationID, s.SpecializationName, s.CategoryID
        FROM CandidateSpecializations cs
        JOIN Specializations s ON cs.SpecializationID = s.SpecializationID
        WHERE cs.CandidateID = @CandidateID
      `);

    profile.Specializations = specsResult.recordset;

    res.status(200).json(profile);
  } catch (error) {
    console.error("Lỗi GET /candidates/me:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

router.put("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;
  const {
    FullName,
    PhoneNumber,
    Birthday,
    Address,
    ProfileSummary,
    City,
    Country,
    IsSearchable,
    SpecializationIDs,
  } = req.body;

  if (
    SpecializationIDs &&
    Array.isArray(SpecializationIDs) &&
    SpecializationIDs.length > 5
  ) {
    return res
      .status(400)
      .json({ message: "Bạn chỉ được chọn tối đa 5 chuyên môn." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction
        .request()
        .input("UserID", sql.NVarChar, firebaseUid)
        .input("FullName", sql.NVarChar, FullName || null)
        .input("PhoneNumber", sql.NVarChar, PhoneNumber || null)
        .input("Birthday", sql.Date, Birthday || null)
        .input("Address", sql.NVarChar, Address || null)
        .input("ProfileSummary", sql.NText, ProfileSummary || null)
        .input("City", sql.NVarChar, City || null)
        .input("Country", sql.NVarChar, Country || null)
        .input("IsSearchable", sql.Bit, IsSearchable ?? 0).query(`
          MERGE INTO CandidateProfiles AS target
          USING (VALUES (@UserID)) AS source (UserID)
          ON (target.UserID = source.UserID)
          WHEN MATCHED THEN
            UPDATE SET 
              FullName = @FullName,
              PhoneNumber = @PhoneNumber,
              Birthday = @Birthday,
              Address = @Address,
              ProfileSummary = @ProfileSummary,
              City = @City,
              Country = @Country,
              IsSearchable = @IsSearchable
          WHEN NOT MATCHED BY TARGET THEN
            INSERT (UserID, FullName, PhoneNumber, Birthday, Address, ProfileSummary, City, Country, IsSearchable)
            VALUES (@UserID, @FullName, @PhoneNumber, @Birthday, @Address, @ProfileSummary, @City, @Country, @IsSearchable);
        `);

      if (SpecializationIDs && Array.isArray(SpecializationIDs)) {
        await transaction
          .request()
          .input("CandidateID", sql.NVarChar, firebaseUid)
          .query(
            "DELETE FROM CandidateSpecializations WHERE CandidateID = @CandidateID"
          );

        for (const specId of SpecializationIDs) {
          await transaction
            .request()
            .input("CandidateID", sql.NVarChar, firebaseUid)
            .input("SpecializationID", sql.Int, specId).query(`
              INSERT INTO CandidateSpecializations (CandidateID, SpecializationID)
              VALUES (@CandidateID, @SpecializationID)
            `);
        }
      }

      await transaction.commit();
      res.status(200).json({ message: "Cập nhật hồ sơ thành công." });
    } catch (transError) {
      await transaction.rollback();
      console.error("Transaction Error:", transError);
      throw transError;
    }
  } catch (error) {
    console.error("Lỗi PUT /candidates/me:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật hồ sơ." });
  }
});

router.post("/me/push-top", checkAuth, async (req, res) => {
  const candidateId = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("CandidateID", sql.NVarChar, candidateId).query(`
        SELECT 
          cp.UserID,
          cp.LastPushedAt,
          cp.PushTopCount,
          (
            SELECT TOP 1 Snapshot_PushTopDaily 
            FROM UserSubscriptions
            WHERE UserID = @CandidateID AND Status = 1 AND EndDate > GETDATE()
            ORDER BY EndDate DESC
          ) AS VipLimitDaily
        FROM CandidateProfiles cp
        WHERE cp.UserID = @CandidateID
      `);

    const profile = result.recordset[0];

    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hồ sơ để đẩy top." });
    }

    const now = new Date();
    const isVip = profile.VipLimitDaily && profile.VipLimitDaily > 0;

    if (isVip) {
      const dailyLimit = profile.VipLimitDaily;
      let currentCount = profile.PushTopCount || 0;

      if (profile.LastPushedAt) {
        const lastPush = new Date(profile.LastPushedAt);
        const nowVN = new Date(now.getTime() + 7 * 3600000);
        const lastPushVN = new Date(lastPush.getTime() + 7 * 3600000);

        if (
          lastPushVN.getUTCDate() !== nowVN.getUTCDate() ||
          lastPushVN.getUTCMonth() !== nowVN.getUTCMonth() ||
          lastPushVN.getUTCFullYear() !== nowVN.getUTCFullYear()
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

      await pool
        .request()
        .input("CandidateID", sql.NVarChar, candidateId)
        .input("NewCount", sql.Int, newCount).query(`
          UPDATE CandidateProfiles
          SET PushTopCount = @NewCount, LastPushedAt = GETDATE()
          WHERE UserID = @CandidateID
        `);

      return res.status(200).json({
        message: `Đẩy top thành công! (${newCount}/${dailyLimit} lượt hôm nay)`,
      });
    }

    if (profile.LastPushedAt) {
      const lastPushedDate = new Date(profile.LastPushedAt);

      const currentMonday = getMondayOfWeek(now);
      const lastPushMonday = getMondayOfWeek(lastPushedDate);

      if (currentMonday === lastPushMonday) {
        return res.status(403).json({
          message:
            "Tài khoản thường chỉ được đẩy top 1 lần/tuần. Vui lòng quay lại vào Thứ Hai tuần sau.",
        });
      }
    }

    await pool.request().input("CandidateID", sql.NVarChar, candidateId).query(`
        UPDATE CandidateProfiles
        SET LastPushedAt = GETDATE(), PushTopCount = 1
        WHERE UserID = @CandidateID
      `);

    return res.status(200).json({
      message: "Đẩy top thành công! (Reset vào Thứ Hai tuần sau)",
    });
  } catch (error) {
    console.error("Lỗi đẩy top hồ sơ:", error);
    res.status(500).json({ message: "Lỗi server khi đẩy top hồ sơ." });
  }
});

export default router;