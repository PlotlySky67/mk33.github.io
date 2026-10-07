export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}
