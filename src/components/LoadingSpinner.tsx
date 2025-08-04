'use client';

import React from 'react';
import { Spin } from 'antd';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ 
  size = 'large', 
  tip = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <Spin size={size} tip={tip}>
        <div className="p-8" />
      </Spin>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
