import React from "react";

interface CardHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

const CardHeader = ({ children, action }: CardHeaderProps) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    }}
  >
    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#111827" }}>
      {children}
    </h2>
    {action}
  </div>
);

export default CardHeader;
