import { addDoc, collection, doc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';

import { db } from './config';
import { ChatMessage, Conversation } from '../types/message';

export function getConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export function subscribeToConversations(uid: string, callback: (conversations: Conversation[]) => void) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation));
  });
}

export function subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
  });
}

export async function sendMessage(input: {
  currentUid: string;
  currentName: string;
  otherUid: string;
  otherName: string;
  text: string;
}): Promise<void> {
  const trimmed = input.text.trim();
  if (!trimmed) return;

  const conversationId = getConversationId(input.currentUid, input.otherUid);
  const now = new Date().toISOString();
  const conversationRef = doc(db, 'conversations', conversationId);

  await setDoc(
    conversationRef,
    {
      participants: [input.currentUid, input.otherUid],
      participantNames: {
        [input.currentUid]: input.currentName,
        [input.otherUid]: input.otherName,
      },
      lastMessage: trimmed,
      lastMessageAt: now,
      lastSenderId: input.currentUid,
    },
    { merge: true }
  );

  await addDoc(collection(conversationRef, 'messages'), {
    senderId: input.currentUid,
    text: trimmed,
    createdAt: now,
  });
}

export function otherParticipant(conversation: Conversation, selfUid: string): { uid: string; name: string } {
  const otherUid = conversation.participants.find((uid) => uid !== selfUid) ?? selfUid;
  return { uid: otherUid, name: conversation.participantNames[otherUid] ?? 'Unknown' };
}
