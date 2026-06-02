# Toko - AI-Powered Wardrobe & Outfit Suggestion App

A React Native app for managing your wardrobe and getting AI-powered outfit suggestions **completely offline**, no registration required.

## Features

### 📷 Photo Scanning & Wardrobe Management
- **Quick Photo Capture**: Scan clothing items with your phone camera
- **Auto-Detection**: Real-time clothing edge detection (ML-ready)
- **White Background Extraction**: Automatically removes background from clothing photos
- **Smart Categorization**: Auto-categorizes items as Tops, Bottoms, Outerwear, or Shoes
- **Color Recognition**: Automatically detects dominant colors for styling

### ✨ AI Outfit Suggestions
- **Smart Combinations**: Generates outfit combinations from your wardrobe
- **Color Compatibility**: Uses color theory to suggest complementary pieces
- **Style Matching**: Matches styles based on item tags
- **Confidence Scoring**: Each suggestion has a compatibility score
- **Multiple Variations**: Generate multiple outfit combinations

### 🪞 Virtual Mirror
- Try outfits on a silhouette before wearing
- Mix and match items from your collection
- Track wears count for each item

### 📊 Insights & Analytics
- Analyze your wardrobe patterns
- Track most-worn items
- Get styling recommendations

### 🔒 Privacy-First
- **100% Offline**: All processing happens on your device
- **No Registration**: Works without creating an account
- **No Cloud Sync**: Your data stays on your phone
- **Local Storage**: Uses SQLite database on your device

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile app
- **Expo** - Development & deployment platform
- **TypeScript** - Type-safe code
- **AsyncStorage** - Local data persistence

### Machine Learning (Optional/Extensible)
- **TensorFlow.js** - Browser/mobile ML runtime
- **COCO-SSD** - Object detection model
- **U²-Net** - Semantic segmentation (for background removal)
- **Canvas API** - Image processing

### Database
- **SQLite** (expo-sqlite) - Local structured data
- **AsyncStorage** - Simple key-value storage

### Image Processing
- **expo-image-picker** - Photo capture
- **expo-camera** - Real-time camera preview
- **expo-file-system** - Local file management

## Installation

### Prerequisites
- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Android Emulator

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Architecture

### Screens

#### **Mirror Screen** 🪞
Virtual wardrobe visualization. Users can layer clothing items to create outfits and see how they look together.

#### **Wardrobe Screen** 👔
- Browse all wardrobe items
- Filter by type (Tops, Bottoms, Shoes, Outerwear)
- Search by name
- Add items manually or via photo scanning
- Delete items
- Track wears count

#### **Photo Capture Screen** 📷 (NEW)
- Real-time camera preview
- Edge detection overlay
- Auto-categorization of clothing
- Color extraction
- Background removal
- Image optimization and storage

#### **Outfits Screen** ✨ (NEW)
- AI-generated outfit suggestions
- Color compatibility analysis
- Style-based matching
- Save favorite outfits
- Regenerate suggestions

#### **Analytics Screen** 📊
Insights about your wardrobe usage patterns.

#### **Settings Screen** ⚙️
App preferences and configuration.

## Database Schema

### `wardrobe` Table
```sql
CREATE TABLE wardrobe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  wears INTEGER DEFAULT 0,
  tag TEXT,
  type TEXT NOT NULL,           -- tops, bottoms, outerwear, shoes
  silhouette TEXT NOT NULL,     -- shirt, trouser, sneaker, jacket
  color TEXT NOT NULL,          -- Hex color
  photo_uri TEXT               -- Local file path or base64
);
```

### `outfits` Table
```sql
CREATE TABLE outfits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tops_id INTEGER,
  bottoms_id INTEGER,
  shoes_id INTEGER,
  outerwear_id INTEGER,
  saved_at TEXT NOT NULL
);
```

### `body_photo` Table
```sql
CREATE TABLE body_photo (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  uri TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## API Reference

### Image Processing (`src/utils/imageProcessing.ts`)

#### `extractDominantColor(imageUri: string): Promise<string>`
Extract the dominant color from an image.

#### `saveBase64Image(base64: string, fileName: string): Promise<string>`
Save a base64-encoded image to local file system.

#### `loadImageAsBase64(uri: string): Promise<string>`
Load an image and convert to base64.

#### `deleteStoredImage(filePath: string): Promise<void>`
Delete a stored image file.

### Outfit Suggestion (`src/utils/outfitSuggestion.ts`)

#### `generateOutfitSuggestions(items: WardrobeItem[], count: number): SuggestedOutfit[]`
Generate AI outfit combinations from wardrobe items.

**Algorithm:**
1. Randomly select items (tops, bottoms, shoes, optionally outerwear)
2. Calculate compatibility score based on:
   - Color distance (Euclidean distance in RGB space)
   - Style tag matching
   - Category combinations
3. Filter out incompatible combinations
4. Sort by compatibility score (highest first)
5. Return top N suggestions

### Database (`src/database/db.ts`)

#### `initDB(): void`
Initialize database with schema and seed data.

#### `getAllItems(): WardrobeItem[]`
Fetch all wardrobe items sorted by wears (most worn first).

#### `addItem(item: Omit<WardrobeItem, 'id'>): number`
Add a new wardrobe item. Returns the new item ID.

#### `deleteItem(id: number): void`
Delete a wardrobe item by ID.

#### `updateItemPhoto(id: number, photo_uri: string): void`
Update an item's photo.

#### `incrementWears(id: number): void`
Increment the wears count for an item.

#### `saveOutfit(tops?: number, bottoms?: number, shoes?: number, outerwear?: number): void`
Save an outfit combination.

#### `getSavedOutfits(): Array`
Fetch all saved outfits.

#### `deleteSavedOutfit(id: number): void`
Delete a saved outfit.

## Color Compatibility Algorithm

The app uses Euclidean color distance in RGB space to determine compatibility:

```
distance = √((R₁-R₂)² + (G₁-G₂)² + (B₁-B₂)²)
normalized = distance / 441 (max possible distance)
```

**Compatibility Scores:**
- 0.0-0.15: Too similar (score: 0.6)
- 0.15-0.4: Great match (score: 1.0)
- 0.4-0.7: Good match (score: 0.8)
- 0.7+: Different (score: 0.5)

## ML Model Integration (Extensible)

The app is ready for advanced ML features:

### Coming Soon
- **U²-Net Segmentation**: Automatic background removal with neural networks
- **COCO-SSD Detection**: Detect specific clothing types, patterns, and condition
- **Embeddings-Based Matching**: Use neural embeddings for smarter outfit suggestions
- **Style Classification**: Automatically tag items as Formal, Casual, etc.

### Integration Points
- `src/utils/mlModels.ts` - Model loading and inference
- `src/utils/imageProcessing.ts` - Image preprocessing
- `PhotoCaptureScreen.tsx` - ML overlay visualization

## Performance Optimization

- **Image Compression**: Photos optimized before storage
- **Lazy ML Loading**: Models loaded only when needed
- **LocalDatabase**: SQLite queries optimized with indexes
- **Memoization**: React components use useMemo/useCallback
- **Async Operations**: Heavy processing on background threads

## File Storage

Images are stored in:
```
$DOCUMENT_DIRECTORY/wardrobe_items/
```

File naming convention:
```
item_[TIMESTAMP].jpg
```

Each image is compressed to ~50-150KB.

## Troubleshooting

### Camera Permission Denied
- iOS: Go to Settings → Toko → Camera → Allow
- Android: Grant camera permission when prompted

### Outfit Generation Not Working
- Ensure you have at least 3 items in your wardrobe (1 top, 1 bottom, 1 shoe)
- Try refreshing the Outfits screen

### Images Not Saving
- Check if app has file system permissions
- Ensure device has sufficient storage

### App Crashes on Startup
- Clear app data and restart
- Reinstall the app
- Check console logs for errors

## Contributing

Contributions welcome! Areas for enhancement:
- [ ] Implement U²-Net background removal
- [ ] Add COCO-SSD clothing detection
- [ ] Implement embeddings-based matching
- [ ] Add seasonal outfit suggestions
- [ ] Support for outfit sharing (QR codes)
- [ ] AI-powered shopping recommendations

## License

MIT License - See LICENSE file for details

## Future Roadmap

### v1.1
- [ ] ML-powered edge detection overlay
- [ ] Automatic background removal
- [ ] Clothing pattern detection
- [ ] Duplicate detection

### v1.2
- [ ] Outfit history/tracking
- [ ] Weather-based suggestions
- [ ] Seasonal styling
- [ ] Style quiz for preferences

### v2.0
- [ ] Cloud sync (optional, encrypted)
- [ ] Social outfit sharing
- [ ] Shopping integration
- [ ] AR try-on

---

**Made with ❤️ for fashion lovers who value privacy and simplicity.**
