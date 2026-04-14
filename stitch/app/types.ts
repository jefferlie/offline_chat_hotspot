export interface User {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  status?: string;
  joinedAt?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'voice' | 'image';
  audioUri?: string;
  audioDuration?: number;
  imageData?: string;
  timestamp: number;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
  users: string[];
  createdAt: number;
}

export interface ChatState {
  messages: Message[];
  users: User[];
  currentUser: User | null;
  currentRoom: string;
  isConnected: boolean;
  isHost: boolean;
  serverIP: string | null;
  typingUsers: string[];
}

export type RootStackParamList = {
  Home: undefined;
  Host: { username: string; serverIP: string };
  Join: { username: string; serverIP: string };
  Chat: { roomId?: string };
  Users: undefined;
};