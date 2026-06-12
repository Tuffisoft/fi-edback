"use client";

import { useState, useEffect } from "react";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { FeedbackPinLayer } from "./FeedbackPinLayer";
import { FeedbackForm } from "./FeedbackForm";
import { FeedbackPopup } from "./FeedbackPopup";
import { API_PATH } from "../lib/config";
import type { FeedbackRow } from "../lib/types";
import type { Language } from "../lib/i18n";
import { getTranslations } from "../lib/i18n";

interface Pin {
  id: string;
  x: number;
  y: number;
}

interface FeedbackLauncherProps {
  projectSlug: string;
}

export function FeedbackLauncher({ projectSlug }: FeedbackLauncherProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [isActive, setIsActive] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [fullFeedback, setFullFeedback] = useState<FeedbackRow[]>([]);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const t = getTranslations(language);

  // Fetch existing feedback on mount
  useEffect(() => {
    async function fetchFeedback() {
      try {
        const params = new URLSearchParams({
          projectSlug,
          pageUrl: window.location.href,
        });
        const res = await fetch(`${API_PATH}?${params}`);
        if (res.ok) {
          const data = (await res.json()) as { feedback: FeedbackRow[] };
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

  function handlePinPlaced(x: number, y: number) {
    setIsActive(false);
    setPendingPin({ x, y });
  }

  function handleFormSubmitted(pin: Pin) {
    setPins((prev) => [...prev, pin]);
    setPendingPin(null);
    // Optionally refetch to get the full feedback data
    // For now, we just add the pin visually
  }

  function handleFormCancelled() {
    setPendingPin(null);
  }

  function handlePinClick(id: string) {
    setSelectedFeedbackId(id);
  }

  function handlePopupClose() {
    setSelectedFeedbackId(null);
  }

  function handleFeedbackDeleted(id: string) {
    setPins((prev) => prev.filter((p) => p.id !== id));
    setFullFeedback((prev) => prev.filter((f) => f.id !== id));
    setSelectedFeedbackId(null);
  }

  function toggleLanguage() {
    setLanguage((prev) => (prev === "en" ? "de" : "en"));
  }

  const selectedFeedback = fullFeedback.find(
    (f) => f.id === selectedFeedbackId,
  );

  return (
    <>
      {/* Language toggle */}
      {!isActive && !pendingPin && (
        <button
          onClick={toggleLanguage}
          aria-label="Switch language"
          style={{
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
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {language === "en" ? "EN" : "DE"} | {language === "en" ? "DE" : "EN"}
        </button>
      )}

      {/* Feedback button */}
      {!isActive && !pendingPin && (
        <button
          onClick={handleActivate}
          aria-label="Open feedback tool"
          style={{
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
            letterSpacing: "0.01em",
          }}
        >
          {t.feedbackButton}
        </button>
      )}

      {/* Cancel button */}
      {isActive && (
        <button
          onClick={handleDeactivate}
          aria-label="Cancel feedback"
          style={{
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
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {t.cancelButton}
        </button>
      )}

      {/* Crosshair overlay */}
      {isActive && (
        <FeedbackOverlay language={language} onPinPlaced={handlePinPlaced} />
      )}

      {/* All pins */}
      <FeedbackPinLayer
        pins={pins}
        onPinClick={handlePinClick}
        title={t.feedbackSubmitted}
      />

      {/* Form for new feedback */}
      {pendingPin && (
        <FeedbackForm
          x={pendingPin.x}
          y={pendingPin.y}
          projectSlug={projectSlug}
          apiPath={API_PATH}
          language={language}
          onSubmitted={handleFormSubmitted}
          onCancelled={handleFormCancelled}
        />
      )}

      {/* Popup for existing feedback */}
      {selectedFeedback && (
        <FeedbackPopup
          feedback={selectedFeedback}
          apiPath={API_PATH}
          language={language}
          onDeleted={handleFeedbackDeleted}
          onClose={handlePopupClose}
        />
      )}
    </>
  );
}
