import sql from "mssql";
import { DEFAULT_LIMITS } from "../config/limitConstants.js";

export const DEFAULT_CV_LIMIT = DEFAULT_LIMITS?.CANDIDATE?.CV_STORAGE || 0;

export const normalizeCandidateCvLimit = (limit) => {
  if (typeof limit === "number" && limit > 0) return limit;
  if (typeof limit === "string") {
    const parsed = parseInt(limit, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_CV_LIMIT;
};

export const enforceCandidateCvLimit = async (dbConnection, userId, limit) => {
  if (!dbConnection?.request || !userId) return;
  const normalizedLimit = normalizeCandidateCvLimit(limit);

  const request = dbConnection.request();
  await request
    .input("UserID", sql.NVarChar, userId)
    .input("Limit", sql.Int, normalizedLimit).query(`
      WITH OrderedCVs AS (
        SELECT 
          CVID,
          ROW_NUMBER() OVER (
            ORDER BY 
              IsDefault DESC, 
              CreatedAt ASC, 
              CVID ASC
          ) AS RowNum
        FROM CVs
        WHERE UserID = @UserID
      )
      UPDATE c
      SET IsLocked = CASE WHEN oc.RowNum <= @Limit THEN 0 ELSE 1 END
      FROM CVs c
      INNER JOIN OrderedCVs oc ON c.CVID = oc.CVID;
    `);
};