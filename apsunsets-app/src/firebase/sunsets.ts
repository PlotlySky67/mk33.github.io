import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from './config';
import { Sunset, SunsetLocation } from '../types/sunset';

const MAX_IN_CLAUSE = 30;

export async function uploadSunset(input: {
  uid: string;
  ownerName: string;
  pickedUri: string;
  location: SunsetLocation | null;
}): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const extensionMatch = input.pickedUri.match(/\.(\w+)(\?.*)?$/);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';
  const storagePath = `sunsets/${input.uid}/${id}.${extension}`;

  const response = await fetch(input.pickedUri);
  const blob = await response.blob();

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  const photoUrl = await getDownloadURL(storageRef);

  const sunset: Sunset = {
    id,
    ownerId: input.uid,
    ownerName: input.ownerName,
    photoUrl,
    storagePath,
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
  await deleteDoc(doc(db, 'sunsets', sunset.id));
  try {
    await deleteObject(ref(storage, sunset.storagePath));
  } catch {
    // Firestore doc is already gone; a leftover file in Storage isn't fatal.
  }
}

export function placeLabel(location: SunsetLocation | null): string {
  if (!location) return 'Unknown sky';
  if (location.city && location.country) return `${location.city}, ${location.country}`;
  return location.city ?? location.country ?? 'Unknown sky';
}
