import { WardrobeItem, SuggestedOutfit } from '../types';

/**
 * Color compatibility - returns compatibility score (0-1)
 */
function colorCompatibility(color1: string, color2: string): number {
  // Extract RGB values (hex format)
  const toRGB = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [128, 128, 128];
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  };

  const rgb1 = toRGB(color1);
  const rgb2 = toRGB(color2);

  // Calculate color distance (simple Euclidean distance)
  const distance = Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );

  // Normalize to 0-1 (0 = identical, 1 = completely different)
  const maxDistance = Math.sqrt(3 * Math.pow(255, 2)); // ~441
  const normalizedDistance = distance / maxDistance;

  // Return compatibility (closer = higher score)
  // Complementary colors around 0.3-0.5 distance are good
  if (normalizedDistance < 0.15) return 0.6; // Too similar
  if (normalizedDistance < 0.4) return 1.0; // Great
  if (normalizedDistance < 0.7) return 0.8; // Good
  return 0.5; // Different
}

/**
 * Generate outfit combinations
 */
export function generateOutfitSuggestions(
  items: WardrobeItem[],
  count: number = 8
): SuggestedOutfit[] {
  const suggestions: SuggestedOutfit[] = [];

  const tops = items.filter(i => i.type === 'tops');
  const bottoms = items.filter(i => i.type === 'bottoms');
  const shoes = items.filter(i => i.type === 'shoes');
  const outerwear = items.filter(i => i.type === 'outerwear');

  if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
    return []; // Need at least these items
  }

  // Generate combinations
  const maxAttempts = count * 5;
  let attempts = 0;

  while (suggestions.length < count && attempts < maxAttempts) {
    attempts++;

    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const shoe = shoes[Math.floor(Math.random() * shoes.length)];
    const outer = outerwear.length > 0 && Math.random() > 0.5 
      ? outerwear[Math.floor(Math.random() * outerwear.length)]
      : null;

    // Calculate compatibility score
    let score = 0.5; // Base score

    // Color compatibility
    const topBottomCompat = colorCompatibility(top.color, bottom.color);
    const bottomShoeCompat = colorCompatibility(bottom.color, shoe.color);
    const topShoeCompat = colorCompatibility(top.color, shoe.color);

    score += topBottomCompat * 0.2;
    score += bottomShoeCompat * 0.2;
    score += topShoeCompat * 0.15;

    if (outer) {
      const outerTopCompat = colorCompatibility(outer.color, top.color);
      score += outerTopCompat * 0.15;
    }

    // Style compatibility
    const styles = [top.tag, bottom.tag, shoe.tag, outer?.tag].filter(Boolean);
    const styleMatch = styles.filter(s => s === top.tag).length > 2;
    if (styleMatch) score += 0.1;

    // Avoid duplicates
    const isDuplicate = suggestions.some(
      s => s.tops?.id === top.id &&
           s.bottoms?.id === bottom.id &&
           s.shoes?.id === shoe.id &&
           s.outerwear?.id === outer?.id
    );

    if (!isDuplicate && score > 0.3) {
      suggestions.push({
        id: `outfit_${Date.now()}_${Math.random()}`,
        tops: top,
        bottoms: bottom,
        shoes: shoe,
        outerwear: outer,
        style: outer ? 'Layered' : 'Standard',
        createdAt: Date.now(),
        score: Math.min(1, score),
      });
    }
  }

  // Sort by score (highest first)
  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Get outfit style recommendation based on items
 */
export function getOutfitStyle(outfit: Partial<SuggestedOutfit>): string {
  const items = [outfit.tops, outfit.bottoms, outfit.shoes, outfit.outerwear].filter(Boolean);
  
  if (!items.length) return 'Casual';

  const styles = items.map(i => i?.tag).filter(Boolean);
  
  if (styles.includes('Formal')) return 'Formal';
  if (styles.includes('Smart Casual')) return 'Smart Casual';
  if (styles.includes('Weekend')) return 'Weekend';
  if (styles.includes('Everyday')) return 'Everyday';
  
  return 'Casual';
}
