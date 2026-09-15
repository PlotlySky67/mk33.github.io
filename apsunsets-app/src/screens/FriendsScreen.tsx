import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { followUser, searchUsersByName, unfollowUser } from '../firebase/users';
import { colors, radius, spacing } from '../theme/colors';
import { UserProfile } from '../types/sunset';

export function FriendsScreen() {
  const { user, following } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  const followingIds = new Set(following.map((f) => f.uid));

  async function runSearch(text: string) {
    setSearchText(text);
    if (!user || text.trim().length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const found = await searchUsersByName(text, user.uid);
      setResults(found);
    } finally {
      setSearching(false);
    }
  }

  async function toggleFollow(target: { uid: string; displayName: string }) {
    if (!user) return;
    setPendingUid(target.uid);
    try {
      if (followingIds.has(target.uid)) {
        await unfollowUser(user.uid, target.uid);
      } else {
        await followUser(user.uid, user.displayName ?? 'A friend', {
          uid: target.uid,
          displayName: target.displayName,
        });
      }
    } finally {
      setPendingUid(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Friends</Text>
        <Text style={styles.title}>Find someone to follow</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by name"
          placeholderTextColor={colors.textFaint}
          value={searchText}
          onChangeText={runSearch}
          autoCapitalize="none"
        />
      </View>

      {searching && <ActivityIndicator style={styles.spinner} color={colors.accent} />}

      {searchText.trim().length > 0 && !searching && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.noResults}>No one found with that name.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.displayName}</Text>
              <Pressable
                style={[styles.followButton, followingIds.has(item.uid) && styles.followingButton]}
                onPress={() => toggleFollow(item)}
                disabled={pendingUid === item.uid}
              >
                <Text style={[styles.followText, followingIds.has(item.uid) && styles.followingText]}>
                  {followingIds.has(item.uid) ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {searchText.trim().length === 0 && (
        <>
          <Text style={styles.sectionTitle}>Following ({following.length})</Text>
          {following.length === 0 ? (
            <EmptyState title="No friends yet" subtitle="Search by name above to follow someone's sky." emoji="🧑‍🤝‍🧑" />
          ) : (
            <FlatList
              data={following}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Pressable
                    style={[styles.followButton, styles.followingButton]}
                    onPress={() => toggleFollow(item)}
                    disabled={pendingUid === item.uid}
                  >
                    <Text style={[styles.followText, styles.followingText]}>Following</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </>
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
    paddingBottom: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
  },
  spinner: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  noResults: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
  },
  followingText: {
    color: colors.textMuted,
  },
});
