import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware: check JWT
function authenticate(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ message: "Unauthorized" });

  const token = auth.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// Middleware: admin only
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

// Login route
app.post("/login", async (req, res) => {
  const { username, password, voucher, deviceId } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "User not found" });

    const validPw = await bcrypt.compare(password, user.password_hash);
    if (!validPw || user.voucher_code !== voucher) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Device binding
    if (!user.device_id) {
      await pool.query(
        "UPDATE users SET device_id=$1, last_ip=$2 WHERE id=$3",
        [deviceId, ip, user.id]
      );
    } else if (user.device_id !== deviceId) {
      return res.status(403).json({ message: "This voucher is already used on another device." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Protected route → fetch latest video
app.get("/stream", authenticate, async (req, res) => {
  const result = await pool.query("SELECT * FROM streams ORDER BY created_at DESC LIMIT 1");
  res.json(result.rows[0] || { video_url: null });
});

// Admin route → update stream
app.post("/admin/update-stream", authenticate, adminOnly, async (req, res) => {
  const { video_url } = req.body;
  if (!video_url) return res.status(400).json({ message: "Missing video URL" });

  try {
    await pool.query("UPDATE streams SET video_url = $1 WHERE id = 1", [video_url]);
    res.json({ message: "Video updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server (last line)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
