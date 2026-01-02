import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { createVipExpiryNotification } from "./notificationService.js";

const CHECK_INTERVAL_MS = 1 * 60 * 1000;

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
      us.SnapshotPlanName,
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
          AND n.Type = 'VIP_EXPIRY'
          AND n.ReferenceID = CAST(us.SubscriptionID AS NVARCHAR(128))
      )
  `);

  const rows = result.recordset || [];
  for (const row of rows) {
    try {
      await createVipExpiryNotification(row.UserID, row);
    } catch (error) {
      console.error("Error creating VIP expiry notification:", error);
    }
  }

  await pool.request().query(`
    UPDATE UserSubscriptions
    SET Status = 2
    WHERE EndDate <= GETDATE()
      AND Status = 1
  `);
};

export const startVipExpiryScheduler = () => {
  if (process.env.DISABLE_VIP_EXPIRY_NOTIFIER === "true") {
    return;
  }

  setTimeout(() => {
    runVipExpiryCheck().catch((err) =>
      console.error("VIP expiry check error:", err)
    );
  }, 10 * 1000);

  setInterval(() => {
    runVipExpiryCheck().catch((err) =>
      console.error("VIP expiry check error:", err)
    );
  }, CHECK_INTERVAL_MS);
};