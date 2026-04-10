/**
 * Discriminated union types for Day Entry metadata.
 * Each entry type has its own strongly-typed metadata shape.
 */

// --- Metadata per tipo ---

export type DayEntryType = 'text' | 'media' | 'tip' | 'location' | 'mood' | 'photo' | 'video';

export interface TextMetadata {
  html?: string;
}

export interface TipMetadata {
  category: 'restaurant' | 'hotel' | 'activity' | 'general';
  priceLevel?: 1 | 2 | 3 | 4; // € - €€€€
}

export interface PhotoMetadata {
  width: number;
  height: number;
  caption?: string;
  storagePath: string; 
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration?: number;
  caption?: string;
  storagePath: string; 
  thumbnailStoragePath: string; // To resolve a signed URL for the thumbnail
  thumbnailUrl?: string; // Injected on-the-fly for rendering
}

export interface MoodMetadata {
  label: string; // e.g. "Felice", "Stanco"
}

export interface LocationMetadata {
  place_name: string;
  place_id?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
}

// --- Entry types ---

export interface EntryAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface BaseDayEntry {
  id: string;
  day_id?: string;
  sort_order: number;
  content: string | null;
  author_id?: string | null;
  author?: EntryAuthor | null;
}

export interface TextDayEntry extends BaseDayEntry {
  type: 'text';
  metadata: TextMetadata | null;
}

export interface TipDayEntry extends BaseDayEntry {
  type: 'tip';
  metadata: TipMetadata;
}

export interface PhotoDayEntry extends BaseDayEntry {
  type: 'photo';
  metadata: PhotoMetadata;
}

export interface VideoDayEntry extends BaseDayEntry {
  type: 'video';
  metadata: VideoMetadata;
}

export interface MoodDayEntry extends BaseDayEntry {
  type: 'mood';
  metadata: MoodMetadata;
}

export interface LocationDayEntry extends BaseDayEntry {
  type: 'location';
  metadata: LocationMetadata;
}

export type DayEntry = 
  | TextDayEntry 
  | TipDayEntry 
  | PhotoDayEntry 
  | VideoDayEntry
  | MoodDayEntry 
  | LocationDayEntry;

// --- Day info ---

export interface DayInfo {
  id: string;
  day_number: number;
  title: string | null;
  date: string | null;
}

// --- Moods ---

export interface MoodOption {
  emoji: string;
  label: string;
}

export const MOODS: MoodOption[] = [
  { emoji: '😍', label: 'Fantastico' },
  { emoji: '😊', label: 'Felice' },
  { emoji: '😌', label: 'Rilassato' },
  { emoji: '🤩', label: 'Entusiasta' },
  { emoji: '😋', label: 'Goloso' },
  { emoji: '🥱', label: 'Stanco' },
  { emoji: '😤', label: 'Frustrato' },
  { emoji: '🥶', label: 'Congelato' },
  { emoji: '🥵', label: 'Sudato' },
  { emoji: '🤢', label: 'Malato' },
];
