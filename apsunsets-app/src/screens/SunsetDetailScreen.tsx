import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/colors';
import { db } from '../firebase/config';
import { deleteSunset, placeLabel } from '../firebase/sunsets';
import { useAuth } from '../contexts/AuthContext';
import { Sunset } from '../types/sunset';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SunsetDetail'>;

export function SunsetDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [sunset, setSunset] = useState<Sunset | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'sunsets', id), (snapshot) => {
      setSunset(snapshot.exists() ? (snapshot.data() as Sunset) : null);
    });
  }, [id]);

  if (!sunset) return null;

  const isOwner = sunset.ownerId === user?.uid;

  function confirmDelete() {
    Alert.alert('Delete this sky?', 'This sunset will be removed for good.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!sunset) return;
          await deleteSunset(sunset);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: sunset.photoUrl }} style={styles.image} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.place}>{placeLabel(sunset.location)}</Text>
        <Text style={styles.date}>
          {new Date(sunset.capturedAt).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        {!isOwner && <Text style={styles.owner}>Saved by {sunset.ownerName}</Text>}

        {isOwner && (
          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  body: {
    padding: spacing.lg,
  },
  place: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  date: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  owner: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
