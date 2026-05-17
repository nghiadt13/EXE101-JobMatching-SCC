import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type CalloutProps = {
  text: string;
  x: number; // percentage position on screenshot (0-100)
  y: number;
  delay: number; // frame delay
  accentColor: string;
  direction?: "left" | "right" | "up" | "down";
};

export const Callout: React.FC<CalloutProps> = ({
  text,
  x,
  y,
  delay,
  accentColor,
  direction = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring animation for entrance
  const progress = spring({
    frame,
    fps,
    delay,
    config: { damping: 12, stiffness: 180 },
  });

  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.6, 1]);

  // Line connector offsets based on direction
  const lineLength = 40;
  const lineOffsets: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
    left: { x1: 0, y1: 0, x2: -lineLength, y2: 0 },
    right: { x1: 0, y1: 0, x2: lineLength, y2: 0 },
    up: { x1: 0, y1: 0, x2: 0, y2: -lineLength },
    down: { x1: 0, y1: 0, x2: 0, y2: lineLength },
  };

  const line = lineOffsets[direction];

  // Label position relative to line end
  const labelOffset: Record<string, React.CSSProperties> = {
    left: { right: lineLength + 10, top: "50%", transform: `scale(${scale}) translateY(-50%)` },
    right: { left: lineLength + 10, top: "50%", transform: `scale(${scale}) translateY(-50%)` },
    up: { left: "50%", bottom: lineLength + 10, transform: `scale(${scale}) translateX(-50%)` },
    down: { left: "50%", top: lineLength + 10, transform: `scale(${scale}) translateX(-50%)` },
  };

  // Pulse animation for the dot
  const pulseSize = interpolate(
    Math.sin((frame - delay) * 0.15),
    [-1, 1],
    [8, 14]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        zIndex: 15,
        pointerEvents: "none",
      }}
    >
      {/* Pulsing dot at anchor point */}
      <div
        style={{
          position: "absolute",
          width: pulseSize,
          height: pulseSize,
          borderRadius: "50%",
          background: accentColor,
          boxShadow: `0 0 ${pulseSize * 2}px ${accentColor}80, 0 0 ${pulseSize * 4}px ${accentColor}40`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Connector line */}
      <svg
        style={{
          position: "absolute",
          left: -50,
          top: -50,
          width: 100,
          height: 100,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <line
          x1={50 + line.x1}
          y1={50 + line.y1}
          x2={50 + line.x2}
          y2={50 + line.y2}
          stroke={accentColor}
          strokeWidth={2}
          strokeDasharray={`${lineLength * progress} ${lineLength}`}
          opacity={0.8}
        />
      </svg>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          ...labelOffset[direction],
          background: "rgba(10, 10, 30, 0.85)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${accentColor}50`,
          borderRadius: 10,
          padding: "8px 16px",
          whiteSpace: "nowrap",
          boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${accentColor}20`,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
