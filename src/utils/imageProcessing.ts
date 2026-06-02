import * as FileSystem from 'expo-file-system';

/**
 * Extract dominant color from image - placeholder for ML enhancement
 */
export async function extractDominantColor(imageUri: string): Promise<string> {
  try {
    const colors = [
      '#E8E8E8', '#2A2A2A', '#1A1A1A', '#F0F0F0', '#3B5E8C', '#2A3A50',
      '#6A7060', '#B8A882', '#7A4A2A', '#D8D4CC', '#5A5A5A', '#C0C0C0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  } catch (error) {
    console.error('Error extracting dominant color:', error);
    return '#808080';
  }
}

/**
 * Save base64 image to file system
 */
export async function saveBase64Image(base64: string, fileName: string): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}wardrobe_items`;
    
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

    const filePath = `${dir}/${fileName}.jpg`;
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

/**
 * Load image as base64 from URI
 */
export async function loadImageAsBase64(uri: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
}

/**
 * Delete stored image
 */
export async function deleteStoredImage(filePath: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}
