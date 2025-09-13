"use client";

import type React from "react";
import { useState } from "react";
import "./Input.css";

interface InputProps {
  label?: string;
  type?: "text" | "email" | "password" | "number" | "tel";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          type={inputType}
          className={`input ${error ? "input--error" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          required={required}
        />
        {type === "password" && showPasswordToggle && (
          <span
            className="input-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </span>
        )}
      </div>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
}) => {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
      )}
      <select
        className={`select ${error ? "input--error" : ""}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};
