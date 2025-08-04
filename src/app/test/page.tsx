'use client';

import dynamic from 'next/dynamic';
import { ConfigProvider, Layout, Typography, Tabs } from 'antd';
import Link from 'next/link';

const { Header, Content } = Layout;
const { Title } = Typography;

// Dynamically import test components to avoid SSR issues
const TestRunner = dynamic(
  () => import('@/components/TestRunner').then((mod) => ({ default: mod.TestRunner })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading functionality tests...</div>
      </div>
    )
  }
);

const UILayoutTest = dynamic(
  () => import('@/components/UILayoutTest').then((mod) => ({ default: mod.UILayoutTest })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading UI tests...</div>
      </div>
    )
  }
);

export default function TestPage() {
  const tabItems = [
    {
      key: '1',
      label: 'Functionality Tests',
      children: <TestRunner />
    },
    {
      key: '2',
      label: 'UI Layout Tests',
      children: <UILayoutTest />
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 6,
        },
      }}
    >
      <Layout className="min-h-screen">
        <Header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-full">
            <Title level={3} className="m-0 text-blue-600">
              Weather Dashboard - Test Suite
            </Title>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
          </div>
        </Header>
        
        <Content className="p-6 bg-gray-50">
          <Tabs 
            defaultActiveKey="2" 
            items={tabItems}
            size="large"
            className="bg-white rounded-lg p-4"
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
