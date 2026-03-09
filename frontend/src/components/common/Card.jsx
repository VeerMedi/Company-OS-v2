import React from 'react';

const Card = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-card text-card-foreground shadow-sm rounded-lg border border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-b border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ className = '', children, ...props }) => {
  return (
    <h3
      className={`text-lg font-semibold text-card-foreground ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };