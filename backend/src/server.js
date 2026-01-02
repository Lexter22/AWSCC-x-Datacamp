require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const { createClient } = require("@supabase/supabase-js");

// App
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.ALLOWED_ORIGIN ||
  ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

["http://localhost:5173", "http://127.0.0.1:5173"].forEach((o) => {
  if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
});

const corsOpts = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin or curl
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS"), false);
  },
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Client"],
  maxAge: 86400,
};
app.use(cors(corsOpts));
app.options("*", cors(corsOpts));

// Rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body parsing
app.use(express.json({ limit: "10kb" }));

// Supabase (Service role required)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Validation aligned to DB
const ApplySchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  university: z.string().min(2).max(160),
  motivation: z.string().min(10).max(5000),
  year_level: z.string().min(1).max(100),
  location: z.string().min(2).max(160).optional(),
  device: z.string().min(2).max(120),
  learning_hopes: z.string().min(10).max(5000),
  goal: z.string().min(10).max(5000),
  // CHANGED: coerce to number so string inputs pass
  commitment_hours: z.coerce.number().int().min(0).max(168),
  internet_type: z.enum(["wifi", "mobile_data"]),
  age: z.coerce.number().int().min(10).max(100),
  gender: z
    .enum(["prefer_not_to_say", "female", "male", "nonbinary", "other"])
    .optional(),
  facebook_link: z
    .string()
    .url({ message: "Please provide a valid Facebook profile URL." }),
  social_share_link: z
    .string()
    .url({ message: "Please provide a valid share post URL." }),
});

// Simple sanitization for text fields
const clean = (s) =>
  String(s || "")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
    .trim();

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/health/supabase", async (_req, res) => {
  try {
    const { error } = await supabase.from("applicants").select("id").limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false });
  }
});

// Apply handler
app.post("/apply", async (req, res) => {
  const parsed = ApplySchema.safeParse(req.body);
  if (!parsed.success) {
    // NEW: structured fieldErrors keyed by field
    const issues = parsed.error.issues || [];
    const fieldErrors = {};
    for (const i of issues) {
      const key =
        Array.isArray(i.path) && i.path.length ? String(i.path[0]) : "form";
      fieldErrors[key] = i.message || "Invalid value.";
    }
    return res.status(400).json({
      ok: false,
      error: "Validation failed.",
      errors: issues.map((e) => e.message),
      fieldErrors,
    });
  }
  const inb = parsed.data;

  // Normalize lowercased email for CI unique index
  const emailLc = clean(inb.email.toLowerCase());

  // Duplicate check
  const { data: existing, error: existErr } = await supabase
    .from("applicants")
    .select("id")
    .eq("email", emailLc)
    .limit(1);

  if (existErr) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
  if (Array.isArray(existing) && existing.length > 0) {
    return res
      .status(409)
      .json({ ok: false, error: "Email already registered." });
  }

  const row = {
    full_name: clean(inb.full_name),
    email: emailLc,
    university: clean(inb.university),
    motivation: clean(inb.motivation),
    status: "pending",
    age: inb.age,
    gender: inb.gender ?? null,
    course_year: clean(inb.year_level),
    facebook_link: inb.facebook_link,
    learning_topic: clean(inb.learning_hopes),
    connection_type: inb.internet_type,
    consent: true, // must be true to satisfy CHECK
    goal: clean(inb.goal),
  };

  const { error: insertErr } = await supabase.from("applicants").insert(row);
  if (insertErr) {
    // Map unique constraint to 409 if needed
    const msg = String(insertErr.message || "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return res
        .status(409)
        .json({ ok: false, error: "Email already registered." });
    }
    return res
      .status(500)
      .json({ ok: false, error: "Insert failed", details: insertErr.message });
  }

  // Respond success immediately (do not block on email)
  res.status(201).json({ ok: true });
});

// Optional alias
app.post("/api/apply", (req, res, next) => app._router.handle(req, res, next));

module.exports = app;
