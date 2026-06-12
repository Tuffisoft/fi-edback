import Link from "next/link";

export default function PricingPage() {
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
          href="/about"
          style={{ color: "#3b82f6", textDecoration: "none" }}
        >
          About →
        </Link>
      </nav>

      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
        Pricing Page
      </h1>
      <p style={{ color: "#71717a", lineHeight: "1.6", marginBottom: "24px" }}>
        Another test page for multi-page feedback isolation. Try adding feedback
        here and navigating between all three pages (Home, About, Pricing) to
        verify each page shows only its own pins.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "48px",
        }}
      >
        {["Starter", "Pro", "Enterprise"].map((plan) => (
          <div
            key={plan}
            style={{
              backgroundColor: "#f4f4f5",
              padding: "24px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {plan}
            </h3>
            <p style={{ color: "#71717a", fontSize: "14px" }}>
              Try adding feedback to these pricing cards
            </p>
          </div>
        ))}
      </div>

      <div style={{ height: "100vh", position: "relative" }}>
        <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
          ↕ Extra height for scroll testing
        </p>
      </div>
    </main>
  );
}
