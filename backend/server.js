import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "mssql";
import { sqlConfig } from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import candidateRoutes from "./src/routes/candidateRoutes.js";
import companyRoutes from "./src/routes/companyRoutes.js";
import utilsRoutes from "./src/routes/utilsRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import vipRoutes from "./src/routes/vipRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import vipFeatureRoutes from "./src/routes/vipFeatureRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import { startVipExpiryScheduler } from "./src/services/vipExpiryScheduler.js";
import cvRoutes from "./src/routes/cvRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/vip-packages", vipRoutes);
app.use("/api/vip-features", vipFeatureRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/test", testRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/cvs", cvRoutes);
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Backend đã kết nối thành công!" });
});

app.listen(port, async () => {
  try {
    await sql.connect(sqlConfig);
    console.log("✅ Đã kết nối thành công tới CSDL (SQL Server)!");
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
    startVipExpiryScheduler();
  } catch (err) {
    console.error("❌ LỖI KHI KẾT NỐI CSDL:", err.message);
  }
});