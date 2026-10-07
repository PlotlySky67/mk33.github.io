import { useEffect, useMemo, useState } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { getConversationId, otherParticipant, subscribeToConversations } from '../firebase/messages';
import { colors, spacing } from '../theme/colors';
import { Conversation } from '../types/message';
import { RootStackParamList, TabParamList } from '../../App';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Messages'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Row =
  | { kind: 'conversation'; uid: string; name: string; preview: string; time: string; unread: boolean }
  | { kind: 'contact'; uid: string; name: string };

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MessagesScreen({ navigation }: Props) {
  const { user, following } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, setConversations);
  }, [user]);

  const conversationIds = useMemo(() => new Set(conversations.map((c) => c.id)), [conversations]);

  const conversationRows = useMemo<Row[]>(() => {
    if (!user) return [];
    return conversations.map((conversation) => {
      const other = otherParticipant(conversation, user.uid);
      return {
        kind: 'conversation',
        uid: other.uid,
        name: other.name,
        preview: conversation.lastMessage,
        time: formatTime(conversation.lastMessageAt),
        unread: conversation.lastSenderId !== user.uid,
      };
    });
  }, [conversations, user]);

  const contactRows = useMemo<Row[]>(() => {
    if (!user) return [];
    return following
      .filter((f) => !conversationIds.has(getConversationId(user.uid, f.uid)))
      .map((f) => ({ kind: 'contact' as const, uid: f.uid, name: f.displayName }));
  }, [following, conversationIds, user]);

  if (!user) return null;

  const sections = [
    ...(conversationRows.length > 0 ? [{ title: 'Mesaje', data: conversationRows }] : []),
    ...(contactRows.length > 0 ? [{ title: 'Prieteni', data: contactRows }] : []),
  ];

  if (sections.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <EmptyState
          title="Nicio conversație încă"
          subtitle="Urmărește un prieten din tab-ul Friends ca să poți începe o conversație cu el."
          emoji="💬"
        />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.uid}
      ListHeaderComponent={<Header />}
      renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate('Chat', { otherUid: item.uid, otherName: item.name })}
        >
          <Avatar name={item.name} />
          <View style={styles.rowText}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text
              style={[styles.rowPreview, item.kind === 'conversation' && item.unread && styles.rowPreviewUnread]}
              numberOfLines={1}
            >
              {item.kind === 'conversation' ? item.preview : 'Trimite primul mesaj'}
            </Text>
          </View>
          {item.kind === 'conversation' && <Text style={styles.rowTime}>{item.time}</Text>}
        </Pressable>
      )}
    />
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>💬</Text>
      <Text style={styles.title}>Mesaje</Text>
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
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowPreview: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  rowPreviewUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  rowTime: {
    color: colors.textFaint,
    fontSize: 12,
  },
});
