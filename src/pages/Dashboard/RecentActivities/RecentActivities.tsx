import React from "react";
import type { ActivityItem } from "../../../types/dashboard";
import {
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiPlus,
  FiClock,
} from "react-icons/fi";
import "./RecentActivities.css";

interface RecentActivitiesProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  loading = false,
}) => {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "test_completed":
        return <FiCheckCircle className="activity-icon success" />;
      case "test_failed":
        return <FiXCircle className="activity-icon danger" />;
      case "machine_created":
        return <FiSettings className="activity-icon info" />;
      case "project_created":
        return <FiPlus className="activity-icon primary" />;
      default:
        return <FiClock className="activity-icon" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  if (loading) {
    return (
      <div className="recent-activity">
        <h3>Atividades Recentes</h3>
        <div className="activity-list">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="activity-item loading">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h3>Atividades Recentes</h3>
        <span className="activity-count">{activities.length} atividades</span>
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="empty-activities">
            <FiClock className="empty-icon" />
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon-container">
                {getActivityIcon(activity.type)}
              </div>

              <div className="activity-content">
                <div className="activity-header">
                  <h4 className="activity-title">{activity.title}</h4>
                  <span className="activity-time">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>

                <p className="activity-description">{activity.description}</p>
                <div className="activity-user">
                  <span className="user-name">{activity.userName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
