import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "vietnamese"],
});

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradientShift = interpolate(frame, [0, 90], [0, 20], {
    extrapolateRight: "clamp",
  });

  const mainScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const thanksOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const techOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const techY = interpolate(
    spring({ frame, fps, delay: 20, config: { damping: 200 } }),
    [0, 1],
    [30, 0]
  );

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
      {/* Decorative orbs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          top: -100,
          left: "30%",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)",
          bottom: -100,
          right: "20%",
          filter: "blur(40px)",
        }}
      />

      {/* Thank you text */}
      <div
        style={{
          opacity: thanksOpacity,
          transform: `scale(${mainScale})`,
          fontSize: 64,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          letterSpacing: -1,
        }}
      >
        Thank you! 🚀
      </div>

      <div
        style={{
          opacity: thanksOpacity,
          fontSize: 28,
          color: "rgba(255,255,255,0.6)",
          marginTop: 16,
          fontWeight: 400,
        }}
      >
        SCC — Smart Career Connect
      </div>

      {/* Tech stack */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 50,
          opacity: techOpacity,
          transform: `translateY(${techY}px)`,
        }}
      >
        {[
          { label: "Next.js", color: "#000000" },
          { label: "NestJS", color: "#E0234E" },
          { label: "AI / LLM", color: "#7C3AED" },
          { label: "PostgreSQL", color: "#336791" },
        ].map((tech) => (
          <div
            key={tech.label}
            style={{
              padding: "14px 32px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 22,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: tech.color,
                boxShadow: `0 0 12px ${tech.color}80`,
              }}
            />
            {tech.label}
          </div>
        ))}
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          opacity: techOpacity,
          fontSize: 18,
          color: "rgba(255,255,255,0.35)",
          fontWeight: 400,
        }}
      >
        EXE101 — FPT University — 2026
      </div>
    </div>
  );
};
