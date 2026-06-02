import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WardrobeItem, SuggestedOutfit } from '../types';
import { generateOutfitSuggestions } from '../utils/outfitSuggestion';

interface OutfitsScreenProps {
  items: WardrobeItem[];
}

export default function OutfitsScreen({ items }: OutfitsScreenProps) {
  const [outfits, setOutfits] = useState<SuggestedOutfit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateOutfits();
  }, [items]);

  const generateOutfits = useCallback(() => {
    if (items.length < 3) {
      Alert.alert(
        'Not Enough Items',
        'Please add at least 3 items to your wardrobe to generate outfit suggestions.',
      );
      return;
    }

    setLoading(true);
    try {
      const suggestions = generateOutfitSuggestions(items, 8);
      setOutfits(suggestions);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate outfits');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [items]);

  const renderItem = (item: WardrobeItem | null, label: string) => {
    if (!item) return null;
    return (
      <View style={s.itemBox}>
        {item.photo_uri && (
          <Image
            source={{ uri: item.photo_uri }}
            style={s.itemImage}
            resizeMode="cover"
          />
        )}
        <Text style={s.itemLabel}>{label}</Text>
        <Text style={s.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <View
          style={[s.colorIndicator, { backgroundColor: item.color }]}
        />
      </View>
    );
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>Outfit Suggestions</Text>
        <Text style={s.subtitle}>
          {items.length < 3
            ? 'Add more items to generate outfits'
            : `${outfits.length} combinations from ${items.length} items`}
        </Text>
      </View>

      {loading && (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color="#2a3a50" />
          <Text style={s.loadingText}>Generating outfits...</Text>
        </View>
      )}

      {!loading && outfits.length === 0 && items.length >= 3 && (
        <View style={s.centerContainer}>
          <Text style={s.emptyText}>No outfits generated yet</Text>
          <TouchableOpacity
            style={s.generateButton}
            onPress={generateOutfits}
          >
            <Text style={s.generateButtonText}>✨ Generate Outfits</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && items.length < 3 && (
        <View style={s.centerContainer}>
          <Text style={s.emptyText}>
            Add at least 3 items to your wardrobe first
          </Text>
        </View>
      )}

      {/* Outfits Grid */}
      {outfits.map((outfit, index) => (
        <View key={outfit.id} style={s.outfitCard}>
          <View style={s.outfitHeader}>
            <Text style={s.outfitNumber}>Look {index + 1}</Text>
            <View style={s.scoreContainer}>
              <Text style={s.scoreLabel}>Style Score</Text>
              <Text style={s.scoreValue}>
                {Math.round(outfit.score * 100)}%
              </Text>
            </View>
          </View>

          <View style={s.itemsGrid}>
            {renderItem(outfit.tops, '👕 Top')}
            {renderItem(outfit.bottoms, '👖 Bottom')}
            {renderItem(outfit.shoes, '👟 Shoes')}
            {outfit.outerwear && renderItem(outfit.outerwear, '🧥 Outerwear')}
          </View>

          <View style={s.outfitFooter}>
            <Text style={s.styleTag}>{outfit.style}</Text>
            <TouchableOpacity
              style={s.wearButton}
              onPress={() => Alert.alert('', 'Outfit saved! (coming soon)')}
            >
              <Text style={s.wearButtonText}>💾 Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {outfits.length > 0 && (
        <TouchableOpacity
          style={s.regenerateButton}
          onPress={generateOutfits}
          disabled={loading}
        >
          <Text style={s.regenerateButtonText}>🔄 Refresh Suggestions</Text>
        </TouchableOpacity>
      )}

      <View style={s.spacer} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F6',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 16,
    backgroundColor: '#2a8a3a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  outfitCard: {
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  outfitNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#999',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2a8a3a',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  itemBox: {
    width: '48%',
    backgroundColor: '#f9f9f6',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  itemImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#e8e8e8',
  },
  itemLabel: {
    fontSize: 10,
    color: '#999',
    paddingHorizontal: 8,
    paddingTop: 6,
    fontWeight: '500',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  colorIndicator: {
    height: 8,
    marginTop: 4,
  },
  outfitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  styleTag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  wearButton: {
    backgroundColor: '#2a3a50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  wearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  regenerateButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#2a3a50',
    borderRadius: 8,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
