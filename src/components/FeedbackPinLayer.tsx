"use client";

import { useState, useRef, useEffect } from "react";

interface Pin {
  id: string;
  /** Document-relative X coordinate */
  x: number;
  /** Document-relative Y coordinate */
  y: number;
  /** Viewport width when pin was created */
  viewportWidth?: number;
  /** Device type when pin was created */
  deviceType?: "mobile" | "tablet" | "desktop";
  /** Pin color (hex code) */
  pinColor?: string;
}

interface FeedbackPinLayerProps {
  pins: Pin[];
  onPinClick?: (id: string) => void;
  onPinMoved?: (id: string, x: number, y: number) => void;
  title?: string;
  currentViewportWidth?: number;
}

function getDeviceIcon(deviceType?: "mobile" | "tablet" | "desktop"): string {
  if (!deviceType) return "📍";
  if (deviceType === "mobile") return "📱";
  if (deviceType === "tablet") return "📱"; // Use same icon for tablet
  return "💻";
}

function getOpacity(
  pinViewportWidth: number | undefined,
  currentViewportWidth: number,
): number {
  if (!pinViewportWidth || !currentViewportWidth) return 1;
  const diff = Math.abs(pinViewportWidth - currentViewportWidth);
  // Reduce opacity for pins from very different viewport sizes (>300px difference)
  if (diff > 300) return 0.5;
  if (diff > 150) return 0.75;
  return 1;
}

export function FeedbackPinLayer({
  pins,
  onPinClick,
  onPinMoved,
  title = "Feedback submitted",
  currentViewportWidth = window.innerWidth,
}: FeedbackPinLayerProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!draggingId) return;

    const handleMove = (clientX: number, clientY: number) => {
      hasMoved.current = true;
      const x = clientX + window.scrollX - dragOffset.x;
      const y = clientY + window.scrollY - dragOffset.y;
      setTempPosition({ x, y });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      if (draggingId && tempPosition && hasMoved.current) {
        // Save the new position
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

  return (
    <>
      {pins.map((pin) => {
        const isDragging = draggingId === pin.id;
        const position =
          isDragging && tempPosition ? tempPosition : { x: pin.x, y: pin.y };

        const handleStart = (clientX: number, clientY: number) => {
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
        const pinTitle = pin.deviceType
          ? `${title} (${pin.deviceType}, ${pin.viewportWidth}px)`
          : title;

        return (
          <div
            key={pin.id}
            style={{
              position: "absolute",
              left: position.x - 10,
              top: position.y - 35,
              zIndex: isDragging ? 9998 : 9996,
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity,
              transition: isDragging ? "none" : "opacity 0.2s ease",
            }}
          >
            {/* Device icon */}
            <div
              style={{
                fontSize: "12px",
                lineHeight: "1",
                marginBottom: "2px",
                userSelect: "none",
                filter: isDragging
                  ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                  : "none",
              }}
            >
              {deviceIcon}
            </div>
            {/* Pin */}
            <div
              title={pinTitle}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                handleStart(touch.clientX, touch.clientY);
              }}
              onClick={(e) => {
                // Only trigger click if we didn't drag
                if (!hasMoved.current && onPinClick) {
                  e.stopPropagation();
                  onPinClick(pin.id);
                }
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50% 50% 50% 0",
                transform: isDragging
                  ? "rotate(-45deg) scale(1.15)"
                  : "rotate(-45deg)",
                backgroundColor: pin.pinColor || "#18181b",
                border: "2px solid #fff",
                boxShadow: isDragging
                  ? "0 8px 24px rgba(0,0,0,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.3)",
                cursor: isDragging ? "grabbing" : "grab",
                transition: isDragging
                  ? "none"
                  : "transform 0.15s ease, box-shadow 0.15s ease",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = "rotate(-45deg) scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = "rotate(-45deg) scale(1)";
                }
              }}
            />
          </div>
        );
      })}
    </>
  );
}
