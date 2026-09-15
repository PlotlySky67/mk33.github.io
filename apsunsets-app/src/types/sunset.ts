export interface SunsetLocation {
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface Sunset {
  id: string;
  photoUri: string;
  capturedAt: string;
  location: SunsetLocation | null;
}
