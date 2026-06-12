"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  FeedbackRoot: () => FeedbackRoot
});
module.exports = __toCommonJS(client_exports);

// src/components/FeedbackRoot.tsx
var import_react4 = require("react");

// src/components/FeedbackLauncher.tsx
var import_react3 = require("react");

// src/lib/i18n.ts
var translations = {
  en: {
    feedbackButton: "Feedback",
    cancelButton: "Cancel",
    messagePlaceholder: "What would you like to tell us?",
    messageLabel: "Message",
    nameLabel: "Name (optional)",
    emailLabel: "Email (optional)",
    submitButton: "Send feedback",
    submitting: "Sending...",
    successMessage: "Thank you!",
    successDescription: "Your feedback has been submitted.",
    errorTitle: "Error",
    clickToPlace: "Click anywhere to place a feedback pin",
    feedbackSubmitted: "Feedback submitted",
    deleteFeedback: "Delete feedback",
    by: "by",
    anonymous: "Anonymous"
  },
  de: {
    feedbackButton: "Feedback",
    cancelButton: "Abbrechen",
    messagePlaceholder: "Was m\xF6chten Sie uns mitteilen?",
    messageLabel: "Nachricht",
    nameLabel: "Name (optional)",
    emailLabel: "E-Mail (optional)",
    submitButton: "Feedback senden",
    submitting: "Wird gesendet...",
    successMessage: "Vielen Dank!",
    successDescription: "Ihr Feedback wurde \xFCbermittelt.",
    errorTitle: "Fehler",
    clickToPlace: "Klicken Sie \xFCberall, um einen Feedback-Pin zu platzieren",
    feedbackSubmitted: "Feedback \xFCbermittelt",
    deleteFeedback: "Feedback l\xF6schen",
    by: "von",
    anonymous: "Anonym"
  }
};
function getTranslations(lang) {
  return translations[lang];
}

// src/components/FeedbackOverlay.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function FeedbackOverlay({ language, onPinPlaced }) {
  const t = getTranslations(language);
  function handleClick(e) {
    const x = e.clientX + window.scrollX;
    const y = e.clientY + window.scrollY;
    onPinPlaced(x, y);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      onClick: handleClick,
      role: "button",
      "aria-label": t.clickToPlace,
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
var import_jsx_runtime2 = require("react/jsx-runtime");
function FeedbackPinLayer({
  pins,
  onPinClick,
  title = "Feedback submitted"
}) {
  if (pins.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: pins.map((pin) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      title,
      onClick: (e) => {
        if (onPinClick) {
          e.stopPropagation();
          onPinClick(pin.id);
        }
      },
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
        pointerEvents: onPinClick ? "auto" : "none",
        cursor: onPinClick ? "pointer" : "default",
        transition: "transform 0.15s ease"
      },
      onMouseEnter: (e) => {
        if (onPinClick) {
          e.currentTarget.style.transform = "rotate(-45deg) scale(1.1)";
        }
      },
      onMouseLeave: (e) => {
        if (onPinClick) {
          e.currentTarget.style.transform = "rotate(-45deg) scale(1)";
        }
      }
    },
    pin.id
  )) });
}

// src/components/FeedbackForm.tsx
var import_react = require("react");

// src/lib/config.ts
var API_PATH = "/api/fi-edback";
var SESSION_COOKIE_NAME = "fi_session";

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
var import_jsx_runtime3 = require("react/jsx-runtime");
function FeedbackForm({
  x,
  y,
  projectSlug,
  apiPath,
  language,
  onSubmitted,
  onCancelled
}) {
  const [message, setMessage] = (0, import_react.useState)("");
  const [name, setName] = (0, import_react.useState)("");
  const [email, setEmail] = (0, import_react.useState)("");
  const [website, setWebsite] = (0, import_react.useState)("");
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [errorText, setErrorText] = (0, import_react.useState)("");
  const messageRef = (0, import_react.useRef)(null);
  const t = getTranslations(language);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
      children: status === "success" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          style: { textAlign: "center", padding: "20px 0", color: "#16a34a" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: "28px", marginBottom: "8px" }, children: "\u2713" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontWeight: "600", color: "#18181b" }, children: t.successMessage }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { color: "#71717a", fontSize: "13px", marginTop: "4px" }, children: t.successDescription })
          ]
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "div",
          {
            style: {
              marginBottom: "12px",
              fontWeight: "600",
              color: "#18181b",
              fontSize: "14px"
            },
            children: t.feedbackButton
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "none" }, "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "fi-website", children: "Website" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "textarea",
          {
            ref: messageRef,
            value: message,
            onChange: (e) => setMessage(e.target.value),
            placeholder: t.messagePlaceholder,
            required: true,
            rows: 3,
            style: { ...inputStyle, resize: "vertical" }
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: t.nameLabel,
            style: inputStyle
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { marginBottom: "14px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: t.emailLabel,
            style: inputStyle
          }
        ) }),
        errorText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            style: { display: "flex", gap: "8px", justifyContent: "flex-end" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                  children: t.cancelButton
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                  children: status === "submitting" ? t.submitting : t.submitButton
                }
              )
            ]
          }
        )
      ] })
    }
  );
}

// src/components/FeedbackPopup.tsx
var import_react2 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function FeedbackPopup({
  feedback,
  apiPath,
  language,
  onDeleted,
  onClose
}) {
  const [isDeleting, setIsDeleting] = (0, import_react2.useState)(false);
  const t = getTranslations(language);
  async function handleDelete() {
    if (isDeleting) return;
    if (!confirm(t.deleteFeedback + "?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiPath}?id=${feedback.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onDeleted(feedback.id);
      } else {
        alert(t.errorTitle);
        setIsDeleting(false);
      }
    } catch {
      alert(t.errorTitle);
      setIsDeleting(false);
    }
  }
  const viewportX = feedback.x - window.scrollX;
  const viewportY = feedback.y - window.scrollY;
  const popupWidth = 300;
  const popupMaxHeight = 400;
  const left = Math.min(viewportX + 14, window.innerWidth - popupWidth - 12);
  const top = Math.min(viewportY + 14, window.innerHeight - popupMaxHeight - 12);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        onClick: onClose,
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "transparent"
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        role: "dialog",
        "aria-label": "Feedback details",
        style: {
          position: "fixed",
          zIndex: 9999,
          top,
          left,
          width: `${popupWidth}px`,
          maxHeight: `${popupMaxHeight}px`,
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
          padding: "16px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          overflow: "auto"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              onClick: onClose,
              "aria-label": "Close",
              style: {
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "24px",
                height: "24px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: "1",
                color: "#71717a",
                padding: 0
              },
              children: "\xD7"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
            "div",
            {
              style: {
                fontSize: "12px",
                color: "#71717a",
                marginBottom: "12px",
                paddingRight: "24px"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                  t.by,
                  " ",
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { style: { color: "#18181b" }, children: feedback.name || t.anonymous })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { marginTop: "4px" }, children: new Date(feedback.createdAt).toLocaleString(
                  language === "de" ? "de-DE" : "en-US",
                  {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }
                ) })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "div",
            {
              style: {
                marginBottom: "16px",
                lineHeight: "1.5",
                color: "#18181b",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              },
              children: feedback.message
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              onClick: handleDelete,
              disabled: isDeleting,
              style: {
                width: "100%",
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: isDeleting ? "not-allowed" : "pointer",
                opacity: isDeleting ? 0.6 : 1,
                fontFamily: "system-ui, sans-serif"
              },
              children: isDeleting ? "..." : t.deleteFeedback
            }
          )
        ]
      }
    )
  ] });
}

// src/components/FeedbackLauncher.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function FeedbackLauncher({ projectSlug }) {
  const [language, setLanguage] = (0, import_react3.useState)("en");
  const [isActive, setIsActive] = (0, import_react3.useState)(false);
  const [pins, setPins] = (0, import_react3.useState)([]);
  const [fullFeedback, setFullFeedback] = (0, import_react3.useState)([]);
  const [pendingPin, setPendingPin] = (0, import_react3.useState)(
    null
  );
  const [selectedFeedbackId, setSelectedFeedbackId] = (0, import_react3.useState)(
    null
  );
  const [isLoading, setIsLoading] = (0, import_react3.useState)(true);
  const t = getTranslations(language);
  (0, import_react3.useEffect)(() => {
    async function fetchFeedback() {
      try {
        const params = new URLSearchParams({
          projectSlug,
          pageUrl: window.location.href
        });
        const res = await fetch(`${API_PATH}?${params}`);
        if (res.ok) {
          const data = await res.json();
          setFullFeedback(data.feedback);
          setPins(
            data.feedback.map((f) => ({ id: f.id, x: f.x, y: f.y }))
          );
        }
      } catch (error) {
        console.error("[fi-edback] Failed to fetch feedback:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeedback();
  }, [projectSlug]);
  function handleActivate() {
    setIsActive(true);
    setSelectedFeedbackId(null);
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
  function handlePinClick(id) {
    setSelectedFeedbackId(id);
  }
  function handlePopupClose() {
    setSelectedFeedbackId(null);
  }
  function handleFeedbackDeleted(id) {
    setPins((prev) => prev.filter((p) => p.id !== id));
    setFullFeedback((prev) => prev.filter((f) => f.id !== id));
    setSelectedFeedbackId(null);
  }
  function toggleLanguage() {
    setLanguage((prev) => prev === "en" ? "de" : "en");
  }
  const selectedFeedback = fullFeedback.find(
    (f) => f.id === selectedFeedbackId
  );
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    !isActive && !pendingPin && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "button",
      {
        onClick: toggleLanguage,
        "aria-label": "Switch language",
        style: {
          position: "fixed",
          bottom: "24px",
          right: "140px",
          zIndex: 9998,
          backgroundColor: "#fff",
          color: "#18181b",
          border: "1px solid #e4e4e7",
          borderRadius: "6px",
          padding: "6px 10px",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontFamily: "system-ui, sans-serif"
        },
        children: [
          language === "en" ? "EN" : "DE",
          " | ",
          language === "en" ? "DE" : "EN"
        ]
      }
    ),
    !isActive && !pendingPin && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        children: t.feedbackButton
      }
    ),
    isActive && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        children: t.cancelButton
      }
    ),
    isActive && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FeedbackOverlay, { language, onPinPlaced: handlePinPlaced }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      FeedbackPinLayer,
      {
        pins,
        onPinClick: handlePinClick,
        title: t.feedbackSubmitted
      }
    ),
    pendingPin && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      FeedbackForm,
      {
        x: pendingPin.x,
        y: pendingPin.y,
        projectSlug,
        apiPath: API_PATH,
        language,
        onSubmitted: handleFormSubmitted,
        onCancelled: handleFormCancelled
      }
    ),
    selectedFeedback && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      FeedbackPopup,
      {
        feedback: selectedFeedback,
        apiPath: API_PATH,
        language,
        onDeleted: handleFeedbackDeleted,
        onClose: handlePopupClose
      }
    )
  ] });
}

// src/components/FeedbackRoot.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function FeedbackRoot() {
  const [mounted, setMounted] = (0, import_react4.useState)(false);
  (0, import_react4.useEffect)(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") return null;
  const projectSlug = process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG;
  if (!projectSlug) return null;
  if (window.innerWidth < 768) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FeedbackLauncher, { projectSlug });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FeedbackRoot
});
