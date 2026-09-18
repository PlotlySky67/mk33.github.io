export interface SunsetLocation {
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface Sunset {
  id: string;
  ownerId: string;
  ownerName: string;
  photoUrl: string;
  capturedAt: string;
  location: SunsetLocation | null;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  displayNameLower: string;
  email: string;
  createdAt: string;
}
