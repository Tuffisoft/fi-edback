"use client";

import { useState } from "react";
import type { FeedbackRow } from "../lib/types";
import type { Language } from "../lib/i18n";
import { getTranslations } from "../lib/i18n";

interface FeedbackPopupProps {
  feedback: FeedbackRow;
  apiPath: string;
  language: Language;
  onDeleted: (id: string) => void;
  onClose: () => void;
}

export function FeedbackPopup({
  feedback,
  apiPath,
  language,
  onDeleted,
  onClose,
}: FeedbackPopupProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const t = getTranslations(language);

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
  const popupWidth = 300;
  const popupMaxHeight = 400;
  const left = Math.min(viewportX + 14, window.innerWidth - popupWidth - 12);
  const top = Math.min(
    viewportY + 14,
    window.innerHeight - popupMaxHeight - 12,
  );

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
