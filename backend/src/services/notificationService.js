import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import { JOB_STATUS } from "../constants/jobStatus.js";
import { APPLICATION_STATUS } from "../constants/applicationStatus.js";

let broadcastNotification = null;

export const setBroadcastFunction = (broadcastFn) => {
  broadcastNotification = broadcastFn;
};

const formatCurrencyVN = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0);

export const createNotification = async ({
  userId,
  message,
  type,
  linkUrl = null,
  referenceId = null,
}) => {
  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input("UserID", sql.NVarChar, userId)
      .input("Message", sql.NVarChar, message)
      .input("LinkURL", sql.NVarChar, linkUrl)
      .input("Type", sql.NVarChar, type)
      .input("ReferenceID", sql.NVarChar, referenceId).query(`
        INSERT INTO Notifications (UserID, Message, LinkURL, Type, ReferenceID)
        OUTPUT INSERTED.*
        VALUES (@UserID, @Message, @LinkURL, @Type, @ReferenceID)
      `);

    const notification = result.recordset[0];

    if (broadcastNotification && notification) {
      try {
        broadcastNotification(notification);
      } catch (error) {
        console.error("Error broadcasting notification:", error);
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const createVipPurchaseNotification = async (
  userId,
  plan,
  metadata = {}
) => {
  const money = formatCurrencyVN(plan.SnapshotPrice || plan.Price) + "₫";

  const isOneTime = plan.PlanType === "ONE_TIME" || !plan.DurationInDays;
  const jobId = metadata.jobId;

  let message;
  let linkUrl;
  let referenceId;

  if (isOneTime && jobId) {
    const jobTitle = metadata.jobTitle || "công việc";
    message = `Bạn đã trả ${money} để sử dụng tính năng "${plan.PlanName}" xem danh sách ứng viên đã ứng tuyển vào công việc "${jobTitle}".`;
    linkUrl = `/jobs/${jobId}`;
    referenceId = jobId.toString();
  } else if (isOneTime) {
    const candidateId = metadata.candidateId;
    let candidateName = metadata.candidateName || null;

    if (candidateId && !candidateName && plan.RoleID === 3) {
      try {
        const pool = await sql.connect(sqlConfig);
        const candidateRes = await pool
          .request()
          .input("CandidateID", sql.NVarChar, candidateId).query(`
            SELECT TOP 1
              u.DisplayName,
              cp.FullName
            FROM Users u
            LEFT JOIN CandidateProfiles cp ON u.FirebaseUserID = cp.UserID
            WHERE u.FirebaseUserID = @CandidateID
          `);
        const candidate = candidateRes.recordset?.[0];
        candidateName =
          candidate?.FullName || candidate?.DisplayName || "ứng viên";
      } catch (error) {
        console.error("Error fetching candidate name:", error);
        candidateName = "ứng viên";
      }
    }

    if (plan.RoleID === 3 && candidateName) {
      message = `Bạn đã trả ${money} để sử dụng tính năng "${plan.PlanName}" nhằm xem liên hệ của ứng viên "${candidateName}".`;
    } else {
      message = `Bạn đã trả ${money} để sử dụng tính năng "${plan.PlanName}".`;
    }
    linkUrl =
      plan.RoleID === 3 ? "/employer/applicants" : "/candidate/applied-jobs";
    referenceId = plan.PlanID?.toString();
  } else {
    message = `Chúc mừng! Bạn đã mua thành công gói "${
      plan.SnapshotPlanName || plan.PlanName
    }" với giá ${money} để xem số điện thoại của ứng viên ${
      metadata.candidateName
    }.`;
    linkUrl =
      plan.RoleID === 3 ? "/employer/subscription" : "/candidate/subscription";
    referenceId = plan.PlanID?.toString();
  }

  await createNotification({
    userId,
    message,
    type: NOTIFICATION_TYPES.VIP_PURCHASE,
    linkUrl,
    referenceId,
  });
};

export const createVipExpiryNotification = async (userId, subscription) => {
  const endDate = new Date(subscription.EndDate);
  const timeString = endDate.toLocaleString("vi-VN", { timeZone: "UTC" });
  const message = `Gói "${
    subscription.SnapshotPlanName || subscription.PlanName
  }" của bạn sẽ hết hạn vào ${timeString}.`;

  const linkUrl =
    subscription.RoleID === 3
      ? "/employer/subscription"
      : "/candidate/subscription";

  await createNotification({
    userId,
    message,
    type: NOTIFICATION_TYPES.VIP_EXPIRY,
    linkUrl,
    referenceId: subscription.SubscriptionID?.toString(),
  });
};

export const createJobStatusChangeNotification = async (
  employerUserId,
  job,
  oldStatus,
  newStatus
) => {
  const message = `Bài tuyển dụng "${job.JobTitle}" đã chuyển từ trạng thái "${JOB_STATUS[oldStatus]}" sang "${JOB_STATUS[newStatus]}".`;
  const linkUrl = `/employer/jobs`;

  await createNotification({
    userId: employerUserId,
    message,
    type: NOTIFICATION_TYPES.JOB_STATUS_CHANGE,
    linkUrl,
    referenceId: job.JobID?.toString(),
  });
};

export const createApplicationStatusChangeNotification = async (
  candidateUserId,
  application,
  job,
  oldStatus,
  newStatus
) => {
  const message = `Trạng thái ứng tuyển của bạn cho vị trí "${job.JobTitle}" đã chuyển từ "${APPLICATION_STATUS[oldStatus]}" sang "${APPLICATION_STATUS[newStatus]}".`;
  const linkUrl = `/candidate/applied-jobs`;

  await createNotification({
    userId: candidateUserId,
    message,
    type: NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGE,
    linkUrl,
    referenceId: application.ApplicationID?.toString(),
  });
};

export const createCandidateAppliedNotification = async (
  employerUserId,
  application,
  job,
  candidate
) => {
  const candidateName =
    candidate?.FullName || candidate?.DisplayName || "Ứng viên";
  const message = `Ứng viên "${candidateName}" đã ứng tuyển vào vị trí "${job.JobTitle}".`;
  const linkUrl = `/employer/jobs`;

  await createNotification({
    userId: employerUserId,
    message,
    type: NOTIFICATION_TYPES.CANDIDATE_APPLIED,
    linkUrl,
    referenceId: application.ApplicationID?.toString(),
  });
};

export const createApplicationSubmittedNotification = async (
  candidateUserId,
  application,
  job
) => {
  const message = `Bạn đã ứng tuyển thành công vào vị trí "${job.JobTitle}".`;
  const linkUrl = `/candidate/applied-jobs`;

  await createNotification({
    userId: candidateUserId,
    message,
    type: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
    linkUrl,
    referenceId: application.ApplicationID?.toString(),
  });
};