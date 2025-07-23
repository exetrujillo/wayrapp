import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface ContentDashboardProps {
  title: string;
  subtitle?: string;
  quickActions: QuickAction[];
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  }>;
  recentActivity?: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'course' | 'lesson' | 'exercise';
    href?: string;
  }>;
}

export const ContentDashboard: React.FC<ContentDashboardProps> = ({
  title,
  subtitle,
  quickActions,
  stats = [],
  recentActivity = [],
}) => {
  const { t } = useTranslation();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'lesson':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'exercise':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('creator.components.contentDashboard.justNow', 'Just now');
    } else if (diffInHours < 24) {
      return t('creator.components.contentDashboard.hoursAgo', '{{hours}}h ago', { hours: diffInHours });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="content-dashboard space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h1>
        {subtitle && (
          <p className="text-lg text-neutral-600">{subtitle}</p>
        )}
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                {stat.icon && <div className="mr-2">{stat.icon}</div>}
                <span className="text-2xl font-bold text-neutral-900">{stat.value}</span>
              </div>
              <p className="text-sm text-neutral-600 mb-2">{stat.label}</p>
              {stat.trend && (
                <div className={`flex items-center justify-center text-xs ${
                  stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <svg 
                    className={`w-3 h-3 mr-1 ${stat.trend.isPositive ? '' : 'transform rotate-180'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  {Math.abs(stat.trend.value)}%
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          {t('creator.components.contentDashboard.quickActions', 'Quick Actions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.id} className="hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-full text-primary-600">
                    {action.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  {action.description}
                </p>
                {action.href ? (
                  <Link to={action.href}>
                    <Button variant={action.variant || 'primary'} fullWidth>
                      {t('common.buttons.getStarted', 'Get Started')}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant={action.variant || 'primary'} 
                    fullWidth
                    onClick={action.onClick}
                  >
                    {t('common.buttons.getStarted', 'Get Started')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            {t('creator.components.contentDashboard.recentActivity', 'Recent Activity')}
          </h2>
          <Card>
            <div className="divide-y divide-neutral-100">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-neutral-900 truncate">
                          {activity.title}
                        </h4>
                        <span className="text-xs text-neutral-500 ml-2">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        {activity.description}
                      </p>
                      {activity.href && (
                        <Link 
                          to={activity.href}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1 inline-block"
                        >
                          {t('common.buttons.view', 'View')} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentDashboard;