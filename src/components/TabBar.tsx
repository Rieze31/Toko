import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tab } from '../types';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'mirror',    label: 'Mirror',    emoji: '🪞' },
  { id: 'wardrobe',  label: 'Wardrobe',  emoji: '👔' },
  { id: 'outfits',   label: 'Outfits',   emoji: '✨' },
  { id: 'analytics', label: 'Insights',  emoji: '📊' },
  { id: 'settings',  label: 'Settings',  emoji: '⚙️' },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function TabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: insets.bottom || 12 }]}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.tab}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[s.iconWrap, isActive && s.iconWrapActive]}>
              <Text style={s.emoji}>{tab.emoji}</Text>
            </View>
            <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EAEAEA', paddingTop: 8, paddingHorizontal: 8 },
  tab:       { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap:  { width: 40, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#E2E8E4' },
  emoji:     { fontSize: 16 },
  label:     { fontSize: 10, fontWeight: '500', color: '#AAAAAA', letterSpacing: 0.3 },
  labelActive: { color: '#7D9080' },
});