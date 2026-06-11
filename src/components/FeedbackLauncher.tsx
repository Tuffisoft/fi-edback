"use client";

import { useState } from "react";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { FeedbackPinLayer } from "./FeedbackPinLayer";
import { FeedbackForm } from "./FeedbackForm";
import { API_PATH } from "../lib/config";

interface Pin {
  id: string;
  x: number;
  y: number;
}

interface FeedbackLauncherProps {
  projectSlug: string;
}

export function FeedbackLauncher({ projectSlug }: FeedbackLauncherProps) {
  const [isActive, setIsActive] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(
    null,
  );

  function handleActivate() {
    setIsActive(true);
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
  }

  function handleFormCancelled() {
    setPendingPin(null);
  }

  return (
    <>
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
          Feedback
        </button>
      )}

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
          Cancel
        </button>
      )}

      {isActive && <FeedbackOverlay onPinPlaced={handlePinPlaced} />}

      <FeedbackPinLayer pins={pins} />

      {pendingPin && (
        <FeedbackForm
          x={pendingPin.x}
          y={pendingPin.y}
          projectSlug={projectSlug}
          apiPath={API_PATH}
          onSubmitted={handleFormSubmitted}
          onCancelled={handleFormCancelled}
        />
      )}
    </>
  );
}
