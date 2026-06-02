export type ItemType = 'tops' | 'bottoms' | 'outerwear' | 'shoes';
export type Silhouette = 'shirt' | 'trouser' | 'sneaker' | 'jacket';
export type StyleTag = 'Smart Casual' | 'Everyday' | 'Layering' | 'Versatile' | 'Casual' | 'Formal' | 'Weekend';

export interface WardrobeItem {
  id: number;
  name: string;
  wears: number;
  tag: string;
  type: ItemType;
  silhouette: Silhouette;
  color: string;
  photo_uri?: string | null;
  dominant_color?: string;
  extracted_at?: number;
}

export type ActiveItems = {
  tops: WardrobeItem | null;
  bottoms: WardrobeItem | null;
  shoes: WardrobeItem | null;
  outerwear: WardrobeItem | null;
};

// Overlay layer with position/scale for drag & pinch
export type OverlayLayer = {
  item: WardrobeItem;
  x: number;
  y: number;
  scale: number;
};

export type Tab = 'mirror' | 'wardrobe' | 'analytics' | 'settings' | 'outfits';

// AI-Generated Outfit
export interface SuggestedOutfit {
  id: string;
  tops: WardrobeItem | null;
  bottoms: WardrobeItem | null;
  shoes: WardrobeItem | null;
  outerwear: WardrobeItem | null;
  style: string;
  createdAt: number;
  score: number;
}

// Image Processing Result
export interface ProcessedImage {
  originalUri: string;
  processedUri: string;
  outlineOverlay: string;
  hasOutline: boolean;
  dominantColor: string;
  confidence: number;
}