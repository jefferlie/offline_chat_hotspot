import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socket';
import { Message, User } from '../app/types';

interface UseChatReturn {
  messages: Message[];
  users: User[];
  currentUser: User | null;
  isConnected: boolean;
  isHost: boolean;
  serverIP: string | null;
  typingUsers: string[];
  connecting: boolean;
  error: string | null;
  startHost: (ip: string, username: string) => Promise<void>;
  joinChat: (ip: string, username: string) => Promise<void>;
  sendMessage: (content: string) => void;
  sendVoiceMessage: (audioUri: string, duration: number) => void;
  sendImageMessage: (imageData: string) => void;
  setTyping: (isTyping: boolean) => void;
  leaveChat: () => void;
  clearError: () => void;
}

const ChatContext = createContext<UseChatReturn | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [serverIP, setServerIP] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const onMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const onJoined = (data: { roomName: string; userName: string; members: string[] }) => {
      setIsConnected(true);
      setServerIP(socketService.getIP());
      const memberUsers: User[] = data.members.map((name: string) => ({
        id: name,
        username: name,
        isOnline: true,
        status: 'Online',
        joinedAt: Date.now(),
      }));
      setUsers(memberUsers);
    };

    const onUserJoined = (user: User) => {
      setUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    };

    const onUserLeft = (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const onRoomsList = (rooms: { name: string; members: number }[]) => {
      console.log('Rooms:', rooms);
    };

    const onDisconnected = () => {
      setIsConnected(false);
      setUsers([]);
    };

    socketService.on('message', onMessage);
    socketService.on('joined', onJoined);
    socketService.on('user_joined', onUserJoined);
    socketService.on('user_left', onUserLeft);
    socketService.on('rooms_list', onRoomsList);
    socketService.on('disconnected', onDisconnected);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.off('message', onMessage);
      socketService.off('joined', onJoined);
      socketService.off('user_joined', onUserJoined);
      socketService.off('user_left', onUserLeft);
      socketService.off('rooms_list', onRoomsList);
      socketService.off('disconnected', onDisconnected);
    };
  }, []);

  const startHost = useCallback(async (ip: string, username: string) => {
    setConnecting(true);
    setError(null);
    try {
      const connected = await socketService.connect(ip, username, true);
      if (connected) {
        setIsHost(true);
        const user: User = {
          id: username,
          username,
          isOnline: true,
          status: 'Host',
          joinedAt: Date.now(),
        };
        setCurrentUser(user);
        setUsers([user]);
      } else {
        setError('Could not connect to server. Make sure the backend is running.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start server');
      setIsConnected(false);
    } finally {
      setConnecting(false);
    }
  }, []);

  const joinChat = useCallback(async (ip: string, username: string) => {
    setConnecting(true);
    setError(null);
    try {
      const connected = await socketService.connect(ip, username, false);
      if (connected) {
        const user: User = {
          id: username,
          username,
          isOnline: true,
          joinedAt: Date.now(),
        };
        setCurrentUser(user);
        setIsConnected(true);
        setIsHost(false);
      } else {
        setError('Could not connect to server. Make sure the host is running.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    } finally {
      setConnecting(false);
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserRef.current?.id || 'unknown',
      senderName: currentUserRef.current?.username || 'Unknown',
      content,
      type: 'text',
      timestamp: Date.now(),
      roomId: socketService.getCurrentRoom(),
    };

    setMessages((prev) => [...prev, message]);
    socketService.sendMessage(content, 'text');
  }, []);

  const sendVoiceMessage = useCallback((audioUri: string, duration: number) => {
    const message: Message = {
      id: `voice-${Date.now()}`,
      senderId: currentUserRef.current?.id || 'unknown',
      senderName: currentUserRef.current?.username || 'Unknown',
      content: 'Voice message',
      type: 'voice',
      audioUri,
      audioDuration: duration,
      timestamp: Date.now(),
      roomId: socketService.getCurrentRoom(),
    };

    setMessages((prev) => [...prev, message]);
    socketService.sendVoiceMessage(audioUri, duration);
  }, []);

  const sendImageMessage = useCallback((imageData: string) => {
    const message: Message = {
      id: `img-${Date.now()}`,
      senderId: currentUserRef.current?.id || 'unknown',
      senderName: currentUserRef.current?.username || 'Unknown',
      content: '📷 Image',
      type: 'image',
      imageData,
      timestamp: Date.now(),
      roomId: socketService.getCurrentRoom(),
    };
    setMessages((prev) => [...prev, message]);
    socketService.sendImageMessage(imageData);
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    socketService.setTyping(isTyping);
  }, []);

  const leaveChat = useCallback(() => {
    socketService.leave();
    setMessages([]);
    setUsers([]);
    setCurrentUser(null);
    setIsConnected(false);
    setIsHost(false);
    setServerIP(null);
    setTypingUsers([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        users,
        currentUser,
        isConnected,
        isHost,
        serverIP,
        typingUsers,
        connecting,
        error,
        startHost,
        joinChat,
        sendMessage,
        sendVoiceMessage,
        sendImageMessage,
        setTyping,
        leaveChat,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): UseChatReturn => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
