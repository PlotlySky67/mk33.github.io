import { useEffect, useState } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { EmptyState } from '../components/EmptyState';
import { SunsetCard } from '../components/SunsetCard';
import { colors, spacing } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToFeed } from '../firebase/sunsets';
import { Sunset } from '../types/sunset';
import { RootStackParamList, TabParamList } from '../../App';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function FeedScreen({ navigation }: Props) {
  const { user, following } = useAuth();
  const [sunsets, setSunsets] = useState<Sunset[]>([]);
  const [loading, setLoading] = useState(true);

  const followingIds = following.map((f) => f.uid).sort().join(',');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const ownerIds = [user.uid, ...following.map((f) => f.uid)];
    const unsubscribe = subscribeToFeed(ownerIds, (result) => {
      setSunsets(result);
      setLoading(false);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, followingIds]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3A1F3D', colors.bg]} style={styles.header}>
        <Text style={styles.eyebrow}>🌅 A+ Sunsets</Text>
        <Text style={styles.title}>Every sky, saved.</Text>
        <Text style={styles.subtitle}>A quiet shelf for the skies you actually love.</Text>
      </LinearGradient>

      {!loading && sunsets.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          subtitle="Catch a sunset, or follow a friend, and their sky will show up here."
        />
      ) : (
        <FlatList
          data={sunsets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <SunsetCard
              sunset={item}
              showOwner={item.ownerId !== user?.uid}
              onPress={() => navigation.navigate('SunsetDetail', { id: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  grid: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
});
