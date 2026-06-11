export default function DevPage() {
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
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
        fi-edback dev harness
      </h1>
      <p style={{ color: "#71717a", lineHeight: "1.6", marginBottom: "24px" }}>
        The floating <strong>Feedback</strong> button appears in the
        bottom-right corner when{" "}
        <code
          style={{
            backgroundColor: "#f4f4f5",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          NEXT_PUBLIC_ENABLE_FEEDBACK=true
        </code>{" "}
        is set in{" "}
        <code
          style={{
            backgroundColor: "#f4f4f5",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          dev/.env.local
        </code>
        .
      </p>
      <ol style={{ lineHeight: "2", color: "#52525b" }}>
        <li>Click the Feedback button to enter feedback mode.</li>
        <li>Click anywhere on this page to place a pin.</li>
        <li>Fill in the form and submit.</li>
        <li>Check your Neon database — a row should appear in fi_feedback.</li>
      </ol>

      {/* Extra page height so you can test scroll-aware coordinate capture */}
      <div style={{ height: "200vh", marginTop: "48px", position: "relative" }}>
        <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
          ↕ Scroll down and place a pin to test document-relative coordinates.
        </p>
        <p
          style={{
            position: "absolute",
            top: "50%",
            color: "#a1a1aa",
            fontSize: "13px",
          }}
        >
          — mid-page marker —
        </p>
        <p
          style={{
            position: "absolute",
            bottom: "24px",
            color: "#a1a1aa",
            fontSize: "13px",
          }}
        >
          — bottom of extended area —
        </p>
      </div>
    </main>
  );
}
