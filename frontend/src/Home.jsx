import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);

  function proceed() {
    if (!consent) return;
    // Persist consent for route guard
    sessionStorage.setItem("consent", "true");
    // Also set common alternative keys to avoid null/undefined on insert
    sessionStorage.setItem("consented", "true");
    sessionStorage.setItem("hasConsent", "true");
    // Pass consent via URL and router state for the Apply page to consume
    navigate("/apply?consent=true", { state: { consent: true } });
  }

  return (
    <div className="page">
      <div className="home">
        {/* NEW: About section */}
        <section
          className="section home-section"
          aria-labelledby="legend-about"
        >
          <p>
            AWS Cloud Club - Frizz is a student-led community that helps
            learners explore cloud, data, and AI through hands-on activities and
            mentorship. Through this partnership with DataCamp Donates, we aim
            to provide structured learning paths, projects, and certifications
            to accelerate your journey into Data and Artificial Intelligence.
          </p>
          <p>
            Why is it free? This initiative is offered as a scholarship program
            to broaden access to high-quality learning resources—supported by
            community partners and educational grants—so motivated learners can
            focus on developing skills without financial barriers.
          </p>
          <p>
            Why DataCamp? DataCamp’s interactive courses, assessments, and
            curated tracks help you learn Python, SQL, ML, and more with
            practical exercises. Projects and certificates make it easy to
            showcase progress and readiness for internships and roles in data
            and AI.
          </p>
        </section>

        <section
          className="section home-section"
          aria-labelledby="legend-consent"
        >
          <h2 id="legend-consent" className="legend">
            Consent
          </h2>
          <p style={{ marginTop: 0 }}>
            By proceeding, you consent to the collection and use of your
            application data by AWS Cloud Club Frizz x DataCamp Donates for
            review and program administration. We may contact you via the email
            you provide regarding your application and related opportunities.
            Your data will be handled per our privacy policy and deleted or
            anonymized when no longer needed.
          </p>
          <label className="checkbox-row">
            <input
              className="checkbox"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-checked={consent}
            />
            <span>I have read and agree to the above consent.</span>
          </label>
        </section>

        <div className="cta-bar">
          <button
            type="button"
            className="button cta-primary"
            onClick={proceed}
            disabled={!consent}
            aria-disabled={!consent}
          >
            Apply Now!
          </button>
        </div>
      </div>
    </div>
  );
}
