import React from "react";
import type { IconType } from "react-icons";
import "./StatCard.css";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: IconType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "primary",
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="stat-card loading">
        <div className="stat-card-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-value"></div>
            <div className="skeleton-description"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-header">
        <div className="stat-icon">
          <Icon />
        </div>
        {trend && (
          <div
            className={`trend ${trend.isPositive ? "positive" : "negative"}`}
          >
            <span className="trend-icon">{trend.isPositive ? "↗" : "↘"}</span>
            <span className="trend-value">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        <p className="stat-description">{description}</p>s
      </div>
    </div>
  );
};
