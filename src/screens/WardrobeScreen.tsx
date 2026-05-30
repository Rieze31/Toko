import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Image, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { WardrobeItem, ItemType, Silhouette } from '../types';
import { ShirtSilhouette, TrouserSilhouette, SneakerSilhouette, JacketSilhouette } from '../components/Silhouettes';
import { addItem, deleteItem, updateItemPhoto } from '../database/db';

const FILTERS = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes'] as const;
type Filter = typeof FILTERS[number];

const TYPE_OPTIONS: { label: string; type: ItemType; silhouette: Silhouette }[] = [
  { label: 'Shirt / Top',   type: 'tops',      silhouette: 'shirt'   },
  { label: 'Trousers',      type: 'bottoms',   silhouette: 'trouser' },
  { label: 'Jacket',        type: 'outerwear', silhouette: 'jacket'  },
  { label: 'Shoes',         type: 'shoes',     silhouette: 'sneaker' },
];

const COLORS = ['#3B5E8C','#2A3A50','#7D9080','#B8A882','#3A3A3A','#7A4A2A','#D8D4CC','#6A4A28','#6A7060','#C07858','#8B4A6A','#4A7A5A'];

function SilIcon({ item, size = 36 }: { item: WardrobeItem; size?: number }) {
  if (item.silhouette === 'shirt')   return <ShirtSilhouette color={item.color} size={size} />;
  if (item.silhouette === 'trouser') return <TrouserSilhouette color={item.color} size={size} />;
  if (item.silhouette === 'sneaker') return <SneakerSilhouette color={item.color} size={size} />;
  return <JacketSilhouette color={item.color} size={size} />;
}

interface Props {
  items: WardrobeItem[];
  onRefresh: () => void;
}

export default function WardrobeScreen({ items, onRefresh }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [newName, setNewName]       = useState('');
  const [newType, setNewType]       = useState<typeof TYPE_OPTIONS[0]>(TYPE_OPTIONS[0]);
  const [newColor, setNewColor]     = useState(COLORS[0]);
  const [newTag, setNewTag]         = useState('');
  const [newPhoto, setNewPhoto]     = useState<string | null>(null);

  const filtered = items.filter(item => {
    const matchesFilter = filter === 'All' || item.type === filter.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pickClothingPhoto = async () => {
    Alert.alert('Add Photo', 'Lay your clothing flat on a light surface for best results.', [
      {
        text: 'Take Photo', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) setNewPhoto(result.assets[0].uri);
        }
      },
      {
        text: 'From Gallery', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) setNewPhoto(result.assets[0].uri);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this item.');
      return;
    }
    addItem({
      name: newName.trim(),
      wears: 0,
      tag: newTag.trim() || 'New',
      type: newType.type,
      silhouette: newType.silhouette,
      color: newColor,
      photo_uri: newPhoto,
    });
    // Reset form
    setNewName('');
    setNewTag('');
    setNewPhoto(null);
    setNewType(TYPE_OPTIONS[0]);
    setNewColor(COLORS[0]);
    setShowAdd(false);
    onRefresh();
  };

  const handleDelete = (item: WardrobeItem) => {
    Alert.alert('Remove Item', `Remove "${item.name}" from your wardrobe?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deleteItem(item.id); onRefresh(); } },
    ]);
  };

  const handleAddPhoto = async (item: WardrobeItem) => {
    Alert.alert('Add Photo', 'Lay your clothing flat on a light surface.', [
      {
        text: 'Take Photo', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) { updateItemPhoto(item.id, result.assets[0].uri); onRefresh(); }
        }
      },
      {
        text: 'From Gallery', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) { updateItemPhoto(item.id, result.assets[0].uri); onRefresh(); }
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>My Closet</Text>
          <Text style={s.subtitle}>{items.length} items catalogued</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search your wardrobe…"
          placeholderTextColor="#BBBBBB"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.pill, filter === f && s.pillActive]} onPress={() => setFilter(f)}>
            <Text style={[s.pillText, filter === f && s.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.grid} contentContainerStyle={s.gridContent} showsVerticalScrollIndicator={false}>
        <View style={s.row}>
          {filtered.map(item => (
            <View key={item.id} style={s.card}>
              <TouchableOpacity style={s.cardIcon} onPress={() => handleAddPhoto(item)}>
                {item.photo_uri ? (
                  <Image source={{ uri: item.photo_uri }} style={s.cardPhoto} resizeMode="cover" />
                ) : (
                  <>
                    <SilIcon item={item} size={48} />
                    <Text style={s.tapToPhoto}>📷 tap to add photo</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.cardWears}>{item.wears} wears</Text>
              <View style={s.cardFooter}>
                <View style={s.tag}><Text style={s.tagText}>{item.tag}</Text></View>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text style={s.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Add Clothing</Text>

            {/* Photo picker */}
            <TouchableOpacity style={s.photoPicker} onPress={pickClothingPhoto}>
              {newPhoto ? (
                <Image source={{ uri: newPhoto }} style={s.photoPickerImg} resizeMode="cover" />
              ) : (
                <>
                  <Text style={s.photoPickerIcon}>📷</Text>
                  <Text style={s.photoPickerText}>Tap to photo your clothing{'\n'}(lay flat on light surface)</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Name */}
            <TextInput
              style={s.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Item name (e.g. White Linen Shirt)"
              placeholderTextColor="#BBB"
            />

            {/* Tag */}
            <TextInput
              style={s.input}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Tag (e.g. Casual, Formal)"
              placeholderTextColor="#BBB"
            />

            {/* Type selector */}
            <Text style={s.label}>Category</Text>
            <View style={s.typeRow}>
              {TYPE_OPTIONS.map(t => (
                <TouchableOpacity
                  key={t.type}
                  style={[s.typeBtn, newType.type === t.type && s.typeBtnActive]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[s.typeBtnText, newType.type === t.type && s.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color selector */}
            <Text style={s.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={s.colorRow}>
                {COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.colorDot, { backgroundColor: c }, newColor === c && s.colorDotActive]}
                    onPress={() => setNewColor(c)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleAdd}>
                <Text style={s.confirmBtnText}>Add to Wardrobe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F9F9F6' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:          { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle:       { fontSize: 13, color: '#888', marginTop: 2 },
  addBtn:         { backgroundColor: '#7D9080', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchWrap:     { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', paddingHorizontal: 12, height: 40, justifyContent: 'center' },
  searchInput:    { fontSize: 14, color: '#1A1A1A' },
  filterScroll:   { flexGrow: 0, marginBottom: 12 },
  filterContent:  { paddingHorizontal: 20, gap: 8 },
  pill:           { paddingHorizontal: 14, height: 32, borderRadius: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAEAEA', justifyContent: 'center' },
  pillActive:     { backgroundColor: '#7D9080', borderColor: '#7D9080' },
  pillText:       { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  pillTextActive: { color: '#fff' },
  grid:           { flex: 1 },
  gridContent:    { paddingHorizontal: 20, paddingBottom: 20 },
  row:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:           { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardIcon:       { alignItems: 'center', marginBottom: 8, minHeight: 60 },
  cardPhoto:      { width: '100%', height: 90, borderRadius: 10 },
  tapToPhoto:     { fontSize: 9, color: '#AAA', marginTop: 4, fontWeight: '600' },
  cardName:       { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  cardWears:      { fontSize: 11, color: '#888', marginTop: 2 },
  cardFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  tag:            { backgroundColor: '#E2E8E4', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:        { fontSize: 10, fontWeight: '600', color: '#7D9080' },
  deleteText:     { fontSize: 14, color: '#CCC', fontWeight: '700' },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },

  photoPicker:    { height: 120, backgroundColor: '#F4F4F1', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  photoPickerImg: { width: '100%', height: '100%' },
  photoPickerIcon:{ fontSize: 28, marginBottom: 6 },
  photoPickerText:{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18 },

  input:          { backgroundColor: '#F4F4F1', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 14, color: '#1A1A1A', marginBottom: 12 },
  label:          { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },

  typeRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeBtn:        { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F4F4F1', borderRadius: 10 },
  typeBtnActive:  { backgroundColor: '#7D9080' },
  typeBtnText:    { fontSize: 12, fontWeight: '600', color: '#888' },
  typeBtnTextActive: { color: '#fff' },

  colorRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 2 },
  colorDot:       { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: '#1A1A1A', transform: [{ scale: 1.15 }] },

  modalActions:   { flexDirection: 'row', gap: 12 },
  cancelBtn:      { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#EAEAEA', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:  { fontSize: 14, fontWeight: '600', color: '#888' },
  confirmBtn:     { flex: 2, height: 48, borderRadius: 14, backgroundColor: '#7D9080', alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});