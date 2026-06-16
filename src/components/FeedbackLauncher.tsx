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
  const [isAllHidden, setIsAllHidden] = useState(false);
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Track state changes
  useEffect(() => {
    console.log(
      `[fi-edback] 🔄 isAllHidden changed to:`,
      isAllHidden,
      new Error().stack,
    );
  }, [isAllHidden]);

  useEffect(() => {
    console.log(`[fi-edback] 🔄 isActive changed to:`, isActive);
  }, [isActive]);

  useEffect(() => {
    console.log(`[fi-edback] 🔄 pendingPin changed:`, !!pendingPin);
  }, [pendingPin]);

  const t = getTranslations(language);

  // Debug logging
  useEffect(() => {
    console.log("[fi-edback] FeedbackLauncher mounted");
    console.log("[fi-edback] projectSlug:", projectSlug);
    console.log("[fi-edback] window.innerWidth:", window.innerWidth);
    console.log("[fi-edback] isMobile:", window.innerWidth < 640);
    console.log("[fi-edback] currentPath:", window.location.href);

    // Set up MutationObserver to track when grid container is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.hasAttribute("data-fi-edback-grid")
          ) {
            console.error("[fi-edback] ⛔ GRID CONTAINER REMOVED FROM DOM!", {
              timestamp: Date.now(),
              stackTrace: new Error().stack,
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timestamp = Date.now();
    console.log(`[fi-edback] Render state @${timestamp}:`, {
      isAllHidden,
      isActive,
      pendingPin: !!pendingPin,
      pinsCount: pins.length,
      language,
    });

    // Check if UI should be visible
    const shouldShowMainUI = !isAllHidden && !isActive && !pendingPin;
    console.log(
      `[fi-edback] Should show main UI @${timestamp}:`,
      shouldShowMainUI,
    );

    // If state says UI should NOT be shown, log WHY
    if (!shouldShowMainUI) {
      console.warn(`[fi-edback] UI HIDDEN because:`, {
        isAllHidden: isAllHidden ? "TRUE - hide-all is active" : "false",
        isActive: isActive ? "TRUE - feedback mode active" : "false",
        pendingPin: !!pendingPin ? "TRUE - form is open" : "false",
      });
    }

    // Check if elements exist in DOM
    setTimeout(() => {
      const gridContainer = document.querySelector("[data-fi-edback-grid]");
      const monkeyButton = document.querySelector("[data-fi-edback-monkey]");
      const feedbackButton = document.querySelector("[data-fi-edback-button]");
      console.log(`[fi-edback] DOM check @${timestamp}:`, {
        gridContainer: !!gridContainer,
        monkeyButton: !!monkeyButton,
        feedbackButton: !!feedbackButton,
      });

      // Log computed styles to debug visibility
      if (gridContainer) {
        const gridStyles = window.getComputedStyle(gridContainer as Element);
        console.log("[fi-edback] Grid container styles:", {
          display: gridStyles.display,
          position: gridStyles.position,
          zIndex: gridStyles.zIndex,
          inset: gridStyles.inset,
          visibility: gridStyles.visibility,
          opacity: gridStyles.opacity,
        });
      }

      if (feedbackButton) {
        const buttonStyles = window.getComputedStyle(feedbackButton as Element);
        const rect = (feedbackButton as Element).getBoundingClientRect();
        console.log("[fi-edback] Feedback button styles:", {
          display: buttonStyles.display,
          position: buttonStyles.position,
          visibility: buttonStyles.visibility,
          opacity: buttonStyles.opacity,
          zIndex: buttonStyles.zIndex,
        });
        console.log("[fi-edback] Feedback button position (rect):", {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        console.log("[fi-edback] Viewport:", {
          width: window.innerWidth,
          height: window.innerHeight,
        });

        // Check if anything is covering the button (click target test)
        const elementsAtButtonPos = document.elementsFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        console.log(
          "[fi-edback] Elements at button center:",
          elementsAtButtonPos.map((el) => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            zIndex: window.getComputedStyle(el).zIndex,
          })),
        );
      }
    }, 100);
  }, [isAllHidden, isActive, pendingPin, pins.length, language]);

  // Monitor DOM for unexpected removals
  useEffect(() => {
    const interval = setInterval(() => {
      const gridContainer = document.querySelector("[data-fi-edback-grid]");
      const shouldExist = !isAllHidden && !isActive && !pendingPin;

      if (shouldExist && !gridContainer) {
        console.error("[fi-edback] ⚠️ GRID CONTAINER MISSING from DOM!", {
          isAllHidden,
          isActive,
          pendingPin: !!pendingPin,
          timestamp: Date.now(),
        });
      } else if (!shouldExist && gridContainer) {
        console.warn(
          "[fi-edback] Grid container exists but shouldn't (state changed)",
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isAllHidden, isActive, pendingPin]);

  // Tooltip helper for mobile tap-to-reveal
  const handleTooltipToggle = (id: string) => {
    const isMobileCheck =
      typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobileCheck) {
      setActiveTooltip(activeTooltip === id ? null : id);
    }
  };

  // Auto-dismiss tooltip on mobile after 3 seconds
  useEffect(() => {
    const isMobileCheck =
      typeof window !== "undefined" && window.innerWidth < 640;
    if (activeTooltip && isMobileCheck) {
      const timeout = setTimeout(() => {
        setActiveTooltip(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [activeTooltip]);

  // Track viewport width changes
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      console.log("[fi-edback] Viewport resize:", {
        oldWidth: currentViewportWidth,
        newWidth,
        heightChanged: window.innerHeight,
      });
      setCurrentViewportWidth(newWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentViewportWidth]);

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
      {/* Monkey emoji at top-right */}
      {!isAllHidden && !isActive && !pendingPin && (
        <div style={{ position: "relative" }}>
          <button
            data-fi-edback-monkey="true"
            onClick={() => setIsAllHidden(!isAllHidden)}
            onMouseEnter={() => !isMobile && setActiveTooltip("hide-all")}
            onMouseLeave={() => !isMobile && setActiveTooltip(null)}
            onTouchStart={() => handleTooltipToggle("hide-all")}
            aria-label={t.hideAll}
            style={{
              position: "fixed",
              top: "12px",
              right: "12px",
              zIndex: 10000,
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
              justifyContent: "center",
            }}
          >
            🙈
          </button>
          {activeTooltip === "hide-all" && (
            <div
              style={{
                position: "fixed",
                top: "60px",
                right: "12px",
                padding: "6px 10px",
                backgroundColor: "#18181b",
                color: "#fff",
                fontSize: "12px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 10001,
                pointerEvents: "none",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {t.hideAll}
            </div>
          )}
        </div>
      )}

      {/* Grid Container - Overlapping layout */}
      {!isAllHidden && !isActive && !pendingPin && (
        <div
          data-fi-edback-grid="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100dvh", // Dynamic viewport height - accounts for mobile browser chrome
            zIndex: 9998,
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: "1fr",
            pointerEvents: "none",
          }}
        >
          {/* Bottom-right controls row */}
          <div
            style={{
              gridArea: "1 / 1",
              placeSelf: "end end",
              margin: isMobile ? "12px 12px 80px 12px" : "12px", // 80px bottom margin on mobile for dev toolbar clearance
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap", // Allow wrapping on narrow screens
              gap: "8px",
              alignItems: "center",
              justifyContent: "flex-end", // Keep aligned to right when wrapping
              pointerEvents: "auto",
              maxWidth: isMobile ? "calc(100vw - 24px)" : "none", // Prevent overflow
            }}
          >
            {/* Export CSV button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={handleExportCSV}
                onMouseEnter={() => !isMobile && setActiveTooltip("export")}
                onMouseLeave={() => !isMobile && setActiveTooltip(null)}
                onTouchStart={() => handleTooltipToggle("export")}
                disabled={isExporting}
                aria-label="Export feedback as CSV"
                style={{
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
                  whiteSpace: "nowrap",
                }}
              >
                {isExporting ? "📥" : `📥 ${isMobile ? "" : t.exportCSV}`}
              </button>
              {activeTooltip === "export" && isMobile && (
                <div
                  style={{
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
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {t.exportCSV}
                </div>
              )}
            </div>

            {/* Language toggle */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                backgroundColor: "#fff",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                padding: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {(["en", "de", "ga"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  aria-label={`Switch to ${lang.toUpperCase()}`}
                  style={{
                    padding: isMobile ? "4px 6px" : "4px 8px",
                    fontSize: isMobile ? "11px" : "12px",
                    fontWeight: language === lang ? "700" : "500",
                    color: language === lang ? "#18181b" : "#71717a",
                    backgroundColor:
                      language === lang ? "#f4f4f5" : "transparent",
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

            {/* Cross-device filter toggle */}
            {pins.some((p) => p.viewportWidth) && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowCrossDevicePins(!showCrossDevicePins)}
                  onMouseEnter={() => !isMobile && setActiveTooltip("filter")}
                  onMouseLeave={() => !isMobile && setActiveTooltip(null)}
                  onTouchStart={() => handleTooltipToggle("filter")}
                  aria-label={
                    showCrossDevicePins
                      ? "Hide cross-device pins"
                      : "Show all pins"
                  }
                  style={{
                    padding: isMobile ? "8px 10px" : "6px 10px",
                    fontSize: "18px",
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
                {activeTooltip === "filter" && (
                  <div
                    style={{
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
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {showCrossDevicePins
                      ? "Hide cross-device pins"
                      : "Show all pins"}
                  </div>
                )}
              </div>
            )}

            {/* Feedback button with instruction text */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "8px",
              }}
            >
              {/* Instruction text - hidden on mobile to save space */}
              {!isMobile && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#71717a",
                    fontFamily: "system-ui, sans-serif",
                    textAlign: "right",
                    maxWidth: "200px",
                    lineHeight: "1.4",
                  }}
                >
                  {t.instructionText}
                </div>
              )}

              {/* Feedback button */}
              <button
                data-fi-edback-button="true"
                onClick={handleActivate}
                aria-label="Open feedback tool"
                style={{
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
                  letterSpacing: "0.01em",
                }}
              >
                {t.feedbackButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hide/Show toggle when everything is hidden */}
      {isAllHidden && (
        <button
          onClick={() => setIsAllHidden(!isAllHidden)}
          aria-label={t.showAll}
          title={t.showAll}
          style={{
            position: "fixed",
            top: "12px",
            right: "12px",
            zIndex: 10000,
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
            justifyContent: "center",
          }}
        >
          👁️
        </button>
      )}

      {/* Cancel button */}
      {!isAllHidden && isActive && (
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
      {!isAllHidden && isActive && (
        <FeedbackOverlay language={language} onPinPlaced={handlePinPlaced} />
      )}

      {/* All pins */}
      {!isAllHidden && (
        <FeedbackPinLayer
          key={currentPath}
          pins={visiblePins}
          onPinClick={handlePinClick}
          onPinMoved={handlePinMoved}
          title={t.feedbackSubmitted}
          currentViewportWidth={currentViewportWidth}
        />
      )}

      {/* Form for new feedback */}
      {!isAllHidden && pendingPin && (
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
      {!isAllHidden && selectedFeedback && (
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
