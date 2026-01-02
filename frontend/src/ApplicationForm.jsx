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
    age: "", // required
    gender: "prefer_not_to_say", // optional
    facebook_link: "", // optional
    social_share_link: "", // optional
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [step, setStep] = useState(0);
  const firstFieldRef = useRef(null);

  // NEW: glow state for Back button after validation failure
  const [glowBackBtn, setGlowBackBtn] = useState(false);
  // NEW: flag to style the error message prominently
  const [validationError, setValidationError] = useState(false);

  // NEW: consent state
  const [hasConsent, setHasConsent] = useState(
    sessionStorage.getItem("consent") === "true"
  );
  const [consentChecked, setConsentChecked] = useState(false);

  // NEW: submission acknowledgement state
  const [submissionConsent, setSubmissionConsent] = useState(false);

  // REMOVE: redirect when missing consent
  // useEffect(() => {
  //   const hasConsent = sessionStorage.getItem("consent") === "true";
  //   if (!hasConsent) navigate("/", { replace: true });
  // }, [navigate]);

  useEffect(() => {
    if (firstFieldRef.current) firstFieldRef.current.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // NEW: reset acknowledgement when leaving final step
  useEffect(() => {
    if (step !== 2) setSubmissionConsent(false);
  }, [step]);

  // Auto-clear Back button glow after a few seconds
  useEffect(() => {
    if (!glowBackBtn) return;
    const t = setTimeout(() => setGlowBackBtn(false), 4000);
    return () => clearTimeout(t);
  }, [glowBackBtn]);

  const progressPct = Math.round(((step + 1) / 3) * 100);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  }

  function validateStep(currentStep) {
    const errs = {};
    // CHANGED: fix email regex (one @, at least one dot after)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?\S+\.\S+/i;

    if (currentStep === 0) {
      if (!form.full_name.trim()) errs.full_name = "Required";
      if (!form.email.trim()) errs.email = "Required";
      else if (!emailRegex.test(form.email.trim()))
        errs.email = "Invalid email";
      if (!form.location.trim()) errs.location = "Required";
      if (!form.university.trim()) errs.university = "Required";
      if (!form.year_level.trim()) errs.year_level = "Required";
      // CHANGED: age shows "Required" if empty; range message otherwise
      const ageStr = String(form.age || "").trim();
      if (!ageStr) {
        errs.age = "Required";
      } else {
        const ageNum = Number(ageStr);
        if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 100) {
          errs.age = "Enter a valid age (10–100)";
        }
      }
      // NEW: require valid FB profile URL
      if (!form.facebook_link.trim()) {
        errs.facebook_link = "Please provide your Facebook profile link (URL).";
      } else if (!urlRegex.test(form.facebook_link.trim())) {
        errs.facebook_link = "Enter a valid URL (http/https or domain).";
      }
      // NEW: require valid share post URL
      if (!form.social_share_link.trim()) {
        errs.social_share_link =
          "Kindly share your FB post link announcing applications are open.";
      } else if (!urlRegex.test(form.social_share_link.trim())) {
        errs.social_share_link = "Enter a valid URL (http/https or domain).";
      }
    }

    if (currentStep === 1) {
      if (!form.motivation.trim()) errs.motivation = "Required";
      if (!form.learning_hopes.trim()) errs.learning_hopes = "Required";
      if (!form.goal.trim()) errs.goal = "Required";
      // NEW: enforce minimum length to match backend expectations
      if (form.motivation.trim() && form.motivation.trim().length < 10) {
        errs.motivation = "Add at least 10 characters.";
      }
      if (
        form.learning_hopes.trim() &&
        form.learning_hopes.trim().length < 10
      ) {
        errs.learning_hopes = "Add at least 10 characters.";
      }
      if (form.goal.trim() && form.goal.trim().length < 10) {
        errs.goal = "Add at least 10 characters.";
      }
      // REMOVE: URL checks from step 1
      // if (form.facebook_link.trim() && !urlRegex.test(...)) ...
      // if (form.social_share_link.trim() && !urlRegex.test(...)) ...
    }

    if (currentStep === 2) {
      if (!form.device.trim()) errs.device = "Required";
      const ch = Number(form.commitment_hours);
      if (!Number.isFinite(ch) || ch < 0 || ch > 168) {
        errs.commitment_hours = "Enter 0–168";
      }
      if (!["wifi", "mobile_data"].includes(form.internet_type)) {
        errs.internet_type = "Choose Wi‑Fi or Mobile Data";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // CHANGED: Read API base from frontend env or default to local backend
  const API_BASE = (
    import.meta.env.VITE_PUBLIC_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000"
  ).trim();

  // NEW: normalize URLs to reduce backend validation errors
  function normalizeUrl(s) {
    const v = String(s || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    // Prepend https:// if it looks like a domain
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

      // NEW: build payload explicitly and log it for quick debugging
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
        // CHANGED: send internet_type to match backend validation
        internet_type:
          form.internet_type === "mobile_data" ? "mobile_data" : "wifi",
        // REMOVE: connection_type (backend derives DB connection_type from internet_type)
      };
      // Tip: remove this log in production
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

      if (!res.ok || (isJson && data?.ok === false)) {
        const serverMsg =
          (Array.isArray(data?.errors) && data.errors[0]) ||
          data?.error ||
          (await res.text().catch(() => "")) ||
          "Submission failed";

        // NEW: prefer structured fieldErrors from backend
        if (
          res.status === 400 &&
          data?.fieldErrors &&
          typeof data.fieldErrors === "object"
        ) {
          const fe = data.fieldErrors;
          const step0 = [
            "full_name",
            "email",
            "location",
            "university",
            "year_level",
            "age",
            "facebook_link",
            "social_share_link",
          ];
          const step1 = ["motivation", "learning_hopes", "goal"];
          const step2 = ["device", "commitment_hours", "internet_type"];

          let targetStep = step;
          if (Object.keys(fe).some((k) => step0.includes(k))) targetStep = 0;
          else if (Object.keys(fe).some((k) => step1.includes(k)))
            targetStep = 1;
          else if (Object.keys(fe).some((k) => step2.includes(k)))
            targetStep = 2;

          setFieldErrors((prev) => ({ ...prev, ...fe }));
          setError(serverMsg || "Please correct the highlighted fields.");
          setValidationError(true);
          setGlowBackBtn(true);
          if (targetStep !== step) setStep(targetStep);
          return;
        }

        // NEW: duplicate email handling
        if (res.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: "Email already registered.",
          }));
          setError("Email already registered.");
          setValidationError(true);
          if (step !== 0) setStep(0);
          return;
        }

        if (res.status === 400) {
          // CHANGED: smarter server error mapping to avoid false "Required"
          const raw = String(serverMsg || "");
          const msg = raw.toLowerCase();
          const fe = {};
          let targetStep = step;

          // Duplicate email / unique constraint
          if (
            msg.includes("duplicate key value") ||
            (msg.includes("unique") && msg.includes("email")) ||
            msg.includes("idx_applicants_email_unique_ci")
          ) {
            fe.email = "Email already registered.";
            targetStep = 0;
          }

          // Not-null violations
          const notNullMatch =
            msg.match(/null value in column "([^"]+)"/) ||
            msg.match(/violates not-null constraint.*"(.*?)"/);
          if (notNullMatch) {
            const col = notNullMatch[1] || "";
            if (col.includes("goal")) {
              fe.goal = form.goal.trim() ? "Invalid value." : "Required";
              targetStep = 1;
            } else if (col.includes("learning_topic")) {
              fe.learning_hopes = form.learning_hopes.trim()
                ? "Invalid value."
                : "Required";
              targetStep = 1;
            } else if (col.includes("motivation")) {
              fe.motivation = form.motivation.trim()
                ? "Invalid value."
                : "Required";
              targetStep = 1;
            } else if (col.includes("course_year")) {
              fe.year_level = form.year_level.trim()
                ? "Invalid value."
                : "Required";
              targetStep = 0;
            } else if (col.includes("email")) {
              fe.email = form.email.trim() ? "Invalid value." : "Required";
              targetStep = 0;
            } else if (col.includes("commitment_hours")) {
              fe.commitment_hours = form.commitment_hours.trim()
                ? "Invalid value."
                : "Required";
              targetStep = 2;
            }
          }

          // Check constraint violations (e.g., age range)
          if (
            msg.includes("age") &&
            msg.includes("violates check constraint")
          ) {
            fe.age = "Enter a valid age (10–100)";
            targetStep = 0;
          }

          // Fallback keyword hints (only mark Required if actually empty)
          if (msg.includes("goal") && !fe.goal) {
            fe.goal = form.goal.trim() ? "Invalid value." : "Required";
            targetStep = 1;
          }
          if (
            (msg.includes("learning_topic") || msg.includes("learning")) &&
            !fe.learning_hopes
          ) {
            fe.learning_hopes = form.learning_hopes.trim()
              ? "Invalid value."
              : "Required";
            targetStep = 1;
          }
          if (msg.includes("motivation") && !fe.motivation) {
            fe.motivation = form.motivation.trim()
              ? "Invalid value."
              : "Required";
            targetStep = 1;
          }
          if (msg.includes("course_year") && !fe.year_level) {
            fe.year_level = form.year_level.trim()
              ? "Invalid value."
              : "Required";
            targetStep = 0;
          }
          if (msg.includes("facebook") && !fe.facebook_link) {
            fe.facebook_link = form.facebook_link.trim()
              ? "Invalid value."
              : "Required";
            targetStep = 0;
          }
          if (
            (msg.includes("share") || msg.includes("social")) &&
            !fe.social_share_link
          ) {
            fe.social_share_link = form.social_share_link.trim()
              ? "Invalid value."
              : "Required";
            targetStep = 0;
          }
          if (msg.includes("email") && !fe.email) {
            fe.email = form.email.trim() ? "Invalid value." : "Required";
            targetStep = 0;
          }

          setFieldErrors((prev) => ({ ...prev, ...fe }));
          setError(
            raw ||
              "Please review your answers and try again. Check highlighted fields."
          );
          setValidationError(true);
          setGlowBackBtn(true);
          if (targetStep !== step) setStep(targetStep);
          return;
        }

        throw new Error(serverMsg);
      }

      navigate("/success", { state: { ok: true } });
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else if (
        err.name === "TypeError" ||
        /fetch|cors|network|preflight/i.test(String(err.message || ""))
      ) {
        setError(
          `Could not reach the backend at ${API_BASE}. Ensure the server is running and CORS allows http://localhost:5173.`
        );
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    // CHANGED: glow Back button when client-side validation fails
    if (!validateStep(step)) {
      setGlowBackBtn(true);
      if (step === 2) {
        setError(
          "Please review your answers on the Tech & Commitment step. Add more detail, then try again."
        );
        setValidationError(true);
      } else {
        setError(
          "Please review and complete the required fields before continuing."
        );
        setValidationError(false);
      }
      return;
    }
    if (step < 2) setStep(step + 1);
    else {
      // NEW: require acknowledgement before submitting
      if (!submissionConsent) {
        setError("Please confirm the acknowledgement before submitting.");
        return;
      }
      submitForm();
    }
  }

  function back() {
    setError("");
    setFieldErrors({});
    setValidationError(false); // NEW: clear standout style when going back
    if (step > 0) setStep(step - 1);
    else navigate("/");
  }

  // NEW: helper to render "Required" and duplicate email errors in red
  function ErrorMsg({ msg, id }) {
    if (!msg) return null;
    const isRequired = typeof msg === "string" && /^required\b/i.test(msg);
    // CHANGED: also render duplicate notice in red
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

  return !hasConsent ? (
    // Render consent screen directly (no green wrapper)
    <form className="form" onSubmit={(e) => e.preventDefault()} noValidate>
      <fieldset
        className="section"
        role="group"
        aria-labelledby="legend-consent"
      >
        <legend id="legend-consent" className="legend">
          Consent
        </legend>
        <div className="section-grid">
          <div className="full-row">
            <div className="label">Please read and confirm</div>
            <div className="helper">
              By proceeding, you consent to the collection and use of your
              application data by AWS Cloud Club × DataCamp for review and
              program administration. We may contact you via the email you
              provide regarding your application and related opportunities. Your
              data will be handled per our privacy policy and deleted or
              anonymized when no longer needed. You affirm the information you
              provide is accurate and agree to our terms.
            </div>
          </div>
          <label className="checkbox-row">
            <input
              className="checkbox"
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              aria-checked={consentChecked}
              aria-label="I have read and agree to the consent statement"
            />
            <span>I have read and agree to the above consent.</span>
          </label>
        </div>
      </fieldset>
      <div className="actions">
        {/* CHANGED: Use Back instead of Home on consent screen */}
        <button type="button" className="button btn-sm minw" onClick={back}>
          Back
        </button>
        <button
          type="button"
          className="button btn-sm minw"
          onClick={() => {
            sessionStorage.setItem("consent", "true");
            setHasConsent(true);
          }}
          disabled={!consentChecked}
          aria-disabled={!consentChecked}
        >
          Continue
        </button>
      </div>
    </form>
  ) : (
    // Render main form directly (no green wrapper)
    <form className="form" onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="stepper" aria-label="Progress">
        <div className={`stepper-item ${step === 0 ? "active" : ""}`}>
          Personal
        </div>
        <div className={`stepper-item ${step === 1 ? "active" : ""}`}>
          Learning
        </div>
        <div className={`stepper-item ${step === 2 ? "active" : ""}`}>Tech</div>
      </div>

      {/* Keep transparent track, show only green progress bar */}
      <div
        aria-hidden="true"
        style={{
          height: 6,
          background: "transparent",
          boxShadow: "none",
          border: "none",
          margin: "8px 0 16px",
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            backgroundColor: "#22c55e", // green
            borderRadius: 9999,
            transition: "width 200ms ease",
          }}
        />
      </div>

      {/* step 0 */}
      {step === 0 && (
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
                placeholder="Your full name"
                value={form.full_name}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.full_name}
              />
              {/* CHANGED: use ErrorMsg */}
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
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.email}
              />
              {/* CHANGED */}
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
              {/* CHANGED: use ErrorMsg for red "Required" */}
              {fieldErrors.location && <ErrorMsg msg={fieldErrors.location} />}
            </div>

            <div>
              <div className="label">University</div>
              <input
                className="input"
                type="text"
                name="university"
                placeholder="Your university"
                value={form.university}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.university}
              />
              {/* CHANGED: use ErrorMsg for red "Required" */}
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
                placeholder="e.g., First Year, Sophomore, Senior, Graduate"
                value={form.year_level}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.year_level}
              />
              {/* CHANGED */}
              {fieldErrors.year_level && (
                <ErrorMsg msg={fieldErrors.year_level} />
              )}
              <div className="helper">
                Use the term common at your university.
              </div>
            </div>

            {/* NEW: Age */}
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
              {/* CHANGED */}
              {fieldErrors.age && <ErrorMsg msg={fieldErrors.age} />}
            </div>

            {/* NEW: Facebook profile link (required) */}
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
              {/* CHANGED */}
              {fieldErrors.facebook_link && (
                <ErrorMsg msg={fieldErrors.facebook_link} />
              )}
              <div className="helper">
                Required. Helps us contact you about your application.
              </div>
            </div>

            {/* NEW: Share post link (required, friendly text) */}
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
              {/* CHANGED */}
              {fieldErrors.social_share_link && (
                <ErrorMsg msg={fieldErrors.social_share_link} />
              )}
              <div className="helper">
                Required. Paste the URL of your post letting friends know this
                opportunity is open.
              </div>
            </div>

            {/* Moved: Gender (optional) now below FB links */}
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
              {/* CHANGED */}
              {fieldErrors.gender && <ErrorMsg msg={fieldErrors.gender} />}
            </div>
          </div>
        </fieldset>
      )}

      {/* step 1 */}
      {step === 1 && (
        <fieldset
          className="section"
          role="group"
          aria-labelledby="legend-learning"
        >
          <legend id="legend-learning" className="legend">
            Learning Details
          </legend>

          {/* NEW: Informational banner about importance of answers */}
          <div className="section-grid">
            <div className="full-row">
              <div className="helper">
                Your responses are important to determine scholarship
                eligibility. Please answer thoughtfully and with enough detail.
              </div>
            </div>

            <div className="full-row">
              <div className="label">Motivation</div>
              <textarea
                ref={firstFieldRef}
                className="textarea small"
                name="motivation"
                placeholder="Why are you applying?"
                value={form.motivation}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.motivation}
              />
              {/* CHANGED */}
              {fieldErrors.motivation && (
                <ErrorMsg id="err-motivation" msg={fieldErrors.motivation} />
              )}
              {/* NEW: Helper tip */}
              <div className="helper">
                Tip: Aim for 10+ characters; thoughtful detail helps us evaluate
                eligibility.
              </div>
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
              {/* CHANGED */}
              {fieldErrors.learning_hopes && (
                <ErrorMsg msg={fieldErrors.learning_hopes} />
              )}
              {/* NEW: Helper tip */}
              <div className="helper">
                Tip: Be specific; detailed answers guide matching and review.
              </div>
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
              {/* CHANGED */}
              {fieldErrors.goal && <ErrorMsg msg={fieldErrors.goal} />}
              {/* NEW: Helper tip */}
              <div className="helper">
                Tip: Share both short-term and long-term goals to help us
                understand fit.
              </div>
            </div>
          </div>
        </fieldset>
      )}

      {/* step 2 */}
      {step === 2 && (
        <fieldset
          className="section"
          role="group"
          aria-labelledby="legend-tech"
        >
          <legend id="legend-tech" className="legend">
            Tech & Commitment
          </legend>
          <div className="section-grid">
            <div>
              <div className="label">Device for DataCamp</div>
              <input
                ref={firstFieldRef}
                className="input"
                type="text"
                name="device"
                placeholder="Laptop, Desktop, Tablet, Mobile"
                value={form.device}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.device}
              />
              {/* CHANGED */}
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
              {/* CHANGED */}
              {fieldErrors.commitment_hours && (
                <ErrorMsg msg={fieldErrors.commitment_hours} />
              )}
              <div className="helper">
                Typical learners commit 3–10 hours weekly.
              </div>
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
              {/* CHANGED */}
              {fieldErrors.internet_type && (
                <ErrorMsg msg={fieldErrors.internet_type} />
              )}
            </div>

            {/* NEW: Friendly submission acknowledgement */}
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
                  By submitting, I acknowledge that acceptance isn’t guaranteed.
                  I confirm my answers are accurate and understand they’re
                  important to determine eligibility.
                </span>
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {/* CHANGED: make error message stand out on validation failure */}
      {error && (
        <div
          className="error"
          // CHANGED: use red styling for prominent error; remove glow
          style={
            validationError
              ? {
                  background: "rgba(239, 68, 68, 0.12)", // red-500 tint
                  border: "1px solid #ef4444", // red-500
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
          onClick={back}
          disabled={submitting}
          // Glow cue when validation fails
          style={
            glowBackBtn
              ? {
                  boxShadow: "0 0 12px rgba(0, 230, 195, 0.7)",
                  borderColor: "#00e6c3",
                }
              : undefined
          }
        >
          Back
        </button>

        <button
          type="button"
          className="button btn-sm minw"
          onClick={next}
          // NEW: disable Submit until acknowledgement is checked on final step
          disabled={submitting || (step === 2 && !submissionConsent)}
          aria-disabled={submitting || (step === 2 && !submissionConsent)}
        >
          {step < 2 ? "Next" : submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
