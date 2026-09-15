import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { Sunset, SunsetLocation } from '../types/sunset';

const STORAGE_KEY = 'apsunsets:entries';
const SUNSETS_DIR_NAME = 'sunsets';

function getSunsetsDirectory(): Directory {
  const dir = new Directory(Paths.document, SUNSETS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

function sortByNewest(sunsets: Sunset[]): Sunset[] {
  return [...sunsets].sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
}

async function persist(sunsets: Sunset[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sunsets));
}

export async function getAllSunsets(): Promise<Sunset[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: Sunset[] = JSON.parse(raw);
    return sortByNewest(parsed);
  } catch {
    return [];
  }
}

export async function getSunsetById(id: string): Promise<Sunset | undefined> {
  const all = await getAllSunsets();
  return all.find((s) => s.id === id);
}

export async function saveSunset(input: {
  pickedUri: string;
  location: SunsetLocation | null;
}): Promise<Sunset> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const extensionMatch = input.pickedUri.match(/\.(\w+)(\?.*)?$/);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';

  const dir = getSunsetsDirectory();
  const destFile = new File(dir, `${id}.${extension}`);
  const sourceFile = new File(input.pickedUri);
  await sourceFile.copy(destFile);

  const sunset: Sunset = {
    id,
    photoUri: destFile.uri,
    capturedAt: new Date().toISOString(),
    location: input.location,
  };

  const existing = await getAllSunsets();
  await persist([sunset, ...existing]);
  return sunset;
}

export async function deleteSunset(id: string): Promise<void> {
  const existing = await getAllSunsets();
  const target = existing.find((s) => s.id === id);
  await persist(existing.filter((s) => s.id !== id));

  if (target) {
    try {
      const file = new File(target.photoUri);
      if (file.exists) file.delete();
    } catch {
      // Best-effort cleanup; the entry is already gone from the index.
    }
  }
}

export function placeLabel(location: SunsetLocation | null): string {
  if (!location) return 'Unknown sky';
  if (location.city && location.country) return `${location.city}, ${location.country}`;
  return location.city ?? location.country ?? 'Unknown sky';
}
