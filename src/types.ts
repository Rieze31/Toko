export type ItemType = 'tops' | 'bottoms' | 'outerwear' | 'shoes';
export type Silhouette = 'shirt' | 'trouser' | 'sneaker' | 'jacket';

export interface WardrobeItem {
  id: number;
  name: string;
  wears: number;
  tag: string;
  type: ItemType;
  silhouette: Silhouette;
  color: string;
  photo_uri?: string | null;
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

export type Tab = 'mirror' | 'wardrobe' | 'analytics' | 'settings';