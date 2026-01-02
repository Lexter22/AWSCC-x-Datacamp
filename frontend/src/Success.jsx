export default function Success() {
  const facebookPageUrl =
    "https://www.facebook.com/profile.php?id=61584279257151";

  return (
    <div className="success">
      <section aria-label="Application Success" className="brand-block">
        <header>
          <h1 className="success-title brand-accent">Application success!</h1>
        </header>

        <div className="success-text">
          <p>
            Thank you for applying — we’re excited to review your submission.
            The review may take a few days.
          </p>
          <p>
            You should receive an email confirming we received your application
            and what to expect next. If it isn’t in your inbox, please check
            your spam or junk folder. If it’s still not there, message us on our
            FB page below.
          </p>
          <p>Until then, keep the freeze and stay tuned for updates!</p>
        </div>

        <div className="success-footer">
          <span className="muted">For more updates, follow our</span>
          <a href={facebookPageUrl} target="_blank" rel="noopener noreferrer">
            Facebook page
          </a>
        </div>
      </section>
    </div>
  );
}
