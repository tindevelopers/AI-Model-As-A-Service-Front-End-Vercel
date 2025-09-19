import React, { ReactNode } from "react";

interface CardProps {
  children?: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children?: ReactNode;
  className?: string;
}

interface CardContentProps {
  children?: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

// Card Component
const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      {children}
    </div>
  );
};

// CardHeader Component
const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pb-0 ${className}`}>
      {children}
    </div>
  );
};

// CardContent Component
const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

// CardTitle Component
const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => {
  return (
    <h4 className={`mb-1 font-medium text-gray-800 text-theme-xl dark:text-white/90 ${className}`}>
      {children}
    </h4>
  );
};

// CardDescription Component
const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

export { Card, CardHeader, CardContent, CardTitle, CardDescription };
export default Card;
