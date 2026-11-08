import type { FC, HTMLAttributes } from 'react';

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'inline' | 'card' | 'page' | 'overlay';
  color?: 'sc' | 'green' | 'blue' | 'white' | 'slate';
  text?: string;
  subtext?: string;
  className?: string;
}

export const Loader: FC<LoaderProps> = ({
  size = 'md',
  variant = 'inline',
  color = 'sc',
  text,
  subtext,
  className = '',
  ...rest
}) => {
  // Sizing definitions
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const spinnerSize = sizeMap[size];

  // Render the animated spinner element
  const renderSpinner = () => {
    if (color === 'white') {
      return (
        <svg
          className={`animate-spin ${spinnerSize} shrink-0 text-white`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2.5"
            className="opacity-25"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    if (color === 'green') {
      return (
        <svg
          className={`animate-spin ${spinnerSize} shrink-0 text-sc-green`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="#e2e8f0"
            strokeWidth="2.5"
            className="opacity-60"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    if (color === 'blue') {
      return (
        <svg
          className={`animate-spin ${spinnerSize} shrink-0 text-sc-blue`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="#e2e8f0"
            strokeWidth="2.5"
            className="opacity-60"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    // Default: 'sc' (Standard Chartered signature dual green & blue interlocking arcs)
    return (
      <div className={`relative flex items-center justify-center ${spinnerSize} shrink-0`}>
        <svg
          className={`animate-spin ${spinnerSize} shrink-0`}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle track */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#e2e8f0"
            strokeWidth="3.5"
            className="opacity-60"
          />
          {/* SC Green primary arc */}
          <path
            d="M20 4C28.8366 4 36 11.1634 36 20"
            stroke="#00965e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* SC Blue secondary arc */}
          <path
            d="M20 36C11.1634 36 4 28.8366 4 20"
            stroke="#0073ae"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
        {(size === 'lg' || size === 'xl') && (
          <div className="absolute w-2 h-2 rounded-full bg-sc-green animate-ping opacity-75" />
        )}
      </div>
    );
  };

  // 1. Inline Variant (buttons, headers, chips)
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`} {...rest}>
        {renderSpinner()}
        {text && <span className="text-xs font-medium leading-none">{text}</span>}
      </div>
    );
  }

  // 2. Card Variant (panels, tables, containers)
  if (variant === 'card') {
    return (
      <div
        className={`py-8 px-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 ${className}`}
        {...rest}
      >
        {renderSpinner()}
        {text && (
          <p className="text-xs font-bold text-slate-800 tracking-tight">
            {text}
          </p>
        )}
        {subtext && (
          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    );
  }

  // 3. Full-Page Variant
  if (variant === 'page') {
    return (
      <div
        className={`min-h-[400px] py-16 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200 ${className}`}
        {...rest}
      >
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-1">
          {renderSpinner()}
        </div>
        {text && (
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {text}
          </h3>
        )}
        {subtext && (
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    );
  }

  // 4. Translucent Overlay Variant
  return (
    <div
      className={`absolute inset-0 bg-white/80 backdrop-blur-[1.5px] z-20 flex flex-col items-center justify-center text-center p-4 space-y-2.5 rounded-inherit animate-in fade-in duration-150 ${className}`}
      {...rest}
    >
      {renderSpinner()}
      {text && (
        <p className="text-xs font-bold text-slate-800">
          {text}
        </p>
      )}
      {subtext && (
        <p className="text-[11px] text-slate-500 max-w-xs">
          {subtext}
        </p>
      )}
    </div>
  );
};

/**
 * Convenient shortcut for full-page loading state
 */
export const PageLoader: FC<{ text?: string; subtext?: string; className?: string }> = ({
  text = 'Loading Platform Data...',
  subtext = 'Connecting to Apache Iceberg metadata and Trino SQL engine...',
  className = '',
}) => {
  return (
    <Loader
      size="lg"
      variant="page"
      color="sc"
      text={text}
      subtext={subtext}
      className={className}
    />
  );
};

/**
 * Skeleton shimmer component for layout placeholders
 */
export const Skeleton: FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-slate-200/70 animate-pulse rounded-md ${className}`}
    />
  );
};

