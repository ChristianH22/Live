import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Live — informal live music in the East Village & LES";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b0b0f",
          color: "#f5f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, color: "#fb7185", fontWeight: 700 }}>Live.</div>
        <div
          style={{
            marginTop: 24,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          Live music near you, tonight
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#a1a1aa" }}>
          The informal scene of the East Village &amp; Lower East Side
        </div>
      </div>
    ),
    { ...size },
  );
}
