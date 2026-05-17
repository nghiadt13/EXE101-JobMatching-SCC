import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type StepIndicatorProps = {
  step: number;
  totalSteps: number;
  accentColor: string;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  totalSteps,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const indicatorScale = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 15, stiffness: 200 },
  });

  const opacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress bar width
  const progressWidth = (step / totalSteps) * 100;

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 30,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `scale(${indicatorScale})`,
        zIndex: 20,
      }}
    >
      {/* Step badge */}
      <div
        style={{
          background: accentColor,
          color: "white",
          fontSize: 16,
          fontWeight: 700,
          padding: "8px 18px",
          borderRadius: 50,
          boxShadow: `0 4px 16px ${accentColor}50`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ opacity: 0.7, fontSize: 13 }}>STEP</span>
        <span>
          {step}/{totalSteps}
        </span>
      </div>

      {/* Mini progress bar */}
      <div
        style={{
          width: 120,
          height: 4,
          borderRadius: 4,
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressWidth}%`,
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
            boxShadow: `0 0 8px ${accentColor}40`,
          }}
        />
      </div>
    </div>
  );
};
