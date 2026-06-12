"use client";

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
  title?: string;
}

export function FeedbackPinLayer({
  pins,
  onPinClick,
  title = "Feedback submitted",
}: FeedbackPinLayerProps) {
  if (pins.length === 0) return null;

  return (
    <>
      {pins.map((pin) => (
        <div
          key={pin.id}
          title={title}
          onClick={(e) => {
            if (onPinClick) {
              e.stopPropagation();
              onPinClick(pin.id);
            }
          }}
          style={{
            // position: absolute so the pin tracks document-relative coordinates
            position: "absolute",
            left: pin.x - 10,
            top: pin.y - 22,
            zIndex: 9996,
            width: "20px",
            height: "20px",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            backgroundColor: "#18181b",
            border: "2px solid #fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            pointerEvents: onPinClick ? "auto" : "none",
            cursor: onPinClick ? "pointer" : "default",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (onPinClick) {
              e.currentTarget.style.transform = "rotate(-45deg) scale(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (onPinClick) {
              e.currentTarget.style.transform = "rotate(-45deg) scale(1)";
            }
          }}
        />
      ))}
    </>
  );
}
