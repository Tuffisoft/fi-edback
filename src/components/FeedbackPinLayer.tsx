"use client";

import { useState, useRef, useEffect } from "react";

interface Pin {
  id: string;
  /** Document-relative X coordinate */
  x: number;
  /** Document-relative Y coordinate */
  y: number;
}

interface FeedbackPinLayerProps {
  pins: Pin[];
  onPinClick?: (id: string) => void;
  onPinMoved?: (id: string, x: number, y: number) => void;
  title?: string;
}

export function FeedbackPinLayer({
  pins,
  onPinClick,
  onPinMoved,
  title = "Feedback submitted",
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

        return (
          <div
            key={pin.id}
            title={title}
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
              position: "absolute",
              left: position.x - 10,
              top: position.y - 22,
              zIndex: isDragging ? 9998 : 9996,
              width: "20px",
              height: "20px",
              borderRadius: "50% 50% 50% 0",
              transform: isDragging
                ? "rotate(-45deg) scale(1.15)"
                : "rotate(-45deg)",
              backgroundColor: "#18181b",
              border: "2px solid #fff",
              boxShadow: isDragging
                ? "0 8px 24px rgba(0,0,0,0.4)"
                : "0 2px 6px rgba(0,0,0,0.3)",
              pointerEvents: "auto",
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
        );
      })}
    </>
  );
}
