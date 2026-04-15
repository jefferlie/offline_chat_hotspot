import { Message, User } from '../app/types';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private isHost: boolean = false;
  private currentRoom: string = 'main';
  private username: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private ip: string = '';
  private intentionalDisconnect: boolean = false;

  connect(ip: string, username: string, asHost: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      this.username = username;
      this.isHost = asHost;
      this.ip = ip;
      this.intentionalDisconnect = false;
      this.currentRoom = 'main';

      const url = `ws://${ip}:8080`;

      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.send({
            type: 'join',
            roomName: this.currentRoom,
            userName: username,
          });
          resolve(true);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onclose = () => {
          this.emit('disconnected', {});
          if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect(this.ip, this.username, this.isHost);
            }, this.reconnectDelay);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          resolve(false);
        };
      } catch (error) {
        console.error('Connection error:', error);
        resolve(false);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      const { type } = message;

      switch (type) {
        case 'joined':
          this.currentRoom = message.roomName;
          this.emit('joined', {
            roomName: message.roomName,
            userName: message.userName,
            members: message.members,
            history: message.history || [],
            isHost: message.isHost || false,
          });
          break;

        case 'message':
          this.emit('message', {
            id: message.id || `msg-${message.timestamp}`,
            senderId: message.userName,
            senderName: message.userName,
            content: message.content,
            type: (message.contentType as 'text' | 'voice' | 'image') || 'text',
            imageData: message.imageData || null,
            audioUri: message.audioData || null,
            audioDuration: message.audioDuration || null,
            timestamp: message.timestamp,
            roomId: this.currentRoom,
          });
          break;

        case 'messageEdited':
          this.emit('message_edited', {
            messageId: message.messageId,
            newContent: message.newContent,
          });
          break;

        case 'messageDeleted':
          this.emit('message_deleted', {
            messageId: message.messageId,
          });
          break;

        case 'kicked':
          this.intentionalDisconnect = true;
          this.emit('kicked', { by: message.by });
          break;

        case 'private':
          this.emit('private', {
            from: message.from,
            content: message.content,
            timestamp: message.timestamp,
          });
          break;

        case 'userJoined':
          this.emit('user_joined', {
            id: message.userName,
            username: message.userName,
            isOnline: true,
            status: 'Online',
            joinedAt: message.timestamp,
          });
          break;

        case 'userLeft':
          this.emit('user_left', message.userName);
          break;

        case 'rooms':
          this.emit('rooms_list', message.list);
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  }

  private send(data: object) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  sendMessage(content: string, type: 'text' | 'voice' | 'image' = 'text') {
    this.send({
      type: 'message',
      content,
      contentType: type,
      roomName: this.currentRoom,
    });
  }

  sendPrivateMessage(targetUser: string, content: string) {
    this.send({
      type: 'private',
      targetUser,
      content,
      roomName: this.currentRoom,
    });
  }

  sendVoiceMessage(audioUri: string, duration: number) {
    this.send({
      type: 'message',
      content: 'Voice message',
      contentType: 'voice',
      audioData: audioUri,
      audioDuration: duration,
      roomName: this.currentRoom,
    });
  }

  sendImageMessage(imageData: string) {
    this.send({
      type: 'message',
      content: '📷 Image',
      contentType: 'image',
      imageData,
      roomName: this.currentRoom,
    });
  }

  editMessage(messageId: string, newContent: string) {
    this.send({
      type: 'editMessage',
      messageId,
      newContent,
      roomName: this.currentRoom,
    });
  }

  deleteMessage(messageId: string) {
    this.send({
      type: 'deleteMessage',
      messageId,
      roomName: this.currentRoom,
    });
  }

  kickUser(targetUser: string) {
    this.send({
      type: 'kickUser',
      targetUser,
      roomName: this.currentRoom,
    });
  }

  setTyping(isTyping: boolean) {
    this.send({
      type: 'typing',
      isTyping,
      roomName: this.currentRoom,
    });
  }

  joinRoom(roomName: string) {
    this.send({
      type: 'join',
      roomName,
      userName: this.username,
    });
  }

  getRooms() {
    this.send({ type: 'getRooms' });
  }

  registerPushToken(pushToken: string) {
    if (!pushToken) return;
    this.send({
      type: 'registerPushToken',
      pushToken,
      roomName: this.currentRoom,
    });
  }

  leave() {
    this.intentionalDisconnect = true;
    this.send({ type: 'leave' });
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getIsHost(): boolean {
    return this.isHost;
  }

  getCurrentRoom(): string {
    return this.currentRoom;
  }

  getIP(): string {
    return this.ip;
  }

  getUsername(): string {
    return this.username;
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback?: EventCallback) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }
    const listeners = this.eventListeners.get(event);
    const index = listeners?.indexOf(callback) ?? -1;
    if (index > -1) {
      listeners?.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    listeners?.forEach((cb) => cb(data));
  }
}

export const socketService = new WebSocketService();
export default socketService;
