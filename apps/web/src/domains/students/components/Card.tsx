import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card = ({ children, style = {} }: CardProps) => (
  <div
    style={{
      padding: 24,
      backgroundColor: "white",
      borderRadius: 8,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;
