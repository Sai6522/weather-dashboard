'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ConfigProvider } from 'antd';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Dynamically import Dashboard to avoid SSR issues with Leaflet
const Dashboard = dynamic(
  () => import('@/components/Dashboard').then((mod) => ({ default: mod.Dashboard })),
  { 
    ssr: false,
    loading: () => <LoadingSpinner tip="Loading weather dashboard..." />
  }
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              The weather dashboard encountered an error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Home() {
  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#3b82f6',
            borderRadius: 6,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Button: {
              borderRadius: 6,
            },
            Card: {
              borderRadius: 8,
            },
          },
        }}
      >
        <Suspense fallback={<LoadingSpinner tip="Initializing dashboard..." />}>
          <Dashboard />
        </Suspense>
      </ConfigProvider>
    </ErrorBoundary>
  );
}
