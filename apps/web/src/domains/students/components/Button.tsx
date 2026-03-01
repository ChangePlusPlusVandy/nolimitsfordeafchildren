interface ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  color?: string;
  variant?: "solid" | "outline";
  children: React.ReactNode;
}

const Button = ({ onClick, color = "#2563eb", variant = "solid", children }: ButtonProps) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      backgroundColor: variant === "solid" ? color : "transparent",
      color: variant === "solid" ? "white" : color,
      border: variant === "outline" ? `1px solid ${color}` : "none",
      borderRadius: 6,
      fontWeight: 500,
      cursor: "pointer",
      fontSize: 14,
    }}
  >
    {children}
  </button>
);

export default Button;
