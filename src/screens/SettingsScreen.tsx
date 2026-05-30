import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>Preferences</Text>
        <Text style={s.subtitle}>App version 1.0.0 · Toko</Text>
      </View>

      <View style={s.privacyCard}>
        <Text style={s.privacyTitle}>🔒 100% Offline. Zero cloud tracking.</Text>
        <Text style={s.privacyBody}>Your wardrobe data and body photo are stored only on this device via SQLite. Nothing leaves your phone.</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>Account</Text>
        <View style={s.card}>
          <View style={s.profileRow}>
            <View style={s.avatar}><Text style={s.avatarText}>ME</Text></View>
            <View>
              <Text style={s.profileName}>Local Profile</Text>
              <Text style={s.profileSub}>No account needed</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>Notifications</Text>
        <View style={s.card}>
          <View style={s.settingRow}>
            <View>
              <Text style={s.settingLabel}>Outfit suggestions</Text>
              <Text style={s.settingSub}>Daily morning picks</Text>
            </View>
            <Switch trackColor={{ false: '#E0E0E0', true: '#7D9080' }} value={true} />
          </View>
          <View style={s.divider} />
          <View style={s.settingRow}>
            <View>
              <Text style={s.settingLabel}>Unworn nudges</Text>
              <Text style={s.settingSub}>Alert after 30 days idle</Text>
            </View>
            <Switch trackColor={{ false: '#E0E0E0', true: '#7D9080' }} value={true} />
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>Danger Zone</Text>
        <TouchableOpacity
          style={s.dangerBtn}
          onPress={() => Alert.alert('Clear all data?', 'This will delete your wardrobe, body photo, and outfit history.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive' },
          ])}
        >
          <Text style={s.dangerText}>🗑 Clear all app data</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>TOKO · Made with care, no data collected</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F9F9F6' },
  content:      { padding: 20, paddingBottom: 40 },
  header:       { marginBottom: 16 },
  title:        { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle:     { fontSize: 13, color: '#888', marginTop: 2 },
  privacyCard:  { backgroundColor: '#E2E8E4', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#7D9080' },
  privacyTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  privacyBody:  { fontSize: 12, color: '#555', lineHeight: 18 },
  section:      { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingLeft: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  profileRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8E4', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 13, fontWeight: '700', color: '#7D9080' },
  profileName:  { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  profileSub:   { fontSize: 11, color: '#888' },
  settingRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  settingLabel: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  settingSub:   { fontSize: 11, color: '#888', marginTop: 2 },
  divider:      { height: 1, backgroundColor: '#F4F4F1', marginHorizontal: 12 },
  dangerBtn:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0C8C8', alignItems: 'center' },
  dangerText:   { fontSize: 13, fontWeight: '600', color: '#C0392B' },
  footer:       { textAlign: 'center', fontSize: 11, color: '#CCCCCC', marginTop: 8 },
});