"use client";

// src/components/FeedbackRoot.tsx
import { useState as useState5, useEffect as useEffect4 } from "react";

// src/components/FeedbackLauncher.tsx
import { useState as useState4, useEffect as useEffect3 } from "react";

// src/lib/i18n.ts
var translations = {
  en: {
    feedbackButton: "Feedback",
    cancelButton: "Cancel",
    instructionText: "Click the Feedback button to leave a comment",
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
    reactions: "Reactions"
  },
  de: {
    feedbackButton: "Feedback",
    cancelButton: "Abbrechen",
    instructionText: "Klicken Sie auf die Feedback-Schaltfl\xE4che, um einen Kommentar zu hinterlassen",
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
    reactions: "Reaktionen"
  },
  ga: {
    feedbackButton: "Aiseolas",
    cancelButton: "Cealaigh",
    instructionText: "Clice\xE1il an cnaipe Aiseolas chun tr\xE1cht a fh\xE1g\xE1il",
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
    reactions: "Imoibrithe"
  }
};
function getTranslations(lang) {
  return translations[lang];
}

// src/components/FeedbackOverlay.tsx
import { jsx } from "react/jsx-runtime";
function FeedbackOverlay({
  language,
  onPinPlaced
}) {
  const t = getTranslations(language);
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
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
function FeedbackPinLayer({
  pins,
  onPinClick,
  onPinMoved,
  title = "Feedback submitted"
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
    return /* @__PURE__ */ jsx2(
      "div",
      {
        title,
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
          position: "absolute",
          left: position.x - 10,
          top: position.y - 22,
          zIndex: isDragging ? 9998 : 9996,
          width: "20px",
          height: "20px",
          borderRadius: "50% 50% 50% 0",
          transform: isDragging ? "rotate(-45deg) scale(1.15)" : "rotate(-45deg)",
          backgroundColor: "#18181b",
          border: "2px solid #fff",
          boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.3)",
          pointerEvents: "auto",
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
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function FeedbackForm({
  x,
  y,
  projectSlug,
  apiPath,
  language,
  onSubmitted,
  onCancelled
}) {
  const [message, setMessage] = useState2("");
  const [name, setName] = useState2("");
  const [email, setEmail] = useState2("");
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
      children: status === "success" ? /* @__PURE__ */ jsxs(
        "div",
        {
          style: { textAlign: "center", padding: "20px 0", color: "#16a34a" },
          children: [
            /* @__PURE__ */ jsx3("div", { style: { fontSize: "28px", marginBottom: "8px" }, children: "\u2713" }),
            /* @__PURE__ */ jsx3("div", { style: { fontWeight: "600", color: "#18181b" }, children: t.successMessage }),
            /* @__PURE__ */ jsx3("div", { style: { color: "#71717a", fontSize: "13px", marginTop: "4px" }, children: t.successDescription })
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
            children: t.feedbackButton
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
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
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
    /* @__PURE__ */ jsxs2(
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
          /* @__PURE__ */ jsxs2(
            "div",
            {
              style: {
                fontSize: "12px",
                color: "#71717a",
                marginBottom: "12px",
                paddingRight: "24px"
              },
              children: [
                /* @__PURE__ */ jsxs2("div", { children: [
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
                ) })
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
          /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "16px" }, children: [
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
              return /* @__PURE__ */ jsxs2(
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
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function FeedbackLauncher({ projectSlug }) {
  const [language, setLanguage] = useState4("en");
  const [isActive, setIsActive] = useState4(false);
  const [pins, setPins] = useState4([]);
  const [fullFeedback, setFullFeedback] = useState4([]);
  const [pendingPin, setPendingPin] = useState4(
    null
  );
  const [selectedFeedbackId, setSelectedFeedbackId] = useState4(
    null
  );
  const [isLoading, setIsLoading] = useState4(true);
  const t = getTranslations(language);
  useEffect3(() => {
    async function fetchFeedback() {
      try {
        const sessionId = getOrCreateSessionId();
        const params = new URLSearchParams({
          projectSlug,
          pageUrl: window.location.href,
          sessionId
        });
        const res = await fetch(`${API_PATH}?${params}`);
        if (res.ok) {
          const data = await res.json();
          setFullFeedback(data.feedback);
          setPins(data.feedback.map((f) => ({ id: f.id, x: f.x, y: f.y })));
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
  function handleFormSubmitted(feedback) {
    setPins((prev) => [
      ...prev,
      { id: feedback.id, x: feedback.x, y: feedback.y }
    ]);
    setFullFeedback((prev) => [...prev, feedback]);
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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  return /* @__PURE__ */ jsxs3(Fragment3, { children: [
    !isActive && !pendingPin && /* @__PURE__ */ jsx5(
      "div",
      {
        style: {
          position: "fixed",
          bottom: isMobile ? "90px" : "24px",
          right: isMobile ? "12px" : "140px",
          zIndex: 9998,
          display: "flex",
          gap: "4px",
          backgroundColor: "#fff",
          border: "1px solid #e4e4e7",
          borderRadius: "6px",
          padding: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontFamily: "system-ui, sans-serif"
        },
        children: ["en", "de", "ga"].map((lang) => /* @__PURE__ */ jsx5(
          "button",
          {
            onClick: () => setLanguage(lang),
            "aria-label": `Switch to ${lang.toUpperCase()}`,
            style: {
              padding: isMobile ? "6px 10px" : "4px 8px",
              fontSize: isMobile ? "13px" : "12px",
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
    !isActive && !pendingPin && /* @__PURE__ */ jsxs3(
      "div",
      {
        style: {
          position: "fixed",
          bottom: isMobile ? "12px" : "24px",
          right: isMobile ? "12px" : "24px",
          zIndex: 9998,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px"
        },
        children: [
          /* @__PURE__ */ jsx5(
            "div",
            {
              style: {
                fontSize: isMobile ? "11px" : "12px",
                color: "#71717a",
                fontFamily: "system-ui, sans-serif",
                textAlign: "right",
                maxWidth: isMobile ? "160px" : "200px",
                lineHeight: "1.4"
              },
              children: t.instructionText
            }
          ),
          /* @__PURE__ */ jsx5(
            "button",
            {
              onClick: handleActivate,
              "aria-label": "Open feedback tool",
              style: {
                backgroundColor: "#18181b",
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                padding: isMobile ? "12px 20px" : "10px 18px",
                fontSize: isMobile ? "15px" : "14px",
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
    ),
    isActive && /* @__PURE__ */ jsx5(
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
    isActive && /* @__PURE__ */ jsx5(FeedbackOverlay, { language, onPinPlaced: handlePinPlaced }),
    /* @__PURE__ */ jsx5(
      FeedbackPinLayer,
      {
        pins,
        onPinClick: handlePinClick,
        onPinMoved: handlePinMoved,
        title: t.feedbackSubmitted
      }
    ),
    pendingPin && /* @__PURE__ */ jsx5(
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
    selectedFeedback && /* @__PURE__ */ jsx5(
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
    setMounted(true);
  }, []);
  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") return null;
  const projectSlug = process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG;
  if (!projectSlug) return null;
  return /* @__PURE__ */ jsx6(FeedbackLauncher, { projectSlug });
}
export {
  FeedbackRoot
};
