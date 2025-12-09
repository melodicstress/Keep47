
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'vpn-key',
      label: 'Keys',
    },
    {
      name: 'messages',
      route: '/(tabs)/messages',
      icon: 'message',
      label: 'Messages',
    },
    {
      name: 'files',
      route: '/(tabs)/files',
      icon: 'folder',
      label: 'Files',
    },
    {
      name: 'bip47',
      route: '/(tabs)/bip47',
      icon: 'account-balance-wallet',
      label: 'BIP47',
    },
    {
      name: 'auth47',
      route: '/(tabs)/auth47',
      icon: 'security',
      label: 'Auth47',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="messages" name="messages" />
        <Stack.Screen key="files" name="files" />
        <Stack.Screen key="bip47" name="bip47" />
        <Stack.Screen key="auth47" name="auth47" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={420} />
    </>
  );
}
