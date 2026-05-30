import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { WardrobeItem } from '../types';

interface Props { items: WardrobeItem[] }

export default function AnalyticsScreen({ items }: Props) {
  const sorted = [...items].sort((a, b) => b.wears - a.wears);
  const top5   = sorted.slice(0, 5);
  const maxWears = top5[0]?.wears ?? 1;

  const unworn = items.filter(i => i.wears < 5).map(i => ({
    name: i.name,
    days: Math.floor(Math.random() * 60) + 20, // placeholder — replace with actual last_worn date from DB
    tag: i.type.charAt(0).toUpperCase() + i.type.slice(1),
  }));

  const totalWears = items.reduce((sum, i) => sum + i.wears, 0);
  const efficiency = Math.round((items.filter(i => i.wears > 3).length / items.length) * 100);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>Insights</Text>
        <Text style={s.subtitle}>Last 90 days · {items.length} items tracked</Text>
      </View>

      {/* Efficiency card */}
      <View style={s.heroCard}>
        <View style={s.heroRow}>
          <Text style={s.heroNum}>{efficiency}%</Text>
          <Text style={s.heroArrow}>↑</Text>
        </View>
        <Text style={s.heroLabel}>Wardrobe Efficiency</Text>
        <Text style={s.heroSub}>You actively wear most of what you own.</Text>
        <View style={s.sparkRow}>
          {[60, 80, 45, 90, 70, efficiency, 78, 92, 65, 88].map((h, i) => (
            <View key={i} style={[s.spark, { height: h * 0.4, opacity: i === 5 ? 1 : 0.3 }]} />
          ))}
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>AVG COST/WEAR</Text>
          <Text style={s.statNum}>₱124</Text>
          <Text style={s.statSub}>↓ 12% vs last qtr</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>TOTAL LOGGED</Text>
          <Text style={s.statNum}>{totalWears}</Text>
          <Text style={s.statSub}>Total wear events</Text>
        </View>
      </View>

      {/* Most worn */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>MOST WORN</Text>
        {top5.map((item, i) => (
          <View key={item.id} style={s.rankRow}>
            <Text style={s.rank}>{i + 1}</Text>
            <View style={s.rankInfo}>
              <View style={s.rankMeta}>
                <Text style={s.rankName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.rankCount}>{item.wears}×</Text>
              </View>
              <View style={s.bar}>
                <View style={[s.barFill, { width: `${(item.wears / maxWears) * 100}%` as any }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Unworn warning */}
      {unworn.length > 0 && (
        <View style={s.warnSection}>
          <View style={s.warnHeader}>
            <Text style={s.warnIcon}>⚠️</Text>
            <Text style={s.warnLabel}>UNWORN (5 OR FEWER WEARS)</Text>
          </View>
          {unworn.slice(0, 3).map(item => (
            <View key={item.name} style={s.warnRow}>
              <View>
                <Text style={s.warnName}>{item.name}</Text>
                <Text style={s.warnDays}>{item.days} days approx.</Text>
              </View>
              <View style={s.warnTag}><Text style={s.warnTagText}>{item.tag}</Text></View>
            </View>
          ))}
          <TouchableOpacity style={s.warnBtn}>
            <Text style={s.warnBtnText}>Style them or plan to donate</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#F9F9F6' },
  content:  { padding: 20, paddingBottom: 40 },
  header:   { marginBottom: 16 },
  title:    { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },

  heroCard: { backgroundColor: '#7D9080', borderRadius: 20, padding: 20, marginBottom: 12 },
  heroRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  heroNum:  { fontSize: 44, fontWeight: '800', color: '#fff', lineHeight: 48 },
  heroArrow:{ fontSize: 22, color: '#fff', opacity: 0.7, marginBottom: 6 },
  heroLabel:{ fontSize: 14, fontWeight: '600', color: '#fff', opacity: 0.9 },
  heroSub:  { fontSize: 12, color: '#fff', opacity: 0.65, marginTop: 4, lineHeight: 18 },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 16, height: 40 },
  spark:    { flex: 1, backgroundColor: '#fff', borderRadius: 2 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  statLabel:{ fontSize: 10, fontWeight: '700', color: '#7D9080', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  statNum:  { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  statSub:  { fontSize: 11, color: '#888', marginTop: 2 },

  section:      { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#7D9080', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  rankRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rank:     { fontSize: 12, fontWeight: '700', color: '#888', width: 16 },
  rankInfo: { flex: 1 },
  rankMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rankName: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', flex: 1, marginRight: 8 },
  rankCount:{ fontSize: 12, fontWeight: '700', color: '#7D9080' },
  bar:      { height: 4, backgroundColor: '#F0F0EE', borderRadius: 2, overflow: 'hidden' },
  barFill:  { height: '100%', backgroundColor: '#7D9080', borderRadius: 2 },

  warnSection: { backgroundColor: '#FEF9F5', borderWidth: 1, borderColor: '#F0D8C8', borderRadius: 20, padding: 16, marginBottom: 12 },
  warnHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  warnIcon:    { fontSize: 14 },
  warnLabel:   { fontSize: 10, fontWeight: '700', color: '#C0703A', letterSpacing: 1, textTransform: 'uppercase' },
  warnRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  warnName:    { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  warnDays:    { fontSize: 11, color: '#888', marginTop: 2 },
  warnTag:     { backgroundColor: '#F5E4D8', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  warnTagText: { fontSize: 10, fontWeight: '600', color: '#C0703A' },
  warnBtn:     { borderWidth: 1, borderColor: '#E8C8A8', borderRadius: 12, height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  warnBtnText: { fontSize: 12, fontWeight: '600', color: '#C0703A' },
});