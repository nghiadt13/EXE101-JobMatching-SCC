import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { DescriptionBar } from "../components/DescriptionBar";
import { StepIndicator } from "../components/StepIndicator";
import { Callout } from "../components/Callout";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin", "vietnamese"],
});

type CalloutConfig = {
  text: string;
  x: number;
  y: number;
  delay: number;
  direction?: "left" | "right" | "up" | "down";
};

type ZoomTarget = {
  x: number; // transform-origin X (%)
  y: number; // transform-origin Y (%)
  scale: number; // how much to zoom
  startFrame: number; // when zoom starts
};

type ScreenshotSceneProps = {
  src: string;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  accentColor: string;
  isHighlight?: boolean;
  zoomTarget?: ZoomTarget;
  callouts?: CalloutConfig[];
};

export const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  src,
  title,
  description,
  step,
  totalSteps,
  accentColor,
  isHighlight = false,
  zoomTarget,
  callouts = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Screenshot entrance animation
  const screenshotScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const entranceScale = interpolate(screenshotScale, [0, 1], [1.05, 1]);

  // Screenshot opacity
  const screenshotOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Zoom effect
  let zoomScale = 1;
  let zoomOriginX = "50%";
  let zoomOriginY = "50%";

  if (zoomTarget) {
    const zoomProgress = interpolate(
      frame,
      [zoomTarget.startFrame, zoomTarget.startFrame + 40, durationInFrames - 20, durationInFrames],
      [1, zoomTarget.scale, zoomTarget.scale, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      }
    );
    zoomScale = zoomProgress;
    zoomOriginX = `${zoomTarget.x}%`;
    zoomOriginY = `${zoomTarget.y}%`;
  } else {
    // Default subtle zoom when no zoom target
    zoomScale = interpolate(frame, [0, durationInFrames], [1, 1.03], {
      extrapolateRight: "clamp",
    });
  }

  // Highlight glow pulse
  const glowPulse = isHighlight
    ? interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 0.6])
    : 0;

  // CORE FEATURE badge animation
  const starScale = isHighlight
    ? spring({ frame, fps, delay: 15, config: { damping: 8, stiffness: 200 } })
    : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily,
        background: "#0a0a1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at top right, ${accentColor}15, transparent 60%),
                       radial-gradient(ellipse at bottom left, ${accentColor}10, transparent 50%)`,
        }}
      />

      {/* Highlight glow */}
      {isHighlight && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 120px rgba(${hexToRgb(accentColor)}, ${glowPulse * 0.15})`,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}

      {/* Screenshot container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 60px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "88%",
            maxHeight: "82%",
            opacity: screenshotOpacity,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: isHighlight
              ? `0 25px 80px rgba(0,0,0,0.5), 0 0 60px ${accentColor}30`
              : "0 25px 80px rgba(0,0,0,0.5)",
            border: isHighlight
              ? `2px solid ${accentColor}40`
              : "1px solid rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          {/* Browser chrome bar */}
          <div
            style={{
              height: 36,
              background: "linear-gradient(180deg, #2a2a3a, #222233)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 16,
              gap: 8,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28ca41" }} />
            <div
              style={{
                marginLeft: 20,
                flex: 1,
                height: 22,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
              }}
            >
              localhost:3000
            </div>
          </div>

          {/* Screenshot image with zoom */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <Img
              src={staticFile(src)}
              style={{
                width: "100%",
                display: "block",
                objectFit: "cover",
                transform: `scale(${entranceScale * zoomScale})`,
                transformOrigin: `${zoomOriginX} ${zoomOriginY}`,
              }}
            />

            {/* Callout overlays on the image */}
            {callouts.map((callout, i) => (
              <Callout
                key={i}
                text={callout.text}
                x={callout.x}
                y={callout.y}
                delay={callout.delay}
                accentColor={accentColor}
                direction={callout.direction}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator
        step={step}
        totalSteps={totalSteps}
        accentColor={accentColor}
      />

      {/* CORE FEATURE badge */}
      {isHighlight && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 30,
            transform: `scale(${starScale})`,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            padding: "8px 20px",
            borderRadius: 50,
            boxShadow: `0 4px 20px ${accentColor}50`,
            zIndex: 20,
          }}
        >
          ⭐ CORE FEATURE
        </div>
      )}

      {/* Description bar */}
      <DescriptionBar
        title={title}
        description={description}
        accentColor={accentColor}
        isHighlight={isHighlight}
      />
    </div>
  );
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
