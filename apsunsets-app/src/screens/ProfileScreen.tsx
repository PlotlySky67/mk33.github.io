import { useEffect, useMemo, useState } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { placeLabel, subscribeToOwnSunsets } from '../firebase/sunsets';
import { Sunset } from '../types/sunset';
import { RootStackParamList, TabParamList } from '../../App';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface Section {
  title: string;
  data: Sunset[];
}

function groupByPlace(sunsets: Sunset[]): Section[] {
  const groups = new Map<string, Sunset[]>();
  for (const sunset of sunsets) {
    const key = placeLabel(sunset.location);
    const list = groups.get(key) ?? [];
    list.push(sunset);
    groups.set(key, list);
  }
  return Array.from(groups.entries())
    .map(([title, data]) => ({ title, data }))
    .sort((a, b) => b.data.length - a.data.length);
}

export function ProfileScreen({ navigation }: Props) {
  const { user, following, logOut } = useAuth();
  const [sunsets, setSunsets] = useState<Sunset[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToOwnSunsets(user.uid, setSunsets);
  }, [user]);

  const sections = useMemo(() => groupByPlace(sunsets), [sunsets]);
  const placeCount = sections.length;

  return (
    <View style={styles.container}>
      {sunsets.length === 0 ? (
        <>
          <Header
            name={user?.displayName ?? 'You'}
            total={0}
            places={0}
            friends={following.length}
            onOpenFriends={() => navigation.navigate('Tabs', { screen: 'Friends' })}
            onLogOut={logOut}
          />
          <EmptyState
            title="Your profile is quiet, for now"
            subtitle="Every sunset you save will be organized here, by place and date."
            emoji="✨"
          />
        </>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Header
              name={user?.displayName ?? 'You'}
              total={sunsets.length}
              places={placeCount}
              friends={following.length}
              onOpenFriends={() => navigation.navigate('Tabs', { screen: 'Friends' })}
              onLogOut={logOut}
            />
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>
              {section.title} · {section.data.length}
            </Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('SunsetDetail', { id: item.id })}
            >
              <Image source={{ uri: item.photoUrl }} style={styles.thumb} contentFit="cover" />
              <View style={styles.rowText}>
                <Text style={styles.rowDate}>
                  {new Date(item.capturedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Header({
  name,
  total,
  places,
  friends,
  onOpenFriends,
  onLogOut,
}: {
  name: string;
  total: number;
  places: number;
  friends: number;
  onOpenFriends: () => void;
  onLogOut: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{name}</Text>
      <Text style={styles.title}>YOUR sky, saved.</Text>
      <View style={styles.statsRow}>
        <Stat value={total} label={total === 1 ? 'sunset' : 'sunsets'} />
        <Stat value={places} label={places === 1 ? 'place' : 'places'} />
        <Pressable onPress={onOpenFriends}>
          <Stat value={friends} label={friends === 1 ? 'friend' : 'friends'} />
        </Pressable>
      </View>
      <Pressable onPress={onLogOut}>
        <Text style={styles.logOut}>Log out</Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingBottom: spacing.xl * 2,
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
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  stat: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 88,
  },
  statValue: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  logOut: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  rowText: {
    flex: 1,
  },
  rowDate: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
