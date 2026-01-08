import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Alias /api/apply -> /apply (preserves subpaths and methods)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/apply")) {
    req.url = req.originalUrl.replace(/^\/api\/apply/, "/apply");
  }
  next();
});

// Start server listener
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
