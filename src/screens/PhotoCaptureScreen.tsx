import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { extractDominantColor, loadImageAsBase64, saveBase64Image } from '../utils/imageProcessing';
import { addItem } from '../database/db';
import { ItemType, Silhouette } from '../types';

interface PhotoCaptureScreenProps {
  onItemAdded?: () => void;
  onClose?: () => void;
}

export default function PhotoCaptureScreen({ onItemAdded, onClose }: PhotoCaptureScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<ItemType>('tops');
  const [itemTag, setItemTag] = useState('Casual');
  const [itemColor, setItemColor] = useState('');

  const silhouetteMap: Record<ItemType, Silhouette> = {
    tops: 'shirt',
    bottoms: 'trouser',
    outerwear: 'jacket',
    shoes: 'sneaker',
  };

  const types: ItemType[] = ['tops', 'bottoms', 'outerwear', 'shoes'];
  const tags = ['Casual', 'Smart Casual', 'Formal', 'Everyday', 'Weekend', 'Layering'];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1.5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        
        // Extract dominant color
        const dominantColor = await extractDominantColor(uri);
        setItemColor(dominantColor);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const capturePhoto = async () => {
    if (!selectedImage || !itemName.trim()) {
      Alert.alert('Missing Info', 'Please select image and enter item name');
      return;
    }

    setLoading(true);
    try {
      // Load image as base64
      const base64 = await loadImageAsBase64(selectedImage);
      
      // Save image to file system
      const fileName = `item_${Date.now()}`;
      const photoUri = await saveBase64Image(base64, fileName);

      // Add to database
      addItem({
        name: itemName,
        wears: 0,
        tag: itemTag,
        type: itemType,
        silhouette: silhouetteMap[itemType],
        color: itemColor,
        photo_uri: photoUri,
      });

      Alert.alert('Success', 'Item added to wardrobe!');
      
      // Reset form
      setSelectedImage(null);
      setItemName('');
      setItemType('tops');
      setItemTag('Casual');
      setItemColor('');
      setShowPreview(false);

      onItemAdded?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Add Item to Wardrobe</Text>

      {/* Image Preview */}
      {selectedImage && (
        <TouchableOpacity 
          style={s.imageContainer}
          onPress={() => setShowPreview(true)}
        >
          <Image source={{ uri: selectedImage }} style={s.image} />
          <Text style={s.tapToPreview}>Tap to preview</Text>
        </TouchableOpacity>
      )}

      {/* Pick Image Button */}
      <TouchableOpacity
        style={[s.button, s.primaryButton]}
        onPress={pickImage}
        disabled={loading}
      >
        <Text style={s.buttonText}>
          {selectedImage ? '📷 Change Photo' : '📷 Pick Photo'}
        </Text>
      </TouchableOpacity>

      {selectedImage && (
        <>
          {/* Item Name */}
          <Text style={s.label}>Item Name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Black Blazer"
            value={itemName}
            onChangeText={setItemName}
            placeholderTextColor="#999"
          />

          {/* Item Type */}
          <Text style={s.label}>Type</Text>
          <View style={s.typeRow}>
            {types.map(type => (
              <TouchableOpacity
                key={type}
                style={[s.typeButton, itemType === type && s.typeButtonActive]}
                onPress={() => setItemType(type)}
              >
                <Text style={[s.typeButtonText, itemType === type && s.typeButtonTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tag */}
          <Text style={s.label}>Style Tag</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={s.tagsScroll}
          >
            {tags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[s.tagButton, itemTag === tag && s.tagButtonActive]}
                onPress={() => setItemTag(tag)}
              >
                <Text style={[s.tagButtonText, itemTag === tag && s.tagButtonTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Color Display */}
          <Text style={s.label}>Color (Auto-detected)</Text>
          <View style={s.colorRow}>
            <View 
              style={[s.colorSwatch, { backgroundColor: itemColor }]} 
            />
            <Text style={s.colorCode}>{itemColor}</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[s.button, s.saveButton, loading && s.buttonDisabled]}
            onPress={capturePhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>✓ Save Item</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={s.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={s.cancelButtonText}>← Cancel</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Full Image Preview Modal */}
      <Modal
        visible={showPreview}
        transparent
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={s.previewModal}>
          <TouchableOpacity
            style={s.previewClose}
            onPress={() => setShowPreview(false)}
          >
            <Text style={s.previewCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={s.fullPreviewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9F9F6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: 300,
  },
  tapToPreview: {
    padding: 8,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    backgroundColor: '#f5f5f5',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2a3a50',
  },
  saveButton: {
    backgroundColor: '#2a8a3a',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#2a3a50',
    borderColor: '#2a3a50',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  tagsScroll: {
    marginBottom: 12,
  },
  tagButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  tagButtonActive: {
    backgroundColor: '#2a8a3a',
    borderColor: '#2a8a3a',
  },
  tagButtonText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
  },
  tagButtonTextActive: {
    color: '#fff',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  previewCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullPreviewImage: {
    width: '90%',
    height: '90%',
  },
});
