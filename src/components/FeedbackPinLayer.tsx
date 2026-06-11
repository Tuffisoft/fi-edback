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
}

export function FeedbackPinLayer({ pins }: FeedbackPinLayerProps) {
  if (pins.length === 0) return null;

  return (
    <>
      {pins.map((pin) => (
        <div
          key={pin.id}
          title="Feedback submitted"
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
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
