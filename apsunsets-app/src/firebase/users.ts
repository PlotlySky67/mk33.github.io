import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from './config';
import { UserProfile } from '../types/sunset';

export async function createUserProfile(uid: string, displayName: string, email: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    uid,
    displayName,
    displayNameLower: displayName.toLowerCase(),
    email,
    createdAt: new Date().toISOString(),
  });
}

export async function searchUsersByName(queryText: string, excludeUid: string): Promise<UserProfile[]> {
  const trimmed = queryText.trim().toLowerCase();
  if (!trimmed) return [];

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    orderBy('displayNameLower'),
    where('displayNameLower', '>=', trimmed),
    where('displayNameLower', '<=', trimmed + ''),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data() as UserProfile)
    .filter((u) => u.uid !== excludeUid);
}

export function subscribeToFollowing(
  uid: string,
  callback: (following: { uid: string; displayName: string }[]) => void
) {
  const ref = collection(db, 'users', uid, 'following');
  return onSnapshot(ref, (snapshot) => {
    callback(
      snapshot.docs.map((d) => ({
        uid: d.id,
        displayName: (d.data().displayName as string) ?? 'Unknown',
      }))
    );
  });
}

export async function followUser(
  currentUid: string,
  currentDisplayName: string,
  target: { uid: string; displayName: string }
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', currentUid, 'following', target.uid), {
    displayName: target.displayName,
    followedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', target.uid, 'followers', currentUid), {
    displayName: currentDisplayName,
    followedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', currentUid, 'following', targetUid));
  batch.delete(doc(db, 'users', targetUid, 'followers', currentUid));
  await batch.commit();
}
