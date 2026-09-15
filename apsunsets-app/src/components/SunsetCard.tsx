import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/colors';
import { Sunset } from '../types/sunset';
import { placeLabel } from '../firebase/sunsets';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SunsetCard({
  sunset,
  onPress,
  showOwner = false,
}: {
  sunset: Sunset;
  onPress: () => void;
  showOwner?: boolean;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: sunset.photoUrl }} style={styles.image} contentFit="cover" transition={150} />
      {showOwner && (
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerText} numberOfLines={1}>
            {sunset.ownerName}
          </Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.place} numberOfLines={1}>
          {placeLabel(sunset.location)}
        </Text>
        <Text style={styles.date}>{formatDate(sunset.capturedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    flex: 1,
  },
  ownerBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 11, 24, 0.65)',
  },
  ownerText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(20, 11, 24, 0.55)',
  },
  place: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
