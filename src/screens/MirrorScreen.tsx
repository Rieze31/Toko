import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, Alert, ActivityIndicator, PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { WardrobeItem, OverlayLayer } from '../types';
import {
  BodyCanvas, ShirtSilhouette, TrouserSilhouette,
  SneakerSilhouette, JacketSilhouette,
} from '../components/Silhouettes';
import { saveBodyPhoto, getBodyPhoto, saveOutfit, incrementWears } from '../database/db';

const FILTERS = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes'] as const;
type Filter = typeof FILTERS[number];
const { width: SCREEN_W } = Dimensions.get('window');
const CANVAS_H = 400;


const SERVER_URL = 'https://toko-production-fac4.up.railway.app';

interface Props { items: WardrobeItem[] }

function SilIcon({ item, size = 36 }: { item: WardrobeItem; size?: number }) {
  if (item.silhouette === 'shirt')   return <ShirtSilhouette color={item.color} size={size} />;
  if (item.silhouette === 'trouser') return <TrouserSilhouette color={item.color} size={size} />;
  if (item.silhouette === 'sneaker') return <SneakerSilhouette color={item.color} size={size} />;
  return <JacketSilhouette color={item.color} size={size} />;
}

function ClothingOverlay({ layer, onMove, onRemove, isSelected, onSelect }: {
  layer: OverlayLayer;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const startPos = useRef({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
        startPos.current = { x: layer.x, y: layer.y };
      },
      onPanResponderMove: (_, gs) => {
        onMove(startPos.current.x + gs.dx, startPos.current.y + gs.dy);
      },
    })
  ).current;

  const SIZE = 110 * layer.scale;
  return (
    <View
      style={[
        styles.overlayItem,
        { left: layer.x - SIZE / 2, top: layer.y - SIZE / 2, width: SIZE, height: SIZE },
        isSelected && styles.overlayItemSelected,
      ]}
      {...panResponder.panHandlers}
    >
      {layer.item.photo_uri ? (
        <Image source={{ uri: layer.item.photo_uri }} style={{ width: SIZE, height: SIZE, borderRadius: 8 }} resizeMode="contain" />
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <SilIcon item={layer.item} size={SIZE * 0.7} />
        </View>
      )}
      {isSelected && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MirrorScreen({ items }: Props) {
  const [filter, setFilter]     = useState<Filter>('All');
  const [bodyPhoto, setBodyPhoto] = useState<string | null>(getBodyPhoto());
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [layers, setLayers]     = useState<OverlayLayer[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<'ai' | 'manual'>('manual');
  const [saved, setSaved]       = useState(false);

  const visibleItems = items.filter(item =>
    filter === 'All' || item.type === filter.toLowerCase()
  );
  const activeIds = new Set(layers.map(l => l.item.id));

  const takeBodyPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setBodyPhoto(result.assets[0].uri);
      saveBodyPhoto(result.assets[0].uri);
      setAiResult(null);
    }
  };

  const pickBodyPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setBodyPhoto(result.assets[0].uri);
      saveBodyPhoto(result.assets[0].uri);
      setAiResult(null);
    }
  };

  const runAITryOn = async (item: WardrobeItem) => {
    if (!bodyPhoto) {
      Alert.alert('No photo', 'Please add your full body photo first.');
      return;
    }
    if (!item.photo_uri) {
      Alert.alert('No clothing photo', `"${item.name}" needs a photo. Go to Wardrobe and tap the item to add one.`);
      return;
    }
    setLoading(true);
    setAiResult(null);
    try {
      const formData = new FormData();
      formData.append('person', { uri: bodyPhoto, type: 'image/jpeg', name: 'person.jpg' } as any);
      formData.append('clothing', { uri: item.photo_uri, type: 'image/jpeg', name: 'clothing.jpg' } as any);

      const response = await fetch(`${SERVER_URL}/tryon`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }

      const data = await response.json();
      if (data.image) {
        setAiResult(`data:image/png;base64,${data.image}`);
        incrementWears(item.id);
      }
    } catch (err: any) {
      Alert.alert('AI Try-On failed', `${err.message}\n\nSwitching to manual mode.`, [
        { text: 'OK', onPress: () => setMode('manual') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemTap = (item: WardrobeItem) => {
    if (mode === 'ai') { runAITryOn(item); return; }
    if (activeIds.has(item.id)) {
      setLayers(prev => prev.filter(l => l.item.id !== item.id));
      setSelectedId(null);
    } else {
      const pos: Record<string, { x: number; y: number }> = {
        tops:      { x: SCREEN_W / 2, y: CANVAS_H * 0.35 },
        bottoms:   { x: SCREEN_W / 2, y: CANVAS_H * 0.62 },
        shoes:     { x: SCREEN_W / 2, y: CANVAS_H * 0.85 },
        outerwear: { x: SCREEN_W / 2, y: CANVAS_H * 0.38 },
      };
      setLayers(prev => [...prev, { item, ...(pos[item.type] ?? { x: SCREEN_W / 2, y: CANVAS_H / 2 }), scale: 1 }]);
      setSelectedId(item.id);
      incrementWears(item.id);
    }
  };

  const moveLayer   = (id: number, x: number, y: number) =>
    setLayers(prev => prev.map(l => l.item.id === id ? { ...l, x, y } : l));
  const removeLayer = (id: number) => { setLayers(prev => prev.filter(l => l.item.id !== id)); setSelectedId(null); };
  const scaleLayer  = (id: number, delta: number) =>
    setLayers(prev => prev.map(l => l.item.id === id ? { ...l, scale: Math.max(0.4, Math.min(2.5, l.scale + delta)) } : l));

  const handleSave = () => {
    const active: Partial<Record<string, number>> = {};
    layers.forEach(l => { active[l.item.type] = l.item.id; });
    saveOutfit(active.tops, active.bottoms, active.shoes, active.outerwear);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearAll = () => { setLayers([]); setSelectedId(null); setAiResult(null); };
  const selectedLayer = layers.find(l => l.item.id === selectedId);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Virtual Mirror</Text>
          <Text style={styles.subtitle}>{mode === 'ai' ? '✨ AI Try-On Mode' : '👆 Manual Mode'}</Text>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={clearAll}>
          <Text style={styles.resetText}>↺ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]} onPress={() => setMode('ai')}>
          <Text style={[styles.modeBtnText, mode === 'ai' && styles.modeBtnTextActive]}>✨ AI Try-On</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]} onPress={() => setMode('manual')}>
          <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>👆 Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={styles.canvas}>
        {aiResult ? (
          <Image source={{ uri: aiResult }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        ) : bodyPhoto ? (
          <Image source={{ uri: bodyPhoto }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        ) : (
          <View style={styles.bodyCanvasWrap}>
            <BodyCanvas
              topColor={layers.find(l => l.item.type === 'tops')?.item.color ?? '#DEDAD4'}
              bottomColor={layers.find(l => l.item.type === 'bottoms')?.item.color ?? '#C8C3B8'}
              shoeColor={layers.find(l => l.item.type === 'shoes')?.item.color ?? '#B8A888'}
              jacketColor={layers.find(l => l.item.type === 'outerwear')?.item.color ?? null}
            />
          </View>
        )}

        {/* Manual overlay layers */}
        {mode === 'manual' && bodyPhoto && layers.map(layer => (
          <ClothingOverlay
            key={layer.item.id}
            layer={layer}
            isSelected={selectedId === layer.item.id}
            onSelect={() => setSelectedId(layer.item.id)}
            onMove={(x, y) => moveLayer(layer.item.id, x, y)}
            onRemove={() => removeLayer(layer.item.id)}
          />
        ))}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7D9080" />
            <Text style={styles.loadingText}>AI is trying on your outfit…</Text>
            <Text style={styles.loadingSubtext}>This may take 10–20 seconds</Text>
          </View>
        )}

        {/* No photo prompt */}
        {!bodyPhoto && (
          <View style={styles.photoPrompt}>
            <Text style={styles.photoPromptIcon}>📷</Text>
            <Text style={styles.photoPromptText}>Add your full body photo{'\n'}to try on clothes</Text>
            <View style={styles.photoPromptBtns}>
              <TouchableOpacity style={styles.photoBtn} onPress={takeBodyPhoto}>
                <Text style={styles.photoBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoBtn, styles.photoBtnSecondary]} onPress={pickBodyPhoto}>
                <Text style={[styles.photoBtnText, { color: '#7D9080' }]}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* AI hint */}
        {mode === 'ai' && bodyPhoto && !loading && !aiResult && (
          <View style={styles.aiHint}>
            <Text style={styles.aiHintText}>Tap a clothing item below to AI try-on</Text>
          </View>
        )}

        {/* Scale controls */}
        {mode === 'manual' && selectedLayer && bodyPhoto && (
          <View style={styles.scaleControls}>
            <TouchableOpacity style={styles.scaleBtn} onPress={() => scaleLayer(selectedLayer.item.id, -0.1)}>
              <Text style={styles.scaleBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.scaleBtnLabel}>{selectedLayer.item.name}</Text>
            <TouchableOpacity style={styles.scaleBtn} onPress={() => scaleLayer(selectedLayer.item.id, 0.1)}>
              <Text style={styles.scaleBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top-right actions */}
        {bodyPhoto && (
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.miniBtn} onPress={pickBodyPhoto}>
              <Text style={styles.miniBtnText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniBtn, saved && styles.miniBtnSaved]} onPress={handleSave}>
              <Text style={styles.miniBtnText}>{saved ? '✓' : '⊙'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pills */}
        {layers.length > 0 && mode === 'manual' && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{layers.length} item{layers.length > 1 ? 's' : ''} on</Text>
          </View>
        )}
        {aiResult && (
          <View style={[styles.activePill, { backgroundColor: '#5A7A8A' }]}>
            <Text style={styles.activePillText}>✨ AI Result</Text>
          </View>
        )}
      </View>

      {/* Drawer */}
      <View style={styles.drawer}>
        <View style={styles.dragHandle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll} contentContainerStyle={styles.itemContent}>
          {visibleItems.map(item => {
            const isActive = activeIds.has(item.id);
            const hasPhoto = !!item.photo_uri;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemThumb, isActive && styles.itemThumbActive, mode === 'ai' && !hasPhoto && styles.itemThumbDim]}
                onPress={() => handleItemTap(item)}
                activeOpacity={0.7}
              >
                {item.photo_uri ? (
                  <Image source={{ uri: item.photo_uri }} style={styles.itemThumbPhoto} resizeMode="cover" />
                ) : (
                  <SilIcon item={item} size={38} />
                )}
                {mode === 'ai' && !hasPhoto && (
                  <View style={styles.noPhotoOverlay}>
                    <Text style={styles.noPhotoText}>No photo</Text>
                  </View>
                )}
                {isActive && mode === 'manual' && (
                  <View style={styles.checkDot}><Text style={styles.checkText}>✓</Text></View>
                )}
                <Text style={styles.itemThumbName} numberOfLines={2}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#F9F9F6' },
  header:            { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  title:             { fontSize: 22, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle:          { fontSize: 10, color: '#7D9080', fontWeight: '600', marginTop: 2 },
  resetBtn:          { borderWidth: 1, borderColor: '#EAEAEA', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  resetText:         { fontSize: 11, color: '#888', fontWeight: '600' },
  modeRow:           { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, backgroundColor: '#F0EDE8', borderRadius: 14, padding: 3, gap: 3 },
  modeBtn:           { flex: 1, paddingVertical: 7, borderRadius: 11, alignItems: 'center' },
  modeBtnActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  modeBtnText:       { fontSize: 12, fontWeight: '600', color: '#888' },
  modeBtnTextActive: { color: '#1A1A1A' },
  canvas:            { height: CANVAS_H, marginHorizontal: 16, borderRadius: 20, backgroundColor: '#F0EDE8', overflow: 'hidden', position: 'relative' },
  bodyCanvasWrap:    { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  loadingOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(249,249,246,0.92)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:       { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  loadingSubtext:    { fontSize: 12, color: '#888' },
  photoPrompt:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 10 },
  photoPromptIcon:   { fontSize: 36 },
  photoPromptText:   { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  photoPromptBtns:   { flexDirection: 'row', gap: 10, marginTop: 6 },
  photoBtn:          { backgroundColor: '#7D9080', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  photoBtnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAEAEA' },
  photoBtnText:      { fontSize: 13, fontWeight: '600', color: '#fff' },
  aiHint:            { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: 'rgba(125,144,128,0.9)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  aiHintText:        { color: '#fff', fontSize: 12, fontWeight: '600' },
  overlayItem:       { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  overlayItemSelected: { borderWidth: 2, borderColor: '#7D9080', borderRadius: 10, borderStyle: 'dashed' },
  removeBtn:         { position: 'absolute', top: -10, right: -10, width: 22, height: 22, backgroundColor: '#E55', borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  removeBtnText:     { color: '#fff', fontSize: 11, fontWeight: '800' },
  scaleControls:     { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  scaleBtn:          { width: 32, height: 32, backgroundColor: '#7D9080', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scaleBtnText:      { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  scaleBtnLabel:     { fontSize: 12, fontWeight: '600', color: '#1A1A1A', flex: 1, textAlign: 'center' },
  topActions:        { position: 'absolute', top: 12, right: 12, gap: 8 },
  miniBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  miniBtnSaved:      { backgroundColor: '#7D9080' },
  miniBtnText:       { fontSize: 15 },
  activePill:        { position: 'absolute', top: 12, left: 12, backgroundColor: '#7D9080', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  activePillText:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  drawer:            { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, paddingBottom: 4, marginTop: 8 },
  dragHandle:        { width: 32, height: 4, backgroundColor: '#E0DDD8', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  filterScroll:      { flexGrow: 0 },
  filterContent:     { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterPill:        { paddingHorizontal: 12, height: 24, borderRadius: 100, backgroundColor: '#F4F4F1', justifyContent: 'center' },
  filterPillActive:  { backgroundColor: '#7D9080' },
  filterPillText:    { fontSize: 10, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  filterPillTextActive: { color: '#fff' },
  itemScroll:        { flexGrow: 0 },
  itemContent:       { paddingHorizontal: 16, gap: 10, paddingVertical: 4 },
  itemThumb:         { width: 72, alignItems: 'center', backgroundColor: '#F4F4F1', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 4, position: 'relative' },
  itemThumbActive:   { backgroundColor: '#E2E8E4', borderWidth: 2, borderColor: '#7D9080' },
  itemThumbDim:      { opacity: 0.5 },
  itemThumbPhoto:    { width: 56, height: 56, borderRadius: 8 },
  itemThumbName:     { fontSize: 9, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginTop: 4 },
  noPhotoOverlay:    { position: 'absolute', top: 6, left: 4, right: 4, bottom: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  noPhotoText:       { color: '#fff', fontSize: 8, fontWeight: '700' },
  checkDot:          { position: 'absolute', top: -4, right: -4, width: 16, height: 16, backgroundColor: '#7D9080', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkText:         { color: '#fff', fontSize: 9, fontWeight: '800' },
});