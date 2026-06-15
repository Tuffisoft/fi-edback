"use client";

import { useState, useEffect } from "react";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { FeedbackPinLayer } from "./FeedbackPinLayer";
import { FeedbackForm } from "./FeedbackForm";
import { FeedbackPopup } from "./FeedbackPopup";
import { API_PATH } from "../lib/config";
import { getOrCreateSessionId } from "../lib/session";
import type { FeedbackRow } from "../lib/types";
import type { Language } from "../lib/i18n";
import { getTranslations } from "../lib/i18n";

interface Pin {
  id: string;
  x: number;
  y: number;
  viewportWidth?: number;
  deviceType?: "mobile" | "tablet" | "desktop";
  pinColor?: string;
}

interface FeedbackLauncherProps {
  projectSlug: string;
}

export function FeedbackLauncher({ projectSlug }: FeedbackLauncherProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [isActive, setIsActive] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [fullFeedback, setFullFeedback] = useState<FeedbackRow[]>([]);
  const [pendingPin, setPendingPin] = useState<{
    x: number;
    y: number;
    viewportWidth: number;
    deviceType: "mobile" | "tablet" | "desktop";
  } | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showCrossDevicePins, setShowCrossDevicePins] = useState(true);
  const [currentViewportWidth, setCurrentViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const [isExporting, setIsExporting] = useState(false);

  const t = getTranslations(language);

  // Track viewport width changes
  useEffect(() => {
    const handleResize = () => {
      setCurrentViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track URL changes for client-side navigation
  // Uses polling + event listeners for maximum compatibility with Next.js routing
  useEffect(() => {
    let lastPath = window.location.href;
    setCurrentPath(lastPath);

    // Check for URL changes periodically
    const checkUrlChange = () => {
      const newPath = window.location.href;
      if (newPath !== lastPath) {
        lastPath = newPath;
        setCurrentPath(newPath);
      }
    };

    // Poll every 100ms to catch navigation changes
    const intervalId = setInterval(checkUrlChange, 100);

    // Also listen for popstate (back/forward buttons)
    const handlePopState = () => {
      checkUrlChange();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Fetch existing feedback when page changes
  useEffect(() => {
    if (!currentPath) return;

    async function fetchFeedback() {
      setIsLoading(true);
      console.log("[fi-edback] Fetching feedback for:", currentPath);
      try {
        const sessionId = getOrCreateSessionId();
        const params = new URLSearchParams({
          projectSlug,
          pageUrl: currentPath,
          sessionId,
        });
        const res = await fetch(`${API_PATH}?${params}`);
        if (res.ok) {
          const data = (await res.json()) as { feedback: FeedbackRow[] };
          console.log(
            "[fi-edback] Received feedback:",
            data.feedback.length,
            "items",
          );
          console.log(
            "[fi-edback] URLs:",
            data.feedback.map((f) => f.pageUrl),
          );
          setFullFeedback(data.feedback);
          setPins(
            data.feedback.map((f) => ({
              id: f.id,
              x: f.x,
              y: f.y,
              viewportWidth: f.viewportWidth,
              deviceType: f.deviceType,
              pinColor: f.pinColor,
            })),
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

  function handlePinPlaced(
    x: number,
    y: number,
    viewportWidth: number,
    deviceType: "mobile" | "tablet" | "desktop",
  ) {
    setIsActive(false);
    setPendingPin({ x, y, viewportWidth, deviceType });
  }

  function handleFormSubmitted(feedback: FeedbackRow) {
    setPins((prev) => [
      ...prev,
      {
        id: feedback.id,
        x: feedback.x,
        y: feedback.y,
        viewportWidth: feedback.viewportWidth,
        deviceType: feedback.deviceType,
        pinColor: feedback.pinColor,
      },
    ]);
    setFullFeedback((prev) => [...prev, feedback]);
    setPendingPin(null);
  }

  async function handleExportCSV() {
    setIsExporting(true);
    try {
      const response = await fetch(
        `${API_PATH}?format=csv&projectSlug=${encodeURIComponent(projectSlug)}`,
      );
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${projectSlug}-${new Date().toISOString().split("T")[0]}.csv`;
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

  function handleReactionToggled(
    feedbackId: string,
    reaction: string,
    added: boolean,
  ) {
    setFullFeedback((prev) =>
      prev.map((f) => {
        if (f.id !== feedbackId) return f;

        const reactions = f.reactions || [];
        const existingIndex = reactions.findIndex(
          (r) => r.reaction === reaction,
        );

        if (existingIndex >= 0) {
          // Update existing reaction
          const updated = [...reactions];
          if (added) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              count: updated[existingIndex].count + 1,
              hasReacted: true,
            };
          } else {
            const newCount = updated[existingIndex].count - 1;
            if (newCount === 0) {
              updated.splice(existingIndex, 1);
            } else {
              updated[existingIndex] = {
                ...updated[existingIndex],
                count: newCount,
                hasReacted: false,
              };
            }
          }
          return { ...f, reactions: updated };
        } else {
          // Add new reaction
          return {
            ...f,
            reactions: [...reactions, { reaction, count: 1, hasReacted: true }],
          };
        }
      }),
    );
  }

  async function handlePinMoved(id: string, x: number, y: number) {
    // Optimistically update local state
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
    setFullFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f)),
    );

    // Save to database
    try {
      const res = await fetch(API_PATH, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id, x, y }),
      });

      if (!res.ok) {
        console.error("[fi-edback] Failed to update pin position");
        // Could revert optimistic update here if needed
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
    (f) => f.id === selectedFeedbackId,
  );

  // Filter pins based on cross-device toggle
  const visiblePins = showCrossDevicePins
    ? pins
    : pins.filter((pin) => {
        if (!pin.viewportWidth || !currentViewportWidth) return true;
        const diff = Math.abs(pin.viewportWidth - currentViewportWidth);
        return diff <= 300; // Show pins from similar viewport sizes (within 300px)
      });

  // Responsive values based on screen width
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <>
      {/* Export CSV button */}
      {!isActive && !pendingPin && (
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          aria-label="Export feedback as CSV"
          style={{
            position: "fixed",
            bottom: isMobile ? "90px" : "24px",
            right: isMobile ? "12px" : "380px",
            zIndex: 9999,
            backgroundColor: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "6px",
            padding: isMobile ? "8px 14px" : "6px 12px",
            fontSize: isMobile ? "13px" : "12px",
            fontWeight: "500",
            color: isExporting ? "#71717a" : "#18181b",
            cursor: isExporting ? "not-allowed" : "pointer",
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.15s ease",
            opacity: isExporting ? 0.6 : 1,
          }}
        >
          {isExporting ? "📥 ..." : `📥 ${t.exportCSV}`}
        </button>
      )}

      {/* Language toggle */}
      {!isActive && !pendingPin && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? "90px" : "24px",
            right: isMobile ? "12px" : "240px",
            zIndex: 9999,
            display: "flex",
            gap: "4px",
            backgroundColor: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "6px",
            padding: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {(["en", "de", "ga"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              aria-label={`Switch to ${lang.toUpperCase()}`}
              style={{
                padding: isMobile ? "6px 10px" : "4px 8px",
                fontSize: isMobile ? "13px" : "12px",
                fontWeight: language === lang ? "700" : "500",
                color: language === lang ? "#18181b" : "#71717a",
                backgroundColor: language === lang ? "#f4f4f5" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Cross-device filter toggle */}
      {!isActive && !pendingPin && pins.some((p) => p.viewportWidth) && (
        <button
          onClick={() => setShowCrossDevicePins(!showCrossDevicePins)}
          aria-label={
            showCrossDevicePins ? "Hide cross-device pins" : "Show all pins"
          }
          title={
            showCrossDevicePins
              ? "Hide pins from other devices"
              : "Show all pins"
          }
          style={{
            position: "fixed",
            bottom: isMobile ? "90px" : "24px",
            right: isMobile ? "12px" : "140px",
            zIndex: 9999,
            padding: isMobile ? "8px 12px" : "6px 10px",
            fontSize: isMobile ? "20px" : "18px",
            backgroundColor: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontFamily: "system-ui, sans-serif",
            opacity: showCrossDevicePins ? 1 : 0.5,
            transition: "opacity 0.2s ease",
          }}
        >
          {showCrossDevicePins ? "👁️" : "🚫"}
        </button>
      )}

      {/* Feedback button */}
      {!isActive && !pendingPin && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? "12px" : "24px",
            right: isMobile ? "12px" : "24px",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {/* Instruction text */}
          <div
            style={{
              fontSize: isMobile ? "11px" : "12px",
              color: "#71717a",
              fontFamily: "system-ui, sans-serif",
              textAlign: "right",
              maxWidth: isMobile ? "160px" : "200px",
              lineHeight: "1.4",
            }}
          >
            {t.instructionText}
          </div>

          {/* Feedback button */}
          <button
            onClick={handleActivate}
            aria-label="Open feedback tool"
            style={{
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
              letterSpacing: "0.01em",
            }}
          >
            {t.feedbackButton}
          </button>
        </div>
      )}

      {/* Cancel button */}
      {isActive && (
        <button
          onClick={handleDeactivate}
          aria-label="Cancel feedback"
          style={{
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
        key={currentPath}
        pins={visiblePins}
        onPinClick={handlePinClick}
        onPinMoved={handlePinMoved}
        title={t.feedbackSubmitted}
        currentViewportWidth={currentViewportWidth}
      />

      {/* Form for new feedback */}
      {pendingPin && (
        <FeedbackForm
          x={pendingPin.x}
          y={pendingPin.y}
          projectSlug={projectSlug}
          apiPath={API_PATH}
          language={language}
          viewportWidth={pendingPin.viewportWidth}
          deviceType={pendingPin.deviceType}
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
          onReactionToggled={handleReactionToggled}
          onClose={handlePopupClose}
        />
      )}
    </>
  );
}
