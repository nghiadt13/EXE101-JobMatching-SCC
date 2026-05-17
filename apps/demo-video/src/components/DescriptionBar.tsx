import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type DescriptionBarProps = {
  title: string;
  description: string;
  accentColor: string;
  isHighlight?: boolean;
};

export const DescriptionBar: React.FC<DescriptionBarProps> = ({
  title,
  description,
  accentColor,
  isHighlight = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bar slide up animation
  const barProgress = spring({
    frame,
    fps,
    delay: 8,
    config: { damping: 200 },
  });
  const barY = interpolate(barProgress, [0, 1], [100, 0]);
  const barOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title appears first
  const titleOpacity = interpolate(frame, [12, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Description typewriter effect
  const descProgress = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visibleChars = Math.floor(descProgress * description.length);
  const visibleText = description.slice(0, visibleChars);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        transform: `translateY(${barY}px)`,
        opacity: barOpacity,
        padding: "0 60px 25px",
      }}
    >
      <div
        style={{
          background: "rgba(15, 15, 30, 0.85)",
          backdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: "20px 36px",
          border: `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          boxShadow: isHighlight
            ? `0 -10px 40px ${accentColor}20`
            : "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: 4,
            minHeight: 50,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${accentColor}, ${accentColor}66)`,
            flexShrink: 0,
            marginTop: 4,
          }}
        />

        <div style={{ flex: 1 }}>
          {/* Title */}
          <div
            style={{
              opacity: titleOpacity,
              fontSize: 26,
              fontWeight: 900,
              color: "white",
              letterSpacing: -0.5,
              marginBottom: 6,
            }}
          >
            {title}
          </div>

          {/* Description with typewriter */}
          <div
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 400,
              lineHeight: 1.5,
              minHeight: 28,
            }}
          >
            {visibleText}
            {visibleChars < description.length && (
              <span
                style={{
                  opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                  color: accentColor,
                  fontWeight: 700,
                }}
              >
                |
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
