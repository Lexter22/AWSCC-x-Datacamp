import { useLocation } from "react-router-dom";

export default function Success() {
  const green = "#22c55e";
  const facebookPageUrl =
    "https://www.facebook.com/profile.php?id=61584279257151";

  return (
    <main style={{ padding: "16px", color: "#e5e7eb" }}>
      <section
        aria-label="Application Success"
        style={{
          width: "100%",
          maxWidth: "720px",
          margin: "16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "18px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
        }}
      >
        <header style={{ textAlign: "left", marginBottom: "6px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "1.35rem",
              lineHeight: 1.3,
              color: green,
            }}
          >
            Application success!
          </h1>
        </header>

        <div
          style={{
            display: "grid",
            gap: "6px",
            fontSize: "0.95rem",
            textAlign: "left",
          }}
        >
          <p style={{ margin: 0 }}>
            Thank you for applying — we’re excited to review your submission.
            The review may take a few days.
          </p>
          <p style={{ margin: 0 }}>
            You should receive an email confirming we received your application
            and what to expect next. If it isn’t in your inbox, please check
            your spam or junk folder. If it’s still not there, message us on our
            FB page below.
          </p>
          <p style={{ margin: 0 }}>
            Until then, keep the freeze and stay tuned for updates!
          </p>
        </div>

        <div style={{ marginTop: "10px", textAlign: "left" }}>
          <span style={{ color: "#94a3b8" }}>
            For more updates, follow our{" "}
          </span>
          <a
            href={facebookPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: green,
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              textDecorationThickness: "2px",
            }}
          >
            Facebook page
          </a>
        </div>
      </section>
    </main>
  );
}
