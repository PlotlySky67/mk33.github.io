import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';

import { db } from './config';
import { uploadImageToCloudinary } from '../cloudinary/upload';
import { Sunset, SunsetLocation } from '../types/sunset';

const MAX_IN_CLAUSE = 30;

export async function uploadSunset(input: {
  uid: string;
  ownerName: string;
  pickedUri: string;
  location: SunsetLocation | null;
}): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const photoUrl = await uploadImageToCloudinary(input.pickedUri);

  const sunset: Sunset = {
    id,
    ownerId: input.uid,
    ownerName: input.ownerName,
    photoUrl,
    capturedAt: new Date().toISOString(),
    location: input.location,
  };

  await setDoc(doc(db, 'sunsets', id), sunset);
}

export function subscribeToFeed(
  ownerIds: string[],
  callback: (sunsets: Sunset[]) => void,
  onError?: (error: Error) => void
) {
  const ids = ownerIds.slice(0, MAX_IN_CLAUSE);
  if (ids.length === 0) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, 'sunsets'), where('ownerId', 'in', ids), orderBy('capturedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => d.data() as Sunset)),
    (error) => onError?.(error)
  );
}

export function subscribeToOwnSunsets(uid: string, callback: (sunsets: Sunset[]) => void) {
  const q = query(collection(db, 'sunsets'), where('ownerId', '==', uid), orderBy('capturedAt', 'desc'));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((d) => d.data() as Sunset)));
}

export async function deleteSunset(sunset: Sunset): Promise<void> {
  // The Firestore doc is the source of truth for the feed; the image stays
  // on Cloudinary's free tier (deleting it needs a signed request, which
  // requires a server — out of scope for this on-device-only MVP).
  await deleteDoc(doc(db, 'sunsets', sunset.id));
}

export function placeLabel(location: SunsetLocation | null): string {
  if (!location) return 'Unknown sky';
  if (location.city && location.country) return `${location.city}, ${location.country}`;
  return location.city ?? location.country ?? 'Unknown sky';
}
