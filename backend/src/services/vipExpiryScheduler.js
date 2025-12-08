import sql from "mssql";
import { sqlConfig } from "../config/db.js";

const CHECK_INTERVAL_MS = 1 * 60 * 1000;
const NOTIF_TYPE = "VIP_EXPIRY";

const buildMessage = (planName, endDate) => {
  const end = new Date(endDate);
  const timeString = end.toLocaleString("vi-VN", { timeZone: "UTC" });
  return `Gói \"${planName}\" của bạn sẽ hết hạn vào ${timeString}.`;
};

const getLinkForRole = (roleId) =>
  roleId === 3 ? "/employer/subscription" : "/candidate/subscription";

export const runVipExpiryCheck = async () => {
  const pool = await sql.connect(sqlConfig);
  const result = await pool.request().query(`
    SELECT 
      us.SubscriptionID,
      us.UserID,
      us.EndDate,
      sp.PlanName,
      sp.RoleID,
      sp.DurationInDays,
      DATEDIFF(MINUTE, GETDATE(), us.EndDate) AS MinutesLeft,
      DATEDIFF(HOUR, GETDATE(), us.EndDate) AS HoursLeft
    FROM UserSubscriptions us
    JOIN SubscriptionPlans sp ON us.PlanID = sp.PlanID
    WHERE us.Status = 1
      AND (sp.PlanType IS NULL OR sp.PlanType <> 'ONE_TIME')
      AND (
        (sp.DurationInDays <= 1 AND DATEDIFF(MINUTE, GETDATE(), us.EndDate) BETWEEN 0 AND 120)
        OR (sp.DurationInDays > 1 AND DATEDIFF(HOUR, GETDATE(), us.EndDate) BETWEEN 0 AND 24)
      )
      AND NOT EXISTS (
        SELECT 1 FROM Notifications n
        WHERE n.UserID = us.UserID
          AND n.Type = '${NOTIF_TYPE}'
          AND n.ReferenceID = CAST(us.SubscriptionID AS NVARCHAR(128))
      )
  `);

  const rows = result.recordset || [];
  for (const row of rows) {
    await pool
      .request()
      .input("UserID", sql.NVarChar, row.UserID)
      .input("Message", sql.NVarChar, buildMessage(row.PlanName, row.EndDate))
      .input("LinkURL", sql.NVarChar, getLinkForRole(row.RoleID))
      .input("Type", sql.NVarChar, NOTIF_TYPE)
      .input(
        "ReferenceID",
        sql.NVarChar,
        row.SubscriptionID?.toString() || null
      )
      .query(
        `
        INSERT INTO Notifications (UserID, Message, LinkURL, Type, ReferenceID)
        VALUES (@UserID, @Message, @LinkURL, @Type, @ReferenceID)
      `
      );
  }
};

export const startVipExpiryScheduler = () => {
  if (process.env.DISABLE_VIP_EXPIRY_NOTIFIER === "true") {
    return;
  }

  setTimeout(() => {
    runVipExpiryCheck().catch((err) =>
      console.error("VIP notifier error:", err)
    );
  }, 10 * 1000);

  setInterval(() => {
    runVipExpiryCheck().catch((err) =>
      console.error("VIP notifier error:", err)
    );
  }, CHECK_INTERVAL_MS);
};