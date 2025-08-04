'use client';

import React from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { MenuProps } from 'antd';

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, effectiveTheme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      case 'auto':
        return <DesktopOutlined />;
      default:
        return <SunOutlined />;
    }
  };

  const getThemeLabel = () => {
    switch (currentTheme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Light';
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: (
        <span style={{ 
          fontWeight: currentTheme === 'light' ? 600 : 400,
          color: effectiveTheme === 'dark' ? '#ffffff' : '#000000'
        }}>
          Light Theme
        </span>
      ),
      onClick: () => setTheme('light'),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: (
        <span style={{ 
          fontWeight: currentTheme === 'dark' ? 600 : 400,
          color: effectiveTheme === 'dark' ? '#ffffff' : '#000000'
        }}>
          Dark Theme
        </span>
      ),
      onClick: () => setTheme('dark'),
    },
    {
      key: 'auto',
      icon: <DesktopOutlined />,
      label: (
        <span style={{ 
          fontWeight: currentTheme === 'auto' ? 600 : 400,
          color: effectiveTheme === 'dark' ? '#ffffff' : '#000000'
        }}>
          Auto (System)
        </span>
      ),
      onClick: () => setTheme('auto'),
    },
  ];

  return (
    <Tooltip title={`Current: ${getThemeLabel()} Theme`} placement="bottomRight">
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
        overlayStyle={{
          backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#d9d9d9'}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Button
          type="text"
          icon={getThemeIcon()}
          size="middle"
          style={{
            color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
            backgroundColor: 'transparent',
            border: `1px solid ${effectiveTheme === 'dark' ? '#4b5563' : '#d9d9d9'}`,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: '80px',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '12px' }}>{getThemeLabel()}</span>
        </Button>
      </Dropdown>
    </Tooltip>
  );
};
