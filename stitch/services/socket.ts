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
  private port: number = 8080;
  private intentionalDisconnect: boolean = false;

  private parseServerAddress(input: string): { host: string; port: number } | null {
    let value = input.trim();
    if (!value) return null;

    value = value
      .replace(/^wss?:\/\//i, '')
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .replace(/\s+/g, '');

    if (!value) return null;

    let host = value;
    let port = 8080;

    if (value.startsWith('[')) {
      const closeBracketIndex = value.indexOf(']');
      if (closeBracketIndex > 1) {
        host = value.slice(1, closeBracketIndex);
        const rest = value.slice(closeBracketIndex + 1);
        if (rest.startsWith(':')) {
          const parsedPort = Number(rest.slice(1));
          if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
            return null;
          }
          port = parsedPort;
        }
      }
    } else {
      const parts = value.split(':');
      const maybePort = parts.length > 1 ? parts[parts.length - 1] : '';
      if (maybePort && /^\d+$/.test(maybePort)) {
        const parsedPort = Number(maybePort);
        if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
          return null;
        }
        port = parsedPort;
        host = parts.slice(0, -1).join(':');
      }
    }

    if (!host) return null;
    return { host, port };
  }

  private buildHostCandidates(host: string, asHost: boolean): string[] {
    const normalizedHost = host.toLowerCase();

    if (normalizedHost === '127.0.0.1' || normalizedHost === 'localhost') {
      return ['127.0.0.1', 'localhost', '[::1]'];
    }

    if (asHost) {
      return [host, '127.0.0.1', 'localhost', '[::1]'];
    }

    return [host, '127.0.0.1', 'localhost'];
  }

  connect(ip: string, username: string, asHost: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      this.username = username;
      this.isHost = asHost;
      this.intentionalDisconnect = false;
      this.currentRoom = 'main';

      const parsedAddress = this.parseServerAddress(ip);
      if (!parsedAddress) {
        resolve(false);
        return;
      }

      if (this.socket) {
        this.intentionalDisconnect = true;
        this.socket.close();
        this.socket = null;
        this.intentionalDisconnect = false;
      }

      this.ip = parsedAddress.host;
      this.port = parsedAddress.port;

      const hostCandidates = this.buildHostCandidates(parsedAddress.host, asHost);
      let hostIndex = 0;
      let settled = false;

      const tryConnect = () => {
        if (hostIndex >= hostCandidates.length) {
          if (!settled) {
            settled = true;
            resolve(false);
          }
          return;
        }

        const host = hostCandidates[hostIndex++];
        const url = `ws://${host}:${this.port}`;
        let advanced = false;
        let opened = false;
        let connectTimeout: ReturnType<typeof setTimeout> | null = null;

        try {
          const candidateSocket = new WebSocket(url);

          connectTimeout = setTimeout(() => {
            if (opened || advanced || settled) return;
            advanced = true;
            try {
              candidateSocket.close();
            } catch {
              // ignore
            }
            tryConnect();
          }, 2500);

          candidateSocket.onopen = () => {
            opened = true;
            if (connectTimeout) {
              clearTimeout(connectTimeout);
            }
            this.socket = candidateSocket;
            this.ip = host;
            this.reconnectAttempts = 0;
            this.send({
              type: 'join',
              roomName: this.currentRoom,
              userName: username,
            });
            if (!settled) {
              settled = true;
              resolve(true);
            }
          };

          candidateSocket.onmessage = (event) => {
            if (this.socket === candidateSocket) {
              this.handleMessage(event.data);
            }
          };

          candidateSocket.onclose = () => {
            if (connectTimeout) {
              clearTimeout(connectTimeout);
            }

            if (!opened) {
              if (!advanced && !settled) {
                advanced = true;
                tryConnect();
              }
              return;
            }

            if (this.socket !== candidateSocket) {
              return;
            }
            this.emit('disconnected', {});
            if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              setTimeout(() => {
                this.connect(this.getIP(), this.username, this.isHost);
              }, this.reconnectDelay);
            }
          };

          candidateSocket.onerror = (error) => {
            if (connectTimeout) {
              clearTimeout(connectTimeout);
            }
            console.error('WebSocket error:', error);

            if (this.socket === candidateSocket) {
              if (!settled) {
                settled = true;
                resolve(false);
              }
              return;
            }

            if (!advanced && !settled) {
              advanced = true;
              try {
                candidateSocket.close();
              } catch {
                // ignore
              }
              tryConnect();
            }
          };
        } catch (error) {
          console.error('Connection error:', error);
          if (!advanced && !settled) {
            advanced = true;
            tryConnect();
          }
        }
      };

      tryConnect();
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
    return this.port === 8080 ? this.ip : `${this.ip}:${this.port}`;
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
