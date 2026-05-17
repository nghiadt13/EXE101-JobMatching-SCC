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

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin", "vietnamese"],
});

const SCREENSHOTS = [
  { src: "screenshots/hp-01-hero.png", label: "Hero Banner & Search" },
  { src: "screenshots/hp-02-market.png", label: "Job Market Today & Top Companies" },
  { src: "screenshots/hp-03-employers.png", label: "Top Employers" },
  { src: "screenshots/hp-04-why-scc.png", label: "Why Choose SCC — AI Matching" },
  { src: "screenshots/hp-05-how-works.png", label: "How SCC Works" },
  { src: "screenshots/hp-06-footer.png", label: "Blog & Footer" },
];

const ACCENT_COLOR = "#6366F1";

export const ScrollingHomepageScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Each screenshot gets equal time, with smooth crossfade
  const totalScreenshots = SCREENSHOTS.length;
  const framesPerShot = durationInFrames / totalScreenshots;

  // Determine which screenshot(s) to show
  const rawIndex = frame / framesPerShot;
  const currentIndex = Math.min(
    Math.floor(rawIndex),
    totalScreenshots - 1
  );
  const nextIndex = Math.min(currentIndex + 1, totalScreenshots - 1);

  // Progress within current shot (0 to 1)
  const localProgress = rawIndex - currentIndex;

  // Crossfade: current image fades out, next fades in
  // Last 20% of each shot duration is the crossfade zone
  const crossfadeStart = 0.75;
  const crossfadeProgress =
    localProgress > crossfadeStart && currentIndex < totalScreenshots - 1
      ? (localProgress - crossfadeStart) / (1 - crossfadeStart)
      : 0;

  // Current image: subtle zoom + slight scroll up
  const currentZoom = interpolate(localProgress, [0, 1], [1, 1.04], {
    extrapolateRight: "clamp",
  });
  const currentY = interpolate(localProgress, [0, 1], [0, -20], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Initial entrance animation
  const entranceScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const entranceValue = interpolate(entranceScale, [0, 1], [1.08, 1]);

  // Browser chrome opacity
  const chromeOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Step indicator animation
  const indicatorScale = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 15, stiffness: 200 },
  });
  const indicatorOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Description bar
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

  // Current section label
  const currentLabel = SCREENSHOTS[currentIndex].label;

  // Section indicator dots
  const sectionDots = SCREENSHOTS.map((_, i) => ({
    active: i === currentIndex,
    passed: i < currentIndex,
  }));

  // Glow pulse for highlight
  const glowPulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 0.6]);

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
          background: `radial-gradient(ellipse at top right, ${ACCENT_COLOR}15, transparent 60%),
                       radial-gradient(ellipse at bottom left, ${ACCENT_COLOR}10, transparent 50%)`,
        }}
      />

      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 120px rgba(99, 102, 241, ${glowPulse * 0.15})`,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

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
            width: 1690,
            height: 830,
            opacity: chromeOpacity,
            transform: `scale(${entranceValue})`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: `0 25px 80px rgba(0,0,0,0.5), 0 0 60px ${ACCENT_COLOR}30`,
            border: `2px solid ${ACCENT_COLOR}40`,
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
              position: "relative",
              zIndex: 5,
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

          {/* Screenshot images with crossfade */}
          <div style={{ position: "relative", width: 1690, height: 794 }}>
            {/* Current image */}
            <Img
              src={staticFile(SCREENSHOTS[currentIndex].src)}
              style={{
                width: 1690,
                height: 794,
                display: "block",
                objectFit: "cover",
                objectPosition: "top center",
                transform: `scale(${currentZoom}) translateY(${currentY}px)`,
                opacity: 1 - crossfadeProgress,
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />

            {/* Next image (crossfade in) */}
            {crossfadeProgress > 0 && nextIndex !== currentIndex && (
              <Img
                src={staticFile(SCREENSHOTS[nextIndex].src)}
                style={{
                  width: 1690,
                  height: 794,
                  display: "block",
                  objectFit: "cover",
                  objectPosition: "top center",
                  opacity: crossfadeProgress,
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 30,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: indicatorOpacity,
          transform: `scale(${indicatorScale})`,
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: ACCENT_COLOR,
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            padding: "8px 18px",
            borderRadius: 50,
            boxShadow: `0 4px 16px ${ACCENT_COLOR}50`,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ opacity: 0.7, fontSize: 13 }}>STEP</span>
          <span>1/10</span>
        </div>

        {/* Section dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {sectionDots.map((dot, i) => (
            <div
              key={i}
              style={{
                width: dot.active ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: dot.active
                  ? ACCENT_COLOR
                  : dot.passed
                    ? `${ACCENT_COLOR}88`
                    : "rgba(255,255,255,0.2)",
                transition: "none",
                boxShadow: dot.active ? `0 0 8px ${ACCENT_COLOR}60` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* CORE FEATURE badge */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 30,
          transform: `scale(${indicatorScale})`,
          background: `linear-gradient(135deg, ${ACCENT_COLOR}, ${ACCENT_COLOR}cc)`,
          color: "white",
          fontSize: 16,
          fontWeight: 700,
          padding: "8px 20px",
          borderRadius: 50,
          boxShadow: `0 4px 20px ${ACCENT_COLOR}50`,
          zIndex: 20,
          opacity: indicatorOpacity,
        }}
      >
        ⭐ CORE FEATURE
      </div>

      {/* Description bar */}
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
            border: `1px solid ${ACCENT_COLOR}30`,
            display: "flex",
            alignItems: "flex-start",
            gap: 24,
            boxShadow: `0 -10px 40px ${ACCENT_COLOR}20`,
          }}
        >
          {/* Accent line */}
          <div
            style={{
              width: 4,
              minHeight: 50,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${ACCENT_COLOR}, ${ACCENT_COLOR}66)`,
              flexShrink: 0,
              marginTop: 4,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "white",
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              ⭐ Trang chủ — Find Your Dream Job
            </div>
            <div
              style={{
                fontSize: 19,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              {currentLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
