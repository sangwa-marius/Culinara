require("dotenv").config();
const express   = require("express");
const http      = require("http");
const cors      = require("cors");
const morgan    = require("morgan");
const path      = require("path");
const connectDB = require("./config/db");
const { initSocket } = require("./utils/socket");

connectDB();

const app    = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors({
  origin:         process.env.CLIENT_URL || "http://localhost:5173",
  credentials:    true,
  methods:        ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  next();
}, express.static(path.join(__dirname, "uploads")));

app.use("/api/auth",        require("./routes/auth-routes"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/menu",        require("./routes/menu"));
app.use("/api/orders",      require("./routes/orders"));
app.use("/api/admin",       require("./routes/admin"));
app.use("/api/driver",      require("./routes/driver"));
app.use("/api/upload",      require("./routes/upload"));
app.use("/api/payments",    require("./routes/payments"));
app.use("/api/tables",       require("./routes/tables"));
app.use("/api/collections",  require("./routes/collections"));
app.use("/api/analytics",    require("./routes/analytics"));

app.get("/api/health", (req, res) => res.json({ success: true, message: "Culinara API running 🍽️", timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`\n🍽️  Culinara Server on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client: ${process.env.CLIENT_URL}`);
});