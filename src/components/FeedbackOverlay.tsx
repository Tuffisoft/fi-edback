"use client";

import type { Language } from "../lib/i18n";
import { getTranslations } from "../lib/i18n";

interface FeedbackOverlayProps {
  language: Language;
  onPinPlaced: (x: number, y: number) => void;
}

export function FeedbackOverlay({
  language,
  onPinPlaced,
}: FeedbackOverlayProps) {
  const t = getTranslations(language);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Use document-relative coordinates (viewport position + scroll offset) so
    // the pin is anchored to the content rather than the screen.
    //
    // Trade-off: on fluid/responsive layouts the same document coordinate can
    // visually point to different content at different viewport widths. This is
    // an acceptable limitation for a desktop/tablet preview review tool — the
    // pin position is informative context, not a pixel-perfect pointer.
    const x = e.clientX + window.scrollX;
    const y = e.clientY + window.scrollY;
    onPinPlaced(x, y);
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      aria-label={t.clickToPlace}
      tabIndex={0}
      onKeyDown={(e) => {
        // Keyboard users cannot meaningfully pick a coordinate, so Escape exits.
        if (e.key === "Escape") e.currentTarget.blur();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9997,
        cursor: "crosshair",
        backgroundColor: "rgba(0, 0, 0, 0.04)",
      }}
    />
  );
}
