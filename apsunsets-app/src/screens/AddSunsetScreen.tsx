import { useState } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing } from '../theme/colors';
import { saveSunset } from '../storage/sunsetStore';
import { SunsetLocation } from '../types/sunset';
import { RootStackParamList, TabParamList } from '../../App';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Add'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function AddSunsetScreen({ navigation }: Props) {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [place, setPlace] = useState('');
  const [country, setCountry] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function detectLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (address) {
        setPlace(address.city ?? address.subregion ?? address.region ?? '');
        setCountry(address.country ?? '');
      }
    } catch {
      // Location is optional — the sunset can still be saved without it.
    } finally {
      setLocating(false);
    }
  }

  async function pickFrom(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `A+ Sunsets needs ${source === 'camera' ? 'camera' : 'photo library'} access to save your sky.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });

    if (result.canceled || result.assets.length === 0) return;

    setPickedUri(result.assets[0].uri);
    detectLocation();
  }

  function reset() {
    setPickedUri(null);
    setPlace('');
    setCountry('');
    setCoords(null);
  }

  async function handleSave() {
    if (!pickedUri) return;
    setSaving(true);
    try {
      const location: SunsetLocation | null = coords
        ? {
            city: place.trim() || null,
            country: country.trim() || null,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }
        : null;

      await saveSunset({ pickedUri, location });
      reset();
      navigation.navigate('Tabs', { screen: 'Feed' });
    } catch (error) {
      Alert.alert('Could not save', 'Something went wrong saving this sunset. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!pickedUri) {
    return (
      <View style={styles.pickContainer}>
        <Text style={styles.pickEmoji}>🌇</Text>
        <Text style={styles.pickTitle}>Caught one?</Text>
        <Text style={styles.pickSubtitle}>Save this sky before it fades.</Text>

        <Pressable style={styles.primaryButton} onPress={() => pickFrom('camera')}>
          <Text style={styles.primaryButtonText}>Take Photo</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => pickFrom('library')}>
          <Text style={styles.secondaryButtonText}>Choose from Library</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.reviewContainer} contentContainerStyle={styles.reviewContent}>
      <Image source={{ uri: pickedUri }} style={styles.preview} contentFit="cover" />

      <View style={styles.field}>
        <Text style={styles.label}>📍 Where were you?</Text>
        {locating ? (
          <View style={styles.locatingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.locatingText}>Finding your sky…</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor={colors.textFaint}
              value={place}
              onChangeText={setPlace}
            />
            <TextInput
              style={styles.input}
              placeholder="Country"
              placeholderTextColor={colors.textFaint}
              value={country}
              onChangeText={setCountry}
            />
            {!coords && (
              <Pressable onPress={detectLocation}>
                <Text style={styles.retryLocation}>Try detecting location again</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <Pressable style={styles.primaryButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryButtonText}>Save to my sky</Text>}
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={reset} disabled={saving}>
        <Text style={styles.secondaryButtonText}>Start over</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pickContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pickEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  pickTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  pickSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  reviewContent: {
    paddingBottom: spacing.xl * 2,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  field: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locatingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  retryLocation: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  primaryButtonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
