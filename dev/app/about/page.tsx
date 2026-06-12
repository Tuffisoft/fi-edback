import Link from "next/link";

export default function AboutPage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "720px",
        margin: "0 auto",
        padding: "80px 24px",
        color: "#18181b",
      }}
    >
      <nav style={{ marginBottom: "32px" }}>
        <Link
          href="/"
          style={{
            color: "#3b82f6",
            textDecoration: "none",
            marginRight: "16px",
          }}
        >
          ← Home
        </Link>
        <Link
          href="/pricing"
          style={{ color: "#3b82f6", textDecoration: "none" }}
        >
          Pricing →
        </Link>
      </nav>

      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
        About Page
      </h1>
      <p style={{ color: "#71717a", lineHeight: "1.6", marginBottom: "24px" }}>
        This is a separate page to test multi-page feedback functionality.
        Feedback submitted here should only appear on this page, not on Home or
        Pricing.
      </p>

      <div
        style={{
          backgroundColor: "#f4f4f5",
          padding: "24px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}
        >
          Testing Instructions
        </h2>
        <ol style={{ lineHeight: "2", color: "#52525b", marginLeft: "20px" }}>
          <li>Add feedback on this page (click Feedback button)</li>
          <li>Navigate to Home or Pricing using the links above</li>
          <li>Verify that pins from this page disappear</li>
          <li>Add feedback on the other page</li>
          <li>Come back to About — only About's pins should show</li>
        </ol>
      </div>

      <div style={{ height: "150vh", marginTop: "48px" }}>
        <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
          ↕ Scroll down and place a pin to test scroll tracking.
        </p>
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#a1a1aa",
            fontSize: "13px",
          }}
        >
          Bottom of the page ↓
        </div>
      </div>
    </main>
  );
}
