import type { FC, ReactNode, HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

/* ==========================================================================
   Base Card & Structural Subcomponents
   ========================================================================== */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
}

export const Card: FC<CardProps> = ({
  hoverable = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all ${
        hoverable ? 'hover:border-slate-300 hover:shadow-sm' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  action?: ReactNode;
  className?: string;
}

export const CardHeader: FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-sc-green',
  iconBg = 'bg-sc-navy',
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between pb-4 border-b border-slate-100 gap-3 ${className}`}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBg} ${iconColor}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-900 tracking-tight truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardFooter: FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={`pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

/* ==========================================================================
   Financial Dashboard Metric KPI Card
   ========================================================================== */

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: ReactNode;
  icon: LucideIcon;
  theme?: 'green' | 'blue' | 'navy' | 'purple' | 'amber';
  badge?: ReactNode;
  className?: string;
}

export const MetricCard: FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  theme = 'blue',
  badge,
  className = '',
}) => {
  const themeMap = {
    green: {
      bg: 'bg-sc-green-light',
      text: 'text-sc-green',
      border: 'border-sc-green/20',
    },
    blue: {
      bg: 'bg-sc-blue-light',
      text: 'text-sc-blue',
      border: 'border-sc-blue/20',
    },
    navy: {
      bg: 'bg-slate-100',
      text: 'text-sc-navy',
      border: 'border-slate-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
  };

  const currentTheme = themeMap[theme];

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex items-center justify-between gap-4 ${className}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            {label}
          </span>
          {badge}
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
          {value}
        </div>
        {subtext && (
          <div className="text-[11px] font-medium text-slate-500 truncate">
            {subtext}
          </div>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shadow-xs`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

