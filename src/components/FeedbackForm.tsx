"use client";

import { useState, useEffect, useRef } from "react";
import { getOrCreateSessionId } from "../lib/session";
import type { Language } from "../lib/i18n";
import { getTranslations } from "../lib/i18n";

interface Pin {
  id: string;
  x: number;
  y: number;
}

interface FeedbackFormProps {
  /** Document-relative X coordinate of the pin */
  x: number;
  /** Document-relative Y coordinate of the pin */
  y: number;
  projectSlug: string;
  apiPath: string;
  language: Language;
  onSubmitted: (pin: Pin) => void;
  onCancelled: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackForm({
  x,
  y,
  projectSlug,
  apiPath,
  language,
  onSubmitted,
  onCancelled,
}: FeedbackFormProps) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — always stays empty for real users
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const t = getTranslations(language);

  useEffect(() => {
    messageRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorText("");

    const sessionId = getOrCreateSessionId();

    const payload = {
      projectSlug,
      pageUrl: window.location.href,
      x,
      y,
      message,
      name: name || undefined,
      email: email || undefined,
      sessionId,
      website, // honeypot
    };

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setStatus("error");
        setErrorText(
          "Too many submissions — please wait a moment before trying again.",
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorText(
          (data as { error?: string }).error ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      setStatus("success");
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      setTimeout(() => {
        onSubmitted({ id, x, y });
      }, 900);
    } catch {
      setStatus("error");
      setErrorText(
        "Network error — please check your connection and try again.",
      );
    }
  }

  // Convert document-relative pin coordinates back to viewport-relative so the
  // form can be positioned with `position: fixed`.
  const viewportX = x - window.scrollX;
  const viewportY = y - window.scrollY;

  // Keep the form inside the viewport
  const formWidth = 300;
  const formHeight = 320;
  const left = Math.min(viewportX + 14, window.innerWidth - formWidth - 12);
  const top = Math.min(viewportY + 14, window.innerHeight - formHeight - 12);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e4e4e7",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "system-ui, sans-serif",
    color: "#18181b",
    backgroundColor: "#fff",
  };

  return (
    <div
      role="dialog"
      aria-label="Leave feedback"
      style={{
        position: "fixed",
        zIndex: 9999,
        top,
        left,
        width: `${formWidth}px`,
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        padding: "16px",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
      }}
    >
      {status === "success" ? (
        <div
          style={{ textAlign: "center", padding: "20px 0", color: "#16a34a" }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>✓</div>
          <div style={{ fontWeight: "600", color: "#18181b" }}>
            {t.successMessage}
          </div>
          <div style={{ color: "#71717a", fontSize: "13px", marginTop: "4px" }}>
            {t.successDescription}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              marginBottom: "12px",
              fontWeight: "600",
              color: "#18181b",
              fontSize: "14px",
            }}
          >
            {t.feedbackButton}
          </div>

          {/* Honeypot — visually hidden from real users */}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="fi-website">Website</label>
            <input
              id="fi-website"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <textarea
              ref={messageRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              required
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.nameLabel}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailLabel}
              style={inputStyle}
            />
          </div>

          {errorText && (
            <div
              style={{
                marginBottom: "10px",
                color: "#ef4444",
                fontSize: "12px",
                lineHeight: "1.4",
              }}
            >
              {errorText}
            </div>
          )}

          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onCancelled}
              style={{
                padding: "7px 14px",
                borderRadius: "6px",
                border: "1px solid #e4e4e7",
                backgroundColor: "transparent",
                fontSize: "13px",
                cursor: "pointer",
                color: "#71717a",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {t.cancelButton}
            </button>
            <button
              type="submit"
              disabled={status === "submitting" || !message.trim()}
              style={{
                padding: "7px 14px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#18181b",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "500",
                cursor:
                  status === "submitting" || !message.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity: status === "submitting" || !message.trim() ? 0.5 : 1,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {status === "submitting" ? t.submitting : t.submitButton}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
