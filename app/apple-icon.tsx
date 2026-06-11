import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0f",
          color: "#f5f5f7",
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        L<span style={{ color: "#fb7185" }}>.</span>
      </div>
    ),
    { ...size },
  );
}
