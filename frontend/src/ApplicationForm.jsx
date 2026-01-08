import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    university: "",
    motivation: "",
    year_level: "",
    location: "",
    device: "",
    learning_hopes: "",
    goal: "",
    commitment_hours: "",
    internet_type: "wifi",
    age: "",
    gender: "prefer_not_to_say",
    facebook_link: "",
    social_share_link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const firstFieldRef = useRef(null);

  const [validationError, setValidationError] = useState(false);
  const [submissionConsent, setSubmissionConsent] = useState(false);

  useEffect(() => {
    if (firstFieldRef.current) firstFieldRef.current.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  }

  function validateAll() {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?\S+\.\S+/i;

    // Personal
    if (!form.full_name.trim()) errs.full_name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!emailRegex.test(form.email.trim())) errs.email = "Invalid email";
    if (!form.location.trim()) errs.location = "Required";
    if (!form.university.trim()) errs.university = "Required";
    if (!form.year_level.trim()) errs.year_level = "Required";

    const ageStr = String(form.age || "").trim();
    if (!ageStr) {
      errs.age = "Required";
    } else {
      const ageNum = Number(ageStr);
      if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 100) {
        errs.age = "Enter a valid age (10–100)";
      }
    }

    if (!form.facebook_link.trim()) {
      errs.facebook_link = "Please provide your Facebook profile link (URL).";
    } else if (!urlRegex.test(form.facebook_link.trim())) {
      errs.facebook_link = "Enter a valid URL (http/https or domain).";
    }

    if (!form.social_share_link.trim()) {
      errs.social_share_link =
        "Kindly share your FB post link announcing applications are open.";
    } else if (!urlRegex.test(form.social_share_link.trim())) {
      errs.social_share_link = "Enter a valid URL (http/https or domain).";
    }

    // Learning
    if (!form.motivation.trim()) errs.motivation = "Required";
    if (!form.learning_hopes.trim()) errs.learning_hopes = "Required";
    if (!form.goal.trim()) errs.goal = "Required";

    if (form.motivation.trim() && form.motivation.trim().length < 10) {
      errs.motivation = "Add at least 10 characters.";
    }
    if (form.learning_hopes.trim() && form.learning_hopes.trim().length < 10) {
      errs.learning_hopes = "Add at least 10 characters.";
    }
    if (form.goal.trim() && form.goal.trim().length < 10) {
      errs.goal = "Add at least 10 characters.";
    }

    // Tech
    if (!form.device.trim()) errs.device = "Required";
    const ch = Number(form.commitment_hours);
    if (!Number.isFinite(ch) || ch < 0 || ch > 168) {
      errs.commitment_hours = "Enter 0–168";
    }
    if (!["wifi", "mobile_data"].includes(form.internet_type)) {
      errs.internet_type = "Choose Wi‑Fi or Mobile Data";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const API_BASE = (
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_PUBLIC_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000"
  ).trim();

  function normalizeUrl(s) {
    const v = String(s || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    if (/\S+\.\S+/.test(v)) return `https://${v}`;
    return v;
  }

  async function submitForm() {
    setError("");
    setSubmitting(true);
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/apply`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        university: form.university.trim(),
        motivation: form.motivation.trim(),
        age: Number(form.age),
        year_level: form.year_level.trim(),
        learning_hopes: form.learning_hopes.trim(),
        goal: form.goal.trim(),
        device: form.device.trim(),
        facebook_link: normalizeUrl(form.facebook_link),
        social_share_link: normalizeUrl(form.social_share_link),
        gender: form.gender || null,
        consent: true,
        commitment_hours: Number(form.commitment_hours),
        internet_type:
          form.internet_type === "mobile_data" ? "mobile_data" : "wifi",
      };

      console.debug("Submitting application payload:", payload);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client": "awscc-datacamp-frontend",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const isJson = res.headers
        .get("content-type")
        ?.toLowerCase()
        .includes("application/json");
      const data = isJson ? await res.json().catch(() => ({})) : {};

      if (!res.ok) {
        const serverMsg =
          (Array.isArray(data?.errors) && data.errors[0]) ||
          data?.error ||
          (await res.text().catch(() => "")) ||
          "Submission failed";

        if (
          res.status === 400 &&
          data?.fieldErrors &&
          typeof data.fieldErrors === "object"
        ) {
          setFieldErrors((prev) => ({ ...prev, ...data.fieldErrors }));
          setError(serverMsg || "Please correct the highlighted fields.");
          setValidationError(true);
          return;
        }

        if (res.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: "Email already registered.",
          }));
          setError("Email already registered.");
          setValidationError(true);
          return;
        }

        if (res.status === 400) {
          const raw = String(serverMsg || "");
          const msg = raw.toLowerCase();
          const fe = {};

          if (msg.includes("duplicate") || msg.includes("unique"))
            fe.email = "Email already registered.";
          if (msg.includes("violates check constraint") && msg.includes("age"))
            fe.age = "Enter a valid age (10–100)";

          // Basic keyword matching for other fields
          if (msg.includes("motivation")) fe.motivation = "Required";
          if (msg.includes("goal")) fe.goal = "Required";

          setFieldErrors((prev) => ({ ...prev, ...fe }));
          setError(raw || "Please review your answers and try again.");
          setValidationError(true);
          return;
        }

        throw new Error(serverMsg);
      }

      navigate("/success", { state: { ok: true } });
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmitClick() {
    if (!validateAll()) {
      setValidationError(true);
      setError(
        "Please review and complete the required fields before submitting."
      );
      return;
    }
    if (!submissionConsent) {
      setValidationError(false);
      setError("Please confirm the acknowledgement before submitting.");
      return;
    }
    submitForm();
  }

  function ErrorMsg({ msg, id }) {
    if (!msg) return null;
    const isRequired = typeof msg === "string" && /^required\b/i.test(msg);
    const isDuplicateEmail =
      typeof msg === "string" && /email already registered/i.test(msg);
    return (
      <div
        id={id}
        className="error"
        style={
          isRequired || isDuplicateEmail ? { color: "#ef4444" } : undefined
        }
      >
        {msg}
      </div>
    );
  }

  return (
    <form className="form" onSubmit={(e) => e.preventDefault()} noValidate>
      {/* Personal Details */}
      <fieldset
        className="section"
        role="group"
        aria-labelledby="legend-personal"
      >
        <legend id="legend-personal" className="legend">
          Personal Details
        </legend>
        <div className="section-grid">
          <div>
            <div className="label">Full Name</div>
            <input
              ref={firstFieldRef}
              className="input"
              type="text"
              name="full_name"
              placeholder="Juan Dela Cruz"
              value={form.full_name}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.full_name}
            />
            {fieldErrors.full_name && (
              <ErrorMsg id="err-full_name" msg={fieldErrors.full_name} />
            )}
          </div>

          <div>
            <div className="label">Email</div>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="you@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <ErrorMsg msg={fieldErrors.email} />}
          </div>

          <div>
            <div className="label">Location</div>
            <input
              className="input"
              type="text"
              name="location"
              placeholder="City, Country"
              value={form.location}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.location}
            />
            {fieldErrors.location && <ErrorMsg msg={fieldErrors.location} />}
          </div>

          <div>
            <div className="label">University</div>
            <input
              className="input"
              type="text"
              name="university"
              placeholder="Ex. UP Diliman"
              value={form.university}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.university}
            />
            {fieldErrors.university && (
              <ErrorMsg msg={fieldErrors.university} />
            )}
          </div>

          <div>
            <div className="label">Year Level</div>
            <input
              className="input"
              type="text"
              name="year_level"
              placeholder="e.g., First Year, Sophomore, Senior"
              value={form.year_level}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.year_level}
            />
            {fieldErrors.year_level && (
              <ErrorMsg msg={fieldErrors.year_level} />
            )}
          </div>

          <div>
            <div className="label">Age</div>
            <input
              className="input"
              type="number"
              name="age"
              placeholder="e.g., 21"
              min="10"
              max="100"
              step="1"
              value={form.age}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.age}
            />
            {fieldErrors.age && <ErrorMsg msg={fieldErrors.age} />}
          </div>

          <div className="full-row">
            <div className="label">Facebook Profile Link</div>
            <input
              className="input"
              type="url"
              name="facebook_link"
              placeholder="https://facebook.com/your.profile"
              value={form.facebook_link}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.facebook_link}
            />
            {fieldErrors.facebook_link && (
              <ErrorMsg msg={fieldErrors.facebook_link} />
            )}
          </div>

          <div className="full-row">
            <div className="label">
              Kindly share your FB post link and make sure its public
            </div>
            <input
              className="input"
              type="url"
              name="social_share_link"
              placeholder="Link to your FB post announcing applications are open"
              value={form.social_share_link}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.social_share_link}
            />
            {fieldErrors.social_share_link && (
              <ErrorMsg msg={fieldErrors.social_share_link} />
            )}
          </div>

          <div>
            <div className="label">Gender (optional)</div>
            <select
              className="input"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.gender}
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other</option>
            </select>
            {fieldErrors.gender && <ErrorMsg msg={fieldErrors.gender} />}
          </div>
        </div>
      </fieldset>

      {/* Learning Details */}
      <fieldset
        className="section"
        role="group"
        aria-labelledby="legend-learning"
      >
        <legend id="legend-learning" className="legend">
          Learning Details
        </legend>
        <div className="section-grid">
          <div className="full-row">
            <div className="helper">
              Share clear, thoughtful answers to help review eligibility.
            </div>
          </div>

          <div className="full-row">
            <div className="label">Motivation</div>
            <textarea
              className="textarea small"
              name="motivation"
              placeholder="Why are you applying?"
              value={form.motivation}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.motivation}
            />
            {fieldErrors.motivation && (
              <ErrorMsg id="err-motivation" msg={fieldErrors.motivation} />
            )}
          </div>

          <div className="full-row">
            <div className="label">What are you hoping to learn?</div>
            <textarea
              className="textarea small"
              name="learning_hopes"
              placeholder="Topics, skills, or tools you want to learn."
              value={form.learning_hopes}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.learning_hopes}
            />
            {fieldErrors.learning_hopes && (
              <ErrorMsg msg={fieldErrors.learning_hopes} />
            )}
          </div>

          <div className="full-row">
            <div className="label">What is your goal?</div>
            <textarea
              className="textarea small"
              name="goal"
              placeholder="Describe your short-term and long-term goals."
              value={form.goal}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.goal}
            />
            {fieldErrors.goal && <ErrorMsg msg={fieldErrors.goal} />}
          </div>
        </div>
      </fieldset>

      {/* Tech & Commitment */}
      <fieldset className="section" role="group" aria-labelledby="legend-tech">
        <legend id="legend-tech" className="legend">
          Tech & Commitment
        </legend>
        <div className="section-grid">
          <div>
            <div className="label">Device for DataCamp</div>
            <input
              className="input"
              type="text"
              name="device"
              placeholder="Laptop, Desktop, Tablet, Mobile"
              value={form.device}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.device}
            />
            {fieldErrors.device && (
              <ErrorMsg id="err-device" msg={fieldErrors.device} />
            )}
          </div>

          <div>
            <div className="label">Hours you can commit per week</div>
            <input
              className="input"
              type="number"
              name="commitment_hours"
              placeholder="e.g., 5"
              min="0"
              max="168"
              step="1"
              value={form.commitment_hours}
              onChange={handleChange}
              required
              aria-invalid={!!fieldErrors.commitment_hours}
            />
            {fieldErrors.commitment_hours && (
              <ErrorMsg msg={fieldErrors.commitment_hours} />
            )}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">Internet Connection</div>
            <div
              className="radio-group"
              role="radiogroup"
              aria-label="Internet Connection"
            >
              <label className="radio-option">
                <input
                  type="radio"
                  name="internet_type"
                  value="wifi"
                  checked={form.internet_type === "wifi"}
                  onChange={handleChange}
                />
                <span>Wi‑Fi</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="internet_type"
                  value="mobile_data"
                  checked={form.internet_type === "mobile_data"}
                  onChange={handleChange}
                />
                <span>Mobile Data</span>
              </label>
            </div>
            {fieldErrors.internet_type && (
              <ErrorMsg msg={fieldErrors.internet_type} />
            )}
          </div>

          <div className="full-row">
            <label className="checkbox-row">
              <input
                className="checkbox"
                type="checkbox"
                checked={submissionConsent}
                onChange={(e) => setSubmissionConsent(e.target.checked)}
                aria-checked={submissionConsent}
                aria-label="Submission acknowledgement"
              />
              <span>
                By submitting, I acknowledge that acceptance isn’t guaranteed. I
                confirm my answers are accurate and understand they’re important
                to determine eligibility.
              </span>
            </label>
          </div>
        </div>
      </fieldset>

      {error && (
        <div
          className="error"
          style={
            validationError
              ? {
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                  padding: "12px 14px",
                  borderRadius: "8px",
                }
              : undefined
          }
        >
          {error}
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          className="button btn-sm minw"
          onClick={onSubmitClick}
          disabled={submitting || !submissionConsent}
          aria-disabled={submitting || !submissionConsent}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
