"use client";

// src/components/FeedbackRoot.tsx
import { useState as useState5, useEffect as useEffect4 } from "react";

// src/components/FeedbackLauncher.tsx
import { useState as useState4, useEffect as useEffect3 } from "react";

// src/lib/i18n.ts
var translations = {
  en: {
    feedbackButton: "Leave Feedback",
    cancelButton: "Cancel",
    instructionText: "Leave feedback (preview tool \u2014 not visible in production)",
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
    anonymous: "Anonymous",
    reactions: "Reactions",
    pinColor: "Pin color",
    exportCSV: "Export CSV",
    hideAll: "Hide all feedback",
    showAll: "Show feedback tools"
  },
  de: {
    feedbackButton: "Feedback geben",
    cancelButton: "Abbrechen",
    instructionText: "Feedback geben (Vorschau-Tool \u2014 nicht in Produktion sichtbar)",
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
    anonymous: "Anonym",
    reactions: "Reaktionen",
    pinColor: "Pin-Farbe",
    exportCSV: "CSV exportieren",
    hideAll: "Alles ausblenden",
    showAll: "Feedback-Tools anzeigen"
  },
  ga: {
    feedbackButton: "F\xE1g Aiseolas",
    cancelButton: "Cealaigh",
    instructionText: "F\xE1g aiseolas (uirlis r\xE9amhamhairc \u2014 nach bhfeicfear sa t\xE1irgeadh)",
    messagePlaceholder: "Cad ba mhaith leat a r\xE1 linn?",
    messageLabel: "Teachtaireacht",
    nameLabel: "Ainm (roghnach)",
    emailLabel: "R\xEDomhphost (roghnach)",
    submitButton: "Seol aiseolas",
    submitting: "\xC1 sheoladh...",
    successMessage: "Go raibh maith agat!",
    successDescription: "Seoladh d'aiseolas.",
    errorTitle: "Earr\xE1id",
    clickToPlace: "Clice\xE1il \xE1it ar bith chun bior\xE1in aiseolais a chur",
    feedbackSubmitted: "Aiseolas seolta",
    deleteFeedback: "Scrios aiseolas",
    by: "le",
    anonymous: "Gan ainm",
    reactions: "Imoibrithe",
    pinColor: "Dath bior\xE1in",
    exportCSV: "Easp\xF3rt\xE1il CSV",
    hideAll: "Folaigh gach aiseolas",
    showAll: "Taispe\xE1in uirlis\xED aiseolais"
  }
};
function getTranslations(lang) {
  return translations[lang];
}

// src/components/FeedbackOverlay.tsx
import { jsx } from "react/jsx-runtime";
function getDeviceType(width) {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
function FeedbackOverlay({
  language,
  onPinPlaced
}) {
  const t = getTranslations(language);
  function handleClick(e) {
    const x = e.clientX + window.scrollX;
    const y = e.clientY + window.scrollY;
    const viewportWidth = window.innerWidth;
    const deviceType = getDeviceType(viewportWidth);
    onPinPlaced(x, y, viewportWidth, deviceType);
  }
  return /* @__PURE__ */ jsx(
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
import { useState, useRef, useEffect } from "react";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function getDeviceIcon(deviceType) {
  if (!deviceType) return "\u{1F4CD}";
  if (deviceType === "mobile") return "\u{1F4F1}";
  if (deviceType === "tablet") return "\u{1F4F1}";
  return "\u{1F4BB}";
}
function getOpacity(pinViewportWidth, currentViewportWidth) {
  if (!pinViewportWidth || !currentViewportWidth) return 1;
  const diff = Math.abs(pinViewportWidth - currentViewportWidth);
  if (diff > 300) return 0.5;
  if (diff > 150) return 0.75;
  return 1;
}
function FeedbackPinLayer({
  pins,
  onPinClick,
  onPinMoved,
  title = "Feedback submitted",
  currentViewportWidth = window.innerWidth
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const longPressTimer = useRef(null);
  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (clientX, clientY) => {
      hasMoved.current = true;
      const x = clientX + window.scrollX - dragOffset.x;
      const y = clientY + window.scrollY - dragOffset.y;
      setTempPosition({ x, y });
    };
    const handleMouseMove = (e) => {
      handleMove(e.clientX, e.clientY);
    };
    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };
    const handleEnd = () => {
      if (draggingId && tempPosition && hasMoved.current) {
        if (onPinMoved) {
          onPinMoved(draggingId, tempPosition.x, tempPosition.y);
        }
      }
      setDraggingId(null);
      setTempPosition(null);
      hasMoved.current = false;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [draggingId, dragOffset, tempPosition, onPinMoved]);
  if (pins.length === 0) return null;
  return /* @__PURE__ */ jsx2(Fragment, { children: pins.map((pin) => {
    const isDragging = draggingId === pin.id;
    const position = isDragging && tempPosition ? tempPosition : { x: pin.x, y: pin.y };
    const handleStart = (clientX, clientY) => {
      hasMoved.current = false;
      const pinCenterX = pin.x;
      const pinCenterY = pin.y;
      const offsetX = clientX + window.scrollX - pinCenterX;
      const offsetY = clientY + window.scrollY - pinCenterY;
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggingId(pin.id);
      dragStartPos.current = { x: clientX, y: clientY };
    };
    const opacity = getOpacity(pin.viewportWidth, currentViewportWidth);
    const deviceIcon = getDeviceIcon(pin.deviceType);
    const pinTitle = pin.deviceType ? `${title} (${pin.deviceType}, ${pin.viewportWidth}px)` : title;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          position: "absolute",
          left: position.x - 10,
          top: position.y - 35,
          zIndex: isDragging ? 9998 : 9996,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity,
          transition: isDragging ? "none" : "opacity 0.2s ease"
        },
        children: [
          /* @__PURE__ */ jsx2(
            "div",
            {
              style: {
                fontSize: "12px",
                lineHeight: "1",
                marginBottom: "2px",
                userSelect: "none",
                filter: isDragging ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none"
              },
              children: deviceIcon
            }
          ),
          /* @__PURE__ */ jsx2(
            "div",
            {
              title: pinTitle,
              onMouseDown: (e) => {
                e.stopPropagation();
                handleStart(e.clientX, e.clientY);
              },
              onTouchStart: (e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                handleStart(touch.clientX, touch.clientY);
              },
              onClick: (e) => {
                if (!hasMoved.current && onPinClick) {
                  e.stopPropagation();
                  onPinClick(pin.id);
                }
              },
              style: {
                width: "20px",
                height: "20px",
                borderRadius: "50% 50% 50% 0",
                transform: isDragging ? "rotate(-45deg) scale(1.15)" : "rotate(-45deg)",
                backgroundColor: pin.pinColor || "#18181b",
                border: "2px solid #fff",
                boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.3)",
                cursor: isDragging ? "grabbing" : "grab",
                transition: isDragging ? "none" : "transform 0.15s ease, box-shadow 0.15s ease",
                userSelect: "none"
              },
              onMouseEnter: (e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = "rotate(-45deg) scale(1.1)";
                }
              },
              onMouseLeave: (e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = "rotate(-45deg) scale(1)";
                }
              }
            }
          )
        ]
      },
      pin.id
    );
  }) });
}

// src/components/FeedbackForm.tsx
import { useState as useState2, useEffect as useEffect2, useRef as useRef2 } from "react";

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
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var PIN_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ef4444", label: "Red" },
  { value: "#a855f7", label: "Purple" }
];
function FeedbackForm({
  x,
  y,
  projectSlug,
  apiPath,
  language,
  viewportWidth,
  deviceType,
  onSubmitted,
  onCancelled
}) {
  const [message, setMessage] = useState2("");
  const [name, setName] = useState2("");
  const [email, setEmail] = useState2("");
  const [pinColor, setPinColor] = useState2("#3b82f6");
  const [website, setWebsite] = useState2("");
  const [status, setStatus] = useState2("idle");
  const [errorText, setErrorText] = useState2("");
  const messageRef = useRef2(null);
  const t = getTranslations(language);
  useEffect2(() => {
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
      website,
      // honeypot
      viewportWidth,
      deviceType,
      pinColor
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
        const data2 = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorText(
          data2.error ?? "Something went wrong. Please try again."
        );
        return;
      }
      const data = await res.json();
      setStatus("success");
      setTimeout(() => {
        onSubmitted(data.feedback);
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
  const isMobile = window.innerWidth < 640;
  const formWidth = isMobile ? Math.min(window.innerWidth - 24, 300) : 300;
  const formHeight = 320;
  const left = isMobile ? 12 : Math.min(viewportX + 14, window.innerWidth - formWidth - 12);
  const top = isMobile ? Math.min(
    window.innerHeight - formHeight - 12,
    window.innerHeight / 2 - formHeight / 2
  ) : Math.min(viewportY + 14, window.innerHeight - formHeight - 12);
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
      children: status === "success" ? /* @__PURE__ */ jsxs2(
        "div",
        {
          style: { textAlign: "center", padding: "20px 0", color: "#16a34a" },
          children: [
            /* @__PURE__ */ jsx3("div", { style: { fontSize: "28px", marginBottom: "8px" }, children: "\u2713" }),
            /* @__PURE__ */ jsx3("div", { style: { fontWeight: "600", color: "#18181b" }, children: t.successMessage }),
            /* @__PURE__ */ jsx3("div", { style: { color: "#71717a", fontSize: "13px", marginTop: "4px" }, children: t.successDescription })
          ]
        }
      ) : /* @__PURE__ */ jsxs2("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsx3(
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
        /* @__PURE__ */ jsxs2("div", { style: { display: "none" }, "aria-hidden": "true", children: [
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
        /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsx3(
            "div",
            {
              style: {
                fontSize: "12px",
                color: "#71717a",
                marginBottom: "6px",
                fontWeight: "500"
              },
              children: t.pinColor
            }
          ),
          /* @__PURE__ */ jsx3("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: PIN_COLORS.map((color) => /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
              onClick: () => setPinColor(color.value),
              "aria-label": color.label,
              title: color.label,
              style: {
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: color.value,
                border: pinColor === color.value ? "3px solid #18181b" : "2px solid #e4e4e7",
                cursor: "pointer",
                boxShadow: pinColor === color.value ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
                transition: "all 0.15s ease",
                transform: pinColor === color.value ? "scale(1.1)" : "scale(1)"
              },
              onMouseEnter: (e) => {
                if (pinColor !== color.value) {
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              },
              onMouseLeave: (e) => {
                if (pinColor !== color.value) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }
            },
            color.value
          )) })
        ] }),
        /* @__PURE__ */ jsx3("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ jsx3(
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
        /* @__PURE__ */ jsx3("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ jsx3(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: t.nameLabel,
            style: inputStyle
          }
        ) }),
        /* @__PURE__ */ jsx3("div", { style: { marginBottom: "14px" }, children: /* @__PURE__ */ jsx3(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: t.emailLabel,
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
        /* @__PURE__ */ jsxs2(
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
                  children: t.cancelButton
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
import { useState as useState3 } from "react";
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var REACTIONS = ["\u{1F44D}", "\u2705", "\u2764\uFE0F", "\u{1F525}", "\u{1F440}"];
function FeedbackPopup({
  feedback,
  apiPath,
  language,
  onDeleted,
  onReactionToggled,
  onClose
}) {
  const [isDeleting, setIsDeleting] = useState3(false);
  const [reactingTo, setReactingTo] = useState3(null);
  const t = getTranslations(language);
  async function handleReaction(reaction) {
    if (reactingTo) return;
    setReactingTo(reaction);
    const sessionId = getOrCreateSessionId();
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: feedback.id,
          reaction,
          sessionId
        })
      });
      if (res.ok) {
        const data = await res.json();
        onReactionToggled(feedback.id, reaction, data.added);
      }
    } catch (error) {
      console.error("[fi-edback] Failed to toggle reaction:", error);
    } finally {
      setReactingTo(null);
    }
  }
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
  const isMobile = window.innerWidth < 640;
  const popupWidth = isMobile ? Math.min(window.innerWidth - 24, 300) : 300;
  const popupMaxHeight = 400;
  const left = isMobile ? 12 : Math.min(viewportX + 14, window.innerWidth - popupWidth - 12);
  const top = isMobile ? Math.min(
    window.innerHeight - popupMaxHeight - 12,
    window.innerHeight / 2 - popupMaxHeight / 2
  ) : Math.min(viewportY + 14, window.innerHeight - popupMaxHeight - 12);
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx4(
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
    /* @__PURE__ */ jsxs3(
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
          /* @__PURE__ */ jsx4(
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
          /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                fontSize: "12px",
                color: "#71717a",
                marginBottom: "12px",
                paddingRight: "24px"
              },
              children: [
                /* @__PURE__ */ jsxs3("div", { children: [
                  t.by,
                  " ",
                  /* @__PURE__ */ jsx4("strong", { style: { color: "#18181b" }, children: feedback.name || t.anonymous })
                ] }),
                /* @__PURE__ */ jsx4("div", { style: { marginTop: "4px" }, children: new Date(feedback.createdAt).toLocaleString(
                  language === "de" ? "de-DE" : "en-US",
                  {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }
                ) }),
                feedback.deviceType && feedback.viewportWidth && /* @__PURE__ */ jsxs3("div", { style: { marginTop: "4px", opacity: 0.8 }, children: [
                  feedback.deviceType === "mobile" && "\u{1F4F1}",
                  feedback.deviceType === "tablet" && "\u{1F4F1}",
                  feedback.deviceType === "desktop" && "\u{1F4BB}",
                  " ",
                  feedback.deviceType,
                  " ",
                  "(",
                  feedback.viewportWidth,
                  "px)",
                  feedback.pinColor && /* @__PURE__ */ jsx4(
                    "span",
                    {
                      style: {
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: feedback.pinColor,
                        border: "1px solid #e4e4e7",
                        marginLeft: "6px",
                        verticalAlign: "middle"
                      },
                      title: `Pin color: ${feedback.pinColor}`
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx4(
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
          /* @__PURE__ */ jsxs3("div", { style: { marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsx4(
              "div",
              {
                style: {
                  fontSize: "12px",
                  color: "#71717a",
                  marginBottom: "8px",
                  fontWeight: "500"
                },
                children: t.reactions
              }
            ),
            /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" }, children: REACTIONS.map((reaction) => {
              const summary = feedback.reactions?.find(
                (r) => r.reaction === reaction
              );
              const count = summary?.count || 0;
              const hasReacted = summary?.hasReacted || false;
              return /* @__PURE__ */ jsxs3(
                "button",
                {
                  onClick: () => handleReaction(reaction),
                  disabled: reactingTo !== null,
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    backgroundColor: hasReacted ? "#e0e7ff" : "#f4f4f5",
                    border: hasReacted ? "2px solid #6366f1" : "1px solid #e4e4e7",
                    borderRadius: "16px",
                    fontSize: "14px",
                    cursor: reactingTo ? "not-allowed" : "pointer",
                    opacity: reactingTo ? 0.6 : 1,
                    fontFamily: "system-ui, sans-serif",
                    transition: "all 0.15s ease"
                  },
                  onMouseEnter: (e) => {
                    if (!reactingTo) {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  },
                  children: [
                    /* @__PURE__ */ jsx4("span", { children: reaction }),
                    count > 0 && /* @__PURE__ */ jsx4(
                      "span",
                      {
                        style: {
                          fontSize: "12px",
                          color: hasReacted ? "#6366f1" : "#71717a",
                          fontWeight: "600"
                        },
                        children: count
                      }
                    )
                  ]
                },
                reaction
              );
            }) })
          ] }),
          /* @__PURE__ */ jsx4(
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
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function FeedbackLauncher({ projectSlug }) {
  const [language, setLanguage] = useState4("en");
  const [isActive, setIsActive] = useState4(false);
  const [isAllHidden, setIsAllHidden] = useState4(false);
  const [pins, setPins] = useState4([]);
  const [fullFeedback, setFullFeedback] = useState4([]);
  const [pendingPin, setPendingPin] = useState4(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState4(
    null
  );
  const [isLoading, setIsLoading] = useState4(true);
  const [currentPath, setCurrentPath] = useState4("");
  const [showCrossDevicePins, setShowCrossDevicePins] = useState4(true);
  const [currentViewportWidth, setCurrentViewportWidth] = useState4(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [isExporting, setIsExporting] = useState4(false);
  const [activeTooltip, setActiveTooltip] = useState4(null);
  useEffect3(() => {
    console.log(
      `[fi-edback] \u{1F504} isAllHidden changed to:`,
      isAllHidden,
      new Error().stack
    );
  }, [isAllHidden]);
  useEffect3(() => {
    console.log(`[fi-edback] \u{1F504} isActive changed to:`, isActive);
  }, [isActive]);
  useEffect3(() => {
    console.log(`[fi-edback] \u{1F504} pendingPin changed:`, !!pendingPin);
  }, [pendingPin]);
  const t = getTranslations(language);
  useEffect3(() => {
    console.log("[fi-edback] FeedbackLauncher mounted");
    console.log("[fi-edback] projectSlug:", projectSlug);
    console.log("[fi-edback] window.innerWidth:", window.innerWidth);
    console.log("[fi-edback] isMobile:", window.innerWidth < 640);
    console.log("[fi-edback] currentPath:", window.location.href);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.hasAttribute("data-fi-edback-grid")) {
            console.error("[fi-edback] \u26D4 GRID CONTAINER REMOVED FROM DOM!", {
              timestamp: Date.now(),
              stackTrace: new Error().stack
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect3(() => {
    const timestamp = Date.now();
    console.log(`[fi-edback] Render state @${timestamp}:`, {
      isAllHidden,
      isActive,
      pendingPin: !!pendingPin,
      pinsCount: pins.length,
      language
    });
    const shouldShowMainUI = !isAllHidden && !isActive && !pendingPin;
    console.log(
      `[fi-edback] Should show main UI @${timestamp}:`,
      shouldShowMainUI
    );
    if (!shouldShowMainUI) {
      console.warn(`[fi-edback] UI HIDDEN because:`, {
        isAllHidden: isAllHidden ? "TRUE - hide-all is active" : "false",
        isActive: isActive ? "TRUE - feedback mode active" : "false",
        pendingPin: !!pendingPin ? "TRUE - form is open" : "false"
      });
    }
    setTimeout(() => {
      const gridContainer = document.querySelector("[data-fi-edback-grid]");
      const monkeyButton = document.querySelector("[data-fi-edback-monkey]");
      const feedbackButton = document.querySelector("[data-fi-edback-button]");
      console.log(`[fi-edback] DOM check @${timestamp}:`, {
        gridContainer: !!gridContainer,
        monkeyButton: !!monkeyButton,
        feedbackButton: !!feedbackButton
      });
      if (gridContainer) {
        const gridStyles = window.getComputedStyle(gridContainer);
        console.log("[fi-edback] Grid container styles:", {
          display: gridStyles.display,
          position: gridStyles.position,
          zIndex: gridStyles.zIndex,
          inset: gridStyles.inset,
          visibility: gridStyles.visibility,
          opacity: gridStyles.opacity
        });
      }
      if (feedbackButton) {
        const buttonStyles = window.getComputedStyle(feedbackButton);
        const rect = feedbackButton.getBoundingClientRect();
        console.log("[fi-edback] Feedback button styles:", {
          display: buttonStyles.display,
          position: buttonStyles.position,
          visibility: buttonStyles.visibility,
          opacity: buttonStyles.opacity,
          zIndex: buttonStyles.zIndex
        });
        console.log("[fi-edback] Feedback button position (rect):", {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        console.log("[fi-edback] Viewport:", {
          width: window.innerWidth,
          height: window.innerHeight
        });
        const elementsAtButtonPos = document.elementsFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        console.log(
          "[fi-edback] Elements at button center:",
          elementsAtButtonPos.map((el) => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            zIndex: window.getComputedStyle(el).zIndex
          }))
        );
      }
    }, 100);
  }, [isAllHidden, isActive, pendingPin, pins.length, language]);
  useEffect3(() => {
    const interval = setInterval(() => {
      const gridContainer = document.querySelector("[data-fi-edback-grid]");
      const shouldExist = !isAllHidden && !isActive && !pendingPin;
      if (shouldExist && !gridContainer) {
        console.error("[fi-edback] \u26A0\uFE0F GRID CONTAINER MISSING from DOM!", {
          isAllHidden,
          isActive,
          pendingPin: !!pendingPin,
          timestamp: Date.now()
        });
      } else if (!shouldExist && gridContainer) {
        console.warn(
          "[fi-edback] Grid container exists but shouldn't (state changed)"
        );
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isAllHidden, isActive, pendingPin]);
  const handleTooltipToggle = (id) => {
    const isMobileCheck = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobileCheck) {
      setActiveTooltip(activeTooltip === id ? null : id);
    }
  };
  useEffect3(() => {
    const isMobileCheck = typeof window !== "undefined" && window.innerWidth < 640;
    if (activeTooltip && isMobileCheck) {
      const timeout = setTimeout(() => {
        setActiveTooltip(null);
      }, 3e3);
      return () => clearTimeout(timeout);
    }
  }, [activeTooltip]);
  useEffect3(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      console.log("[fi-edback] Viewport resize:", {
        oldWidth: currentViewportWidth,
        newWidth,
        heightChanged: window.innerHeight
      });
      setCurrentViewportWidth(newWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentViewportWidth]);
  useEffect3(() => {
    let lastPath = window.location.href;
    setCurrentPath(lastPath);
    const checkUrlChange = () => {
      const newPath = window.location.href;
      if (newPath !== lastPath) {
        lastPath = newPath;
        setCurrentPath(newPath);
      }
    };
    const intervalId = setInterval(checkUrlChange, 100);
    const handlePopState = () => {
      checkUrlChange();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
  useEffect3(() => {
    if (!currentPath) return;
    async function fetchFeedback() {
      setIsLoading(true);
      console.log("[fi-edback] Fetching feedback for:", currentPath);
      try {
        const sessionId = getOrCreateSessionId();
        const params = new URLSearchParams({
          projectSlug,
          pageUrl: currentPath,
          sessionId
        });
        const res = await fetch(`${API_PATH}?${params}`);
        if (res.ok) {
          const data = await res.json();
          console.log(
            "[fi-edback] Received feedback:",
            data.feedback.length,
            "items"
          );
          console.log(
            "[fi-edback] URLs:",
            data.feedback.map((f) => f.pageUrl)
          );
          setFullFeedback(data.feedback);
          setPins(
            data.feedback.map((f) => ({
              id: f.id,
              x: f.x,
              y: f.y,
              viewportWidth: f.viewportWidth,
              deviceType: f.deviceType,
              pinColor: f.pinColor
            }))
          );
        }
      } catch (error) {
        console.error("[fi-edback] Failed to fetch feedback:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeedback();
  }, [projectSlug, currentPath]);
  function handleActivate() {
    setIsActive(true);
    setSelectedFeedbackId(null);
  }
  function handleDeactivate() {
    setIsActive(false);
    setPendingPin(null);
  }
  function handlePinPlaced(x, y, viewportWidth, deviceType) {
    setIsActive(false);
    setPendingPin({ x, y, viewportWidth, deviceType });
  }
  function handleFormSubmitted(feedback) {
    setPins((prev) => [
      ...prev,
      {
        id: feedback.id,
        x: feedback.x,
        y: feedback.y,
        viewportWidth: feedback.viewportWidth,
        deviceType: feedback.deviceType,
        pinColor: feedback.pinColor
      }
    ]);
    setFullFeedback((prev) => [...prev, feedback]);
    setPendingPin(null);
  }
  async function handleExportCSV() {
    setIsExporting(true);
    try {
      const response = await fetch(
        `${API_PATH}?format=csv&projectSlug=${encodeURIComponent(projectSlug)}`
      );
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${projectSlug}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export feedback");
    } finally {
      setIsExporting(false);
    }
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
  function handleReactionToggled(feedbackId, reaction, added) {
    setFullFeedback(
      (prev) => prev.map((f) => {
        if (f.id !== feedbackId) return f;
        const reactions = f.reactions || [];
        const existingIndex = reactions.findIndex(
          (r) => r.reaction === reaction
        );
        if (existingIndex >= 0) {
          const updated = [...reactions];
          if (added) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              count: updated[existingIndex].count + 1,
              hasReacted: true
            };
          } else {
            const newCount = updated[existingIndex].count - 1;
            if (newCount === 0) {
              updated.splice(existingIndex, 1);
            } else {
              updated[existingIndex] = {
                ...updated[existingIndex],
                count: newCount,
                hasReacted: false
              };
            }
          }
          return { ...f, reactions: updated };
        } else {
          return {
            ...f,
            reactions: [...reactions, { reaction, count: 1, hasReacted: true }]
          };
        }
      })
    );
  }
  async function handlePinMoved(id, x, y) {
    setPins((prev) => prev.map((p) => p.id === id ? { ...p, x, y } : p));
    setFullFeedback(
      (prev) => prev.map((f) => f.id === id ? { ...f, x, y } : f)
    );
    try {
      const res = await fetch(API_PATH, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id, x, y })
      });
      if (!res.ok) {
        console.error("[fi-edback] Failed to update pin position");
      }
    } catch (error) {
      console.error("[fi-edback] Failed to update pin position:", error);
    }
  }
  function toggleLanguage() {
    setLanguage((prev) => {
      if (prev === "en") return "de";
      if (prev === "de") return "ga";
      return "en";
    });
  }
  const selectedFeedback = fullFeedback.find(
    (f) => f.id === selectedFeedbackId
  );
  const visiblePins = showCrossDevicePins ? pins : pins.filter((pin) => {
    if (!pin.viewportWidth || !currentViewportWidth) return true;
    const diff = Math.abs(pin.viewportWidth - currentViewportWidth);
    return diff <= 300;
  });
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    !isAllHidden && !isActive && !pendingPin && /* @__PURE__ */ jsxs4(
      "div",
      {
        "data-fi-edback-grid": "true",
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          // Dynamic viewport height - accounts for mobile browser chrome
          zIndex: 9998,
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          pointerEvents: "none"
        },
        children: [
          /* @__PURE__ */ jsxs4(
            "div",
            {
              style: {
                gridArea: "1 / 1",
                placeSelf: "start end",
                margin: isMobile ? "60px 80px 12px 12px" : "12px",
                // Extra top margin on mobile for browser chrome
                position: "relative",
                pointerEvents: "auto"
              },
              children: [
                /* @__PURE__ */ jsx5(
                  "button",
                  {
                    "data-fi-edback-monkey": "true",
                    onClick: () => setIsAllHidden(!isAllHidden),
                    onMouseEnter: () => !isMobile && setActiveTooltip("hide-all"),
                    onMouseLeave: () => !isMobile && setActiveTooltip(null),
                    onTouchStart: () => handleTooltipToggle("hide-all"),
                    "aria-label": t.hideAll,
                    style: {
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "50%",
                      width: "44px",
                      height: "44px",
                      fontSize: "20px",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: "\u{1F648}"
                  }
                ),
                activeTooltip === "hide-all" && /* @__PURE__ */ jsx5(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      top: "100%",
                      right: "0",
                      marginTop: "8px",
                      padding: "6px 10px",
                      backgroundColor: "#18181b",
                      color: "#fff",
                      fontSize: "12px",
                      borderRadius: "6px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      zIndex: 10001,
                      pointerEvents: "none",
                      fontFamily: "system-ui, sans-serif"
                    },
                    children: t.hideAll
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs4(
            "div",
            {
              style: {
                gridArea: "1 / 1",
                placeSelf: "end end",
                margin: isMobile ? "12px 12px 80px 12px" : "12px",
                // Extra bottom margin on mobile to avoid dev toolbar
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                // Allow wrapping on narrow screens
                gap: "8px",
                alignItems: "center",
                justifyContent: "flex-end",
                // Keep aligned to right when wrapping
                pointerEvents: "auto",
                maxWidth: isMobile ? "calc(100vw - 24px)" : "none"
                // Prevent overflow
              },
              children: [
                /* @__PURE__ */ jsxs4("div", { style: { position: "relative" }, children: [
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      onClick: handleExportCSV,
                      onMouseEnter: () => !isMobile && setActiveTooltip("export"),
                      onMouseLeave: () => !isMobile && setActiveTooltip(null),
                      onTouchStart: () => handleTooltipToggle("export"),
                      disabled: isExporting,
                      "aria-label": "Export feedback as CSV",
                      style: {
                        backgroundColor: "#fff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "6px",
                        padding: isMobile ? "8px 10px" : "6px 12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isExporting ? "#71717a" : "#18181b",
                        cursor: isExporting ? "not-allowed" : "pointer",
                        fontFamily: "system-ui, sans-serif",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "all 0.15s ease",
                        opacity: isExporting ? 0.6 : 1,
                        whiteSpace: "nowrap"
                      },
                      children: isExporting ? "\u{1F4E5}" : `\u{1F4E5} ${isMobile ? "" : t.exportCSV}`
                    }
                  ),
                  activeTooltip === "export" && isMobile && /* @__PURE__ */ jsx5(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginBottom: "8px",
                        padding: "6px 10px",
                        backgroundColor: "#18181b",
                        color: "#fff",
                        fontSize: "12px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        zIndex: 10001,
                        pointerEvents: "none",
                        fontFamily: "system-ui, sans-serif"
                      },
                      children: t.exportCSV
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx5(
                  "div",
                  {
                    style: {
                      display: "flex",
                      gap: "4px",
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "6px",
                      padding: "4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    },
                    children: ["en", "de", "ga"].map((lang) => /* @__PURE__ */ jsx5(
                      "button",
                      {
                        onClick: () => setLanguage(lang),
                        "aria-label": `Switch to ${lang.toUpperCase()}`,
                        style: {
                          padding: isMobile ? "4px 6px" : "4px 8px",
                          fontSize: isMobile ? "11px" : "12px",
                          fontWeight: language === lang ? "700" : "500",
                          color: language === lang ? "#18181b" : "#71717a",
                          backgroundColor: language === lang ? "#f4f4f5" : "transparent",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        },
                        children: lang.toUpperCase()
                      },
                      lang
                    ))
                  }
                ),
                pins.some((p) => p.viewportWidth) && /* @__PURE__ */ jsxs4("div", { style: { position: "relative" }, children: [
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      onClick: () => setShowCrossDevicePins(!showCrossDevicePins),
                      onMouseEnter: () => !isMobile && setActiveTooltip("filter"),
                      onMouseLeave: () => !isMobile && setActiveTooltip(null),
                      onTouchStart: () => handleTooltipToggle("filter"),
                      "aria-label": showCrossDevicePins ? "Hide cross-device pins" : "Show all pins",
                      style: {
                        padding: isMobile ? "8px 10px" : "6px 10px",
                        fontSize: "18px",
                        backgroundColor: "#fff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "6px",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontFamily: "system-ui, sans-serif",
                        opacity: showCrossDevicePins ? 1 : 0.5,
                        transition: "opacity 0.2s ease"
                      },
                      children: showCrossDevicePins ? "\u{1F441}\uFE0F" : "\u{1F6AB}"
                    }
                  ),
                  activeTooltip === "filter" && /* @__PURE__ */ jsx5(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginBottom: "8px",
                        padding: "6px 10px",
                        backgroundColor: "#18181b",
                        color: "#fff",
                        fontSize: "12px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        zIndex: 10001,
                        pointerEvents: "none",
                        fontFamily: "system-ui, sans-serif"
                      },
                      children: showCrossDevicePins ? "Hide cross-device pins" : "Show all pins"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs4(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "8px"
                    },
                    children: [
                      !isMobile && /* @__PURE__ */ jsx5(
                        "div",
                        {
                          style: {
                            fontSize: "12px",
                            color: "#71717a",
                            fontFamily: "system-ui, sans-serif",
                            textAlign: "right",
                            maxWidth: "200px",
                            lineHeight: "1.4"
                          },
                          children: t.instructionText
                        }
                      ),
                      /* @__PURE__ */ jsx5(
                        "button",
                        {
                          "data-fi-edback-button": "true",
                          onClick: handleActivate,
                          "aria-label": "Open feedback tool",
                          style: {
                            backgroundColor: "#18181b",
                            color: "#fff",
                            border: "none",
                            borderRadius: "9999px",
                            padding: isMobile ? "10px 16px" : "10px 18px",
                            fontSize: isMobile ? "14px" : "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            fontFamily: "system-ui, sans-serif",
                            letterSpacing: "0.01em"
                          },
                          children: t.feedbackButton
                        }
                      )
                    ]
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    isAllHidden && /* @__PURE__ */ jsx5(
      "button",
      {
        onClick: () => setIsAllHidden(!isAllHidden),
        "aria-label": t.showAll,
        title: t.showAll,
        style: {
          position: "fixed",
          top: "12px",
          right: "12px",
          zIndex: 1e4,
          backgroundColor: "rgba(255,255,255,0.95)",
          border: "1px solid #e4e4e7",
          borderRadius: "50%",
          width: "44px",
          height: "44px",
          fontSize: "20px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: "\u{1F441}\uFE0F"
      }
    ),
    !isAllHidden && isActive && /* @__PURE__ */ jsx5(
      "button",
      {
        onClick: handleDeactivate,
        "aria-label": "Cancel feedback",
        style: {
          position: "fixed",
          bottom: isMobile ? "12px" : "24px",
          right: isMobile ? "12px" : "24px",
          zIndex: 9999,
          backgroundColor: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: "9999px",
          padding: isMobile ? "12px 20px" : "10px 18px",
          fontSize: isMobile ? "15px" : "14px",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "system-ui, sans-serif"
        },
        children: t.cancelButton
      }
    ),
    !isAllHidden && isActive && /* @__PURE__ */ jsx5(FeedbackOverlay, { language, onPinPlaced: handlePinPlaced }),
    !isAllHidden && /* @__PURE__ */ jsx5(
      FeedbackPinLayer,
      {
        pins: visiblePins,
        onPinClick: handlePinClick,
        onPinMoved: handlePinMoved,
        title: t.feedbackSubmitted,
        currentViewportWidth
      },
      currentPath
    ),
    !isAllHidden && pendingPin && /* @__PURE__ */ jsx5(
      FeedbackForm,
      {
        x: pendingPin.x,
        y: pendingPin.y,
        projectSlug,
        apiPath: API_PATH,
        language,
        viewportWidth: pendingPin.viewportWidth,
        deviceType: pendingPin.deviceType,
        onSubmitted: handleFormSubmitted,
        onCancelled: handleFormCancelled
      }
    ),
    !isAllHidden && selectedFeedback && /* @__PURE__ */ jsx5(
      FeedbackPopup,
      {
        feedback: selectedFeedback,
        apiPath: API_PATH,
        language,
        onDeleted: handleFeedbackDeleted,
        onReactionToggled: handleReactionToggled,
        onClose: handlePopupClose
      }
    )
  ] });
}

// src/components/FeedbackRoot.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function FeedbackRoot() {
  const [mounted, setMounted] = useState5(false);
  useEffect4(() => {
    console.log("[fi-edback] FeedbackRoot mounted");
    console.log(
      "[fi-edback] NEXT_PUBLIC_ENABLE_FEEDBACK:",
      process.env.NEXT_PUBLIC_ENABLE_FEEDBACK
    );
    console.log(
      "[fi-edback] NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG:",
      process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG
    );
    setMounted(true);
  }, []);
  if (!mounted) {
    console.log("[fi-edback] Not mounted yet, waiting for client-side render");
    return null;
  }
  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") {
    console.log(
      '[fi-edback] Feedback disabled (NEXT_PUBLIC_ENABLE_FEEDBACK is not "true")'
    );
    return null;
  }
  const projectSlug = process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG;
  if (!projectSlug) {
    console.log(
      "[fi-edback] No project slug configured (NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG missing)"
    );
    return null;
  }
  console.log(
    "[fi-edback] Rendering FeedbackLauncher with projectSlug:",
    projectSlug
  );
  return /* @__PURE__ */ jsx6(FeedbackLauncher, { projectSlug });
}
export {
  FeedbackRoot
};
