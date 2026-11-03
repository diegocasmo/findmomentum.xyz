import { ImageResponse } from "next/og";

export const alt = "Momentum - Track Daily Progress with Small Wins";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              background: "linear-gradient(to bottom right, #60a5fa, #a78bfa)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "40px",
            }}
          >
            Momentum
          </div>
          <div
            style={{
              fontSize: 48,
              color: "#cbd5e1",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.3,
            }}
          >
            Track Daily Progress with Small Wins
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
