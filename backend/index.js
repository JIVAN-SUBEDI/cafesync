require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const adminAuthRoutes = require("./src/routes/adminAuthRoutes.js");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes.js");
const hotelRoutes = require("./src/routes/hotelRoutes.js");
const dashboardRoutes = require("./src/routes/dashboardRoutes.js");
const hotelAdminRoutes = require("./src/routes/hotelAdminRoutes.js");
const staffRoutes = require("./src/routes/staffRoutes.js");
const AdminDashboardRoutes = require("./src/routes/adminDashboardRoutes.js");
const notificationRoutes = require("./src/routes/notificationRoutes.js");
const termsRoutes = require("./src/routes/termsRoutes.js");
const logger = require("./src/utils/logger.js");
const {socketProtectHotelUser} = require("./src/middleware/auth.js");

const app = express();

app.set("trust proxy", 1);

const httpServer = createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:55810",
  "https://cafe-management-system-ui-snowy.vercel.app",
];

/* ===================== SOCKET.IO ===================== */
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET","POST"]
  },
});

app.set("io", io);
io.use(socketProtectHotelUser)

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
    // socket.emit("order:new","you are sucessfully connected")
  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
  });
});
/* ===================== SOCKET.IO ===================== */


const allowVercelPreviews = true;
const vercelPreviewRegex =
  /^https:\/\/cafe-management-system-ui-snowy-.*\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && vercelPreviewRegex.test(origin)) return true;
  return false;
}

app.use(helmet());
app.use(compression());
app.use(cookieParser(process.env.COOKIE_SECRET || undefined));

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
      "Accept",
      "Origin",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
// app.use("/api");

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "undefined",
  });
});

app.use("/api/auth/admin", adminAuthRoutes);
app.use("/api/auth/subscriptions", subscriptionRoutes);
app.use("/api/hotel/data", dashboardRoutes);
app.use("/admin/dashboard", AdminDashboardRoutes);
app.use("/api/auth/admin", hotelAdminRoutes);
app.use("/api/hotel/v1", staffRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/terms", termsRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  logger.error(err?.message || err);
  res.status(500).json({
    status: "error",
    message: err?.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info("Socket.IO enabled");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    logger.info("Process terminated");
  });
});