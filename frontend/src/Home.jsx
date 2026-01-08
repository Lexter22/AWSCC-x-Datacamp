import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <div className="page">
      {/* Main Content Card (No Hero Header) */}
      <div className="section">
        {/* About Section */}
        <div style={{ marginBottom: "24px" }}>
          <h2 className="legend">About the Program</h2>
          <p>
            We are a student-led community helping learners explore cloud, data,
            and AI through hands-on activities and mentorship—powered by
            DataCamp Donates.
          </p>
          <p>
            Scholarships provide <strong>free premium access</strong> to curated
            tracks, projects, and professional certificates so you can build
            skills without financial barriers.
          </p>
          <div className="helper">
            Curious? Learn more at{" "}
            <a
              href="https://www.datacamp.com/donates"
              target="_blank"
              rel="noopener noreferrer"
            >
              DataCamp’s official page
            </a>
            .
          </div>
        </div>

        {/* Visual Divider */}
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "24px 0",
          }}
        />

        {/* Consent Section */}
        <div>
          <h2 className="legend">Consent & Application</h2>
          <div className="helper" style={{ marginBottom: "16px" }}>
            By proceeding, you consent to the collection of your application
            data by AWS Cloud Club Frizz × DataCamp Donates for review. We may
            contact you via email regarding this opportunity. Your data is
            handled according to our privacy policy and deleted when no longer
            needed.
          </div>

          {/* Interactive Consent Box */}
          <label
            className="checkbox-row"
            style={{
              background: consentChecked
                ? "rgba(34, 197, 94, 0.1)"
                : "var(--field-bg)",
              border: consentChecked
                ? "1px solid var(--brand-green)"
                : "1px solid var(--border)",
              padding: "16px",
              borderRadius: "10px",
              transition: "all 0.2s ease",
            }}
          >
            <input
              className="checkbox"
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <span
              style={{
                fontWeight: "500",
                color: consentChecked ? "#fff" : "var(--text)",
              }}
            >
              I have read and agree to the consent statement.
            </span>
          </label>
        </div>

        {/* CTA Button */}
        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="button"
            onClick={() => navigate("/apply")}
            disabled={!consentChecked}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px",
              fontSize: "1.05rem",
            }}
          >
            Start Application
          </button>
        </div>
      </div>
    </div>
  );
}
