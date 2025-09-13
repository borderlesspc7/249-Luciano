import type React from "react";
import "./Card.css";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "bordered";
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const cardClass = [
    "card",
    variant !== "default" && `card--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={cardClass}>{children}</div>;
};

interface CardHeaderProps {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children }) => {
  return <div className="card-header">{children}</div>;
};

interface CardTitleProps {
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children }) => {
  return <h3 className="card-title">{children}</h3>;
};

interface CardDescriptionProps {
  children: React.ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
}) => {
  return <p className="card-description">{children}</p>;
};

interface CardContentProps {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ children }) => {
  return <div className="card-content">{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children }) => {
  return <div className="card-footer">{children}</div>;
};