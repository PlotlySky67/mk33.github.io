import { useEffect, useState } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.header}>
        <Text style={styles.wordmark}>A+ Sunsets</Text>
      </View>

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
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wordmark: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  grid: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
});
