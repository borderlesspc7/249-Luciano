"use client";

import type React from "react";
import "./Button.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
}) => {
  const className = [
    "button",
    `button--${variant}`,
    size !== "medium" && `button--${size}`,
    fullWidth && "button--full",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
