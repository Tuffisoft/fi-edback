"use client";

import { useState } from "react";
import type { FeedbackRow } from "../lib/types";
import type { Language } from "../lib/i18n";
import { getTranslations } from "../lib/i18n";
import { getOrCreateSessionId } from "../lib/session";

interface FeedbackPopupProps {
  feedback: FeedbackRow;
  apiPath: string;
  language: Language;
  onDeleted: (id: string) => void;
  onReactionToggled: (
    feedbackId: string,
    reaction: string,
    added: boolean,
  ) => void;
  onClose: () => void;
}

// Predefined reactions
const REACTIONS = ["👍", "✅", "❤️", "🔥", "👀"];

export function FeedbackPopup({
  feedback,
  apiPath,
  language,
  onDeleted,
  onReactionToggled,
  onClose,
}: FeedbackPopupProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const t = getTranslations(language);

  async function handleReaction(reaction: string) {
    if (reactingTo) return; // Prevent multiple concurrent reactions

    setReactingTo(reaction);
    const sessionId = getOrCreateSessionId();

    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: feedback.id,
          reaction,
          sessionId,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { added: boolean };
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
        method: "DELETE",
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

  // Convert document-relative pin coordinates back to viewport-relative
  const viewportX = feedback.x - window.scrollX;
  const viewportY = feedback.y - window.scrollY;

  // Keep the popup inside the viewport
  const isMobile = window.innerWidth < 640;
  const popupWidth = isMobile ? Math.min(window.innerWidth - 24, 300) : 300;
  const popupMaxHeight = 400;
  const left = isMobile
    ? 12
    : Math.min(viewportX + 14, window.innerWidth - popupWidth - 12);
  const top = isMobile
    ? Math.min(
        window.innerHeight - popupMaxHeight - 12,
        window.innerHeight / 2 - popupMaxHeight / 2,
      )
    : Math.min(viewportY + 14, window.innerHeight - popupMaxHeight - 12);

  return (
    <>
      {/* Backdrop to close popup */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "transparent",
        }}
      />

      {/* Popup */}
      <div
        role="dialog"
        aria-label="Feedback details"
        style={{
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
          overflow: "auto",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
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
            padding: 0,
          }}
        >
          ×
        </button>

        {/* Author and date */}
        <div
          style={{
            fontSize: "12px",
            color: "#71717a",
            marginBottom: "12px",
            paddingRight: "24px",
          }}
        >
          <div>
            {t.by}{" "}
            <strong style={{ color: "#18181b" }}>
              {feedback.name || t.anonymous}
            </strong>
          </div>
          <div style={{ marginTop: "4px" }}>
            {new Date(feedback.createdAt).toLocaleString(
              language === "de" ? "de-DE" : "en-US",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            )}
          </div>
          {/* Device info */}
          {feedback.deviceType && feedback.viewportWidth && (
            <div style={{ marginTop: "4px", opacity: 0.8 }}>
              {feedback.deviceType === "mobile" && "📱"}
              {feedback.deviceType === "tablet" && "📱"}
              {feedback.deviceType === "desktop" && "💻"} {feedback.deviceType}{" "}
              ({feedback.viewportWidth}px)
              {feedback.pinColor && (
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: feedback.pinColor,
                    border: "1px solid #e4e4e7",
                    marginLeft: "6px",
                    verticalAlign: "middle",
                  }}
                  title={`Pin color: ${feedback.pinColor}`}
                />
              )}
            </div>
          )}
        </div>

        {/* Message */}
        <div
          style={{
            marginBottom: "16px",
            lineHeight: "1.5",
            color: "#18181b",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {feedback.message}
        </div>

        {/* Reactions */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#71717a",
              marginBottom: "8px",
              fontWeight: "500",
            }}
          >
            {t.reactions}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {REACTIONS.map((reaction) => {
              const summary = feedback.reactions?.find(
                (r) => r.reaction === reaction,
              );
              const count = summary?.count || 0;
              const hasReacted = summary?.hasReacted || false;

              return (
                <button
                  key={reaction}
                  onClick={() => handleReaction(reaction)}
                  disabled={reactingTo !== null}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    backgroundColor: hasReacted ? "#e0e7ff" : "#f4f4f5",
                    border: hasReacted
                      ? "2px solid #6366f1"
                      : "1px solid #e4e4e7",
                    borderRadius: "16px",
                    fontSize: "14px",
                    cursor: reactingTo ? "not-allowed" : "pointer",
                    opacity: reactingTo ? 0.6 : 1,
                    fontFamily: "system-ui, sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!reactingTo) {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <span>{reaction}</span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: hasReacted ? "#6366f1" : "#71717a",
                        fontWeight: "600",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
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
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {isDeleting ? "..." : t.deleteFeedback}
        </button>
      </div>
    </>
  );
}
