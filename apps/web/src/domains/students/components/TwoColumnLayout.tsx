import React from "react";

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const TwoColumnLayout = ({ left, right }: TwoColumnLayoutProps) => (
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>{left}</div>
    <div>{right}</div>
  </div>
);

export default TwoColumnLayout;
