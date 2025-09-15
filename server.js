import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "supersecretkey123", // change to env var in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set secure:true if HTTPS
}));

// Load users
const usersFile = path.join(process.cwd(), "users.json");
let users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));

// Serve public folder
app.use(express.static("public"));

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  req.session.user = { username };
  res.json({ success: true });
});

// Protect index.html
app.get("/index.html", (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  next();
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
