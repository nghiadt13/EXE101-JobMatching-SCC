import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "vietnamese"],
});

export const TitleScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient animation
  const gradientShift = interpolate(frame, [0, 90], [0, 30], {
    extrapolateRight: "clamp",
  });

  // Logo scale spring
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Title slide up
  const titleY = interpolate(
    spring({ frame, fps, delay: 10, config: { damping: 200 } }),
    [0, 1],
    [60, 0]
  );
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle fade in
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(
    spring({ frame, fps, delay: 25, config: { damping: 200 } }),
    [0, 1],
    [40, 0]
  );

  // Decorative particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137.5) % 1920,
    y: (i * 97.3) % 1080,
    size: 3 + (i % 5) * 2,
    delay: i * 3,
    speed: 0.5 + (i % 3) * 0.3,
  }));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        background: `linear-gradient(${135 + gradientShift}deg, #0f0c29, #302b63, #24243e)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated particles */}
      {particles.map((p, i) => {
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 20],
          [0, 0.3 + (i % 3) * 0.15],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const particleY = p.y - frame * p.speed;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: particleY % 1080,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `rgba(99, 102, 241, ${particleOpacity})`,
              boxShadow: `0 0 ${p.size * 3}px rgba(99, 102, 241, ${particleOpacity * 0.5})`,
            }}
          />
        );
      })}

      {/* Gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)",
          top: -100,
          right: -100,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
          bottom: -150,
          left: -50,
          filter: "blur(40px)",
        }}
      />

      {/* Logo icon */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 30,
          width: 100,
          height: 100,
          borderRadius: 24,
          background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 60px rgba(79,70,229,0.4)",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "white",
            lineHeight: 1,
          }}
        >
          SCC
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          fontSize: 72,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          letterSpacing: -2,
          lineHeight: 1.1,
        }}
      >
        HR Recruitment Platform
      </div>

      {/* Subtitle */}
      <div
        style={{
          transform: `translateY(${subtitleY}px)`,
          opacity: subtitleOpacity,
          fontSize: 32,
          fontWeight: 400,
          color: "rgba(255,255,255,0.7)",
          textAlign: "center",
          marginTop: 20,
          letterSpacing: 1,
        }}
      >
        Hệ thống tuyển dụng thông minh với AI Matching
      </div>

      {/* Tech badges */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 40,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        {["Next.js", "NestJS", "AI Matching", "PostgreSQL"].map(
          (tech, index) => (
            <div
              key={tech}
              style={{
                padding: "10px 24px",
                borderRadius: 50,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
                fontSize: 18,
                fontWeight: 700,
                backdropFilter: "blur(10px)",
              }}
            >
              {tech}
            </div>
          )
        )}
      </div>
    </div>
  );
};
