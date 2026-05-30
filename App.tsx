import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDB, getAllItems } from './src/database/db';
import { WardrobeItem, Tab } from './src/types';
import TabBar from './src/components/TabBar';
import MirrorScreen from './src/screens/MirrorScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mirror');
  const [items, setItems] = useState<WardrobeItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getAllItems());
  }, []);

  useEffect(() => {
    initDB();
    refresh();
  }, []);

  // Refresh items every time the tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    refresh();
  };

  function renderScreen() {
    switch (activeTab) {
      case 'mirror':    return <MirrorScreen items={items} />;
      case 'wardrobe':  return <WardrobeScreen items={items} onRefresh={refresh} />;
      case 'analytics': return <AnalyticsScreen items={items} />;
      case 'settings':  return <SettingsScreen />;
    }
  }

  return (
    <SafeAreaProvider>
      <View style={s.root}>
        <StatusBar style="dark" />
        <View style={s.screen}>{renderScreen()}</View>
        <TabBar active={activeTab} onChange={handleTabChange} />
      </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F9F9F6' },
  screen: { flex: 1 },
});