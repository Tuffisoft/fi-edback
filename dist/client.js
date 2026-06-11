"use client";
import {
  API_PATH,
  SESSION_COOKIE_NAME
} from "./chunk-SSW72WGR.js";

// src/components/FeedbackRoot.tsx
import { useState as useState3, useEffect as useEffect2 } from "react";

// src/components/FeedbackLauncher.tsx
import { useState as useState2 } from "react";

// src/components/FeedbackOverlay.tsx
import { jsx } from "react/jsx-runtime";
function FeedbackOverlay({ onPinPlaced }) {
  function handleClick(e) {
    const x = e.clientX + window.scrollX;
    const y = e.clientY + window.scrollY;
    onPinPlaced(x, y);
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: handleClick,
      role: "button",
      "aria-label": "Click anywhere to place a feedback pin",
      tabIndex: 0,
      onKeyDown: (e) => {
        if (e.key === "Escape") e.currentTarget.blur();
      },
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9997,
        cursor: "crosshair",
        backgroundColor: "rgba(0, 0, 0, 0.04)"
      }
    }
  );
}

// src/components/FeedbackPinLayer.tsx
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
function FeedbackPinLayer({ pins }) {
  if (pins.length === 0) return null;
  return /* @__PURE__ */ jsx2(Fragment, { children: pins.map((pin) => /* @__PURE__ */ jsx2(
    "div",
    {
      title: "Feedback submitted",
      style: {
        // position: absolute so the pin tracks document-relative coordinates
        position: "absolute",
        left: pin.x - 10,
        top: pin.y - 22,
        zIndex: 9996,
        width: "20px",
        height: "20px",
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        backgroundColor: "#18181b",
        border: "2px solid #fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        pointerEvents: "none"
      }
    },
    pin.id
  )) });
}

// src/components/FeedbackForm.tsx
import { useState, useEffect, useRef } from "react";

// src/lib/session.ts
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function getOrCreateSessionId() {
  if (typeof document === "undefined") return "";
  const cookies = Object.fromEntries(
    document.cookie.split("; ").filter(Boolean).map((c) => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx), c.slice(idx + 1)];
    })
  );
  const existing = cookies[SESSION_COOKIE_NAME];
  if (existing) return existing;
  const id = generateId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toUTCString();
  document.cookie = `${SESSION_COOKIE_NAME}=${id}; expires=${expires}; path=/; SameSite=Lax`;
  return id;
}

// src/components/FeedbackForm.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function FeedbackForm({
  x,
  y,
  projectSlug,
  apiPath,
  onSubmitted,
  onCancelled
}) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const messageRef = useRef(null);
  useEffect(() => {
    messageRef.current?.focus();
  }, []);
  async function handleSubmit(e) {
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
      name: name || void 0,
      email: email || void 0,
      sessionId,
      website
      // honeypot
    };
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.status === 429) {
        setStatus("error");
        setErrorText(
          "Too many submissions \u2014 please wait a moment before trying again."
        );
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorText(
          data.error ?? "Something went wrong. Please try again."
        );
        return;
      }
      setStatus("success");
      const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      setTimeout(() => {
        onSubmitted({ id, x, y });
      }, 900);
    } catch {
      setStatus("error");
      setErrorText(
        "Network error \u2014 please check your connection and try again."
      );
    }
  }
  const viewportX = x - window.scrollX;
  const viewportY = y - window.scrollY;
  const formWidth = 300;
  const formHeight = 320;
  const left = Math.min(viewportX + 14, window.innerWidth - formWidth - 12);
  const top = Math.min(viewportY + 14, window.innerHeight - formHeight - 12);
  const inputStyle = {
    width: "100%",
    border: "1px solid #e4e4e7",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "system-ui, sans-serif",
    color: "#18181b",
    backgroundColor: "#fff"
  };
  return /* @__PURE__ */ jsx3(
    "div",
    {
      role: "dialog",
      "aria-label": "Leave feedback",
      style: {
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
        fontSize: "14px"
      },
      children: status === "success" ? /* @__PURE__ */ jsxs(
        "div",
        {
          style: { textAlign: "center", padding: "20px 0", color: "#16a34a" },
          children: [
            /* @__PURE__ */ jsx3("div", { style: { fontSize: "28px", marginBottom: "8px" }, children: "\u2713" }),
            /* @__PURE__ */ jsx3("div", { style: { fontWeight: "600", color: "#18181b" }, children: "Feedback sent!" }),
            /* @__PURE__ */ jsx3("div", { style: { color: "#71717a", fontSize: "13px", marginTop: "4px" }, children: "Thanks for taking the time." })
          ]
        }
      ) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsx3(
          "div",
          {
            style: {
              marginBottom: "12px",
              fontWeight: "600",
              color: "#18181b",
              fontSize: "14px"
            },
            children: "Leave feedback"
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "none" }, "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx3("label", { htmlFor: "fi-website", children: "Website" }),
          /* @__PURE__ */ jsx3(
            "input",
            {
              id: "fi-website",
              type: "text",
              value: website,
              onChange: (e) => setWebsite(e.target.value),
              tabIndex: -1,
              autoComplete: "off"
            }
          )
        ] }),
        /* @__PURE__ */ jsx3("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ jsx3(
          "textarea",
          {
            ref: messageRef,
            value: message,
            onChange: (e) => setMessage(e.target.value),
            placeholder: "Describe the issue or feedback\u2026",
            required: true,
            rows: 3,
            style: { ...inputStyle, resize: "vertical" }
          }
        ) }),
        /* @__PURE__ */ jsx3("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ jsx3(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "Name (optional)",
            style: inputStyle
          }
        ) }),
        /* @__PURE__ */ jsx3("div", { style: { marginBottom: "14px" }, children: /* @__PURE__ */ jsx3(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "Email (optional)",
            style: inputStyle
          }
        ) }),
        errorText && /* @__PURE__ */ jsx3(
          "div",
          {
            style: {
              marginBottom: "10px",
              color: "#ef4444",
              fontSize: "12px",
              lineHeight: "1.4"
            },
            children: errorText
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: { display: "flex", gap: "8px", justifyContent: "flex-end" },
            children: [
              /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "button",
                  onClick: onCancelled,
                  style: {
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: "1px solid #e4e4e7",
                    backgroundColor: "transparent",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "#71717a",
                    fontFamily: "system-ui, sans-serif"
                  },
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "submit",
                  disabled: status === "submitting" || !message.trim(),
                  style: {
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#18181b",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: status === "submitting" || !message.trim() ? "not-allowed" : "pointer",
                    opacity: status === "submitting" || !message.trim() ? 0.5 : 1,
                    fontFamily: "system-ui, sans-serif"
                  },
                  children: status === "submitting" ? "Sending\u2026" : "Send"
                }
              )
            ]
          }
        )
      ] })
    }
  );
}

// src/components/FeedbackLauncher.tsx
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function FeedbackLauncher({ projectSlug }) {
  const [isActive, setIsActive] = useState2(false);
  const [pins, setPins] = useState2([]);
  const [pendingPin, setPendingPin] = useState2(
    null
  );
  function handleActivate() {
    setIsActive(true);
  }
  function handleDeactivate() {
    setIsActive(false);
    setPendingPin(null);
  }
  function handlePinPlaced(x, y) {
    setIsActive(false);
    setPendingPin({ x, y });
  }
  function handleFormSubmitted(pin) {
    setPins((prev) => [...prev, pin]);
    setPendingPin(null);
  }
  function handleFormCancelled() {
    setPendingPin(null);
  }
  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
    !isActive && !pendingPin && /* @__PURE__ */ jsx4(
      "button",
      {
        onClick: handleActivate,
        "aria-label": "Open feedback tool",
        style: {
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9998,
          backgroundColor: "#18181b",
          color: "#fff",
          border: "none",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.01em"
        },
        children: "Feedback"
      }
    ),
    isActive && /* @__PURE__ */ jsx4(
      "button",
      {
        onClick: handleDeactivate,
        "aria-label": "Cancel feedback",
        style: {
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          backgroundColor: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "system-ui, sans-serif"
        },
        children: "Cancel"
      }
    ),
    isActive && /* @__PURE__ */ jsx4(FeedbackOverlay, { onPinPlaced: handlePinPlaced }),
    /* @__PURE__ */ jsx4(FeedbackPinLayer, { pins }),
    pendingPin && /* @__PURE__ */ jsx4(
      FeedbackForm,
      {
        x: pendingPin.x,
        y: pendingPin.y,
        projectSlug,
        apiPath: API_PATH,
        onSubmitted: handleFormSubmitted,
        onCancelled: handleFormCancelled
      }
    )
  ] });
}

// src/components/FeedbackRoot.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function FeedbackRoot() {
  const [mounted, setMounted] = useState3(false);
  useEffect2(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") return null;
  const projectSlug = process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG;
  if (!projectSlug) return null;
  return /* @__PURE__ */ jsx5(FeedbackLauncher, { projectSlug });
}
export {
  FeedbackRoot
};
