const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const PORT = 8080;

const rooms = new Map();
const clients = new Map();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

function broadcastRoom(roomName, message, excludeWs = null) {
  const room = rooms.get(roomName);
  if (!room) return;
  room.members.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function sendToUser(userName, message) {
  for (const [ws, client] of clients) {
    if (client.userName === userName && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      break;
    }
  }
}

function handleMessage(ws, data) {
  try {
    const message = JSON.parse(data);
    const { type, roomName, userName, content, targetUser, contentType, imageData, audioData, audioDuration, messageId, newContent } = message;

    switch (type) {
      case 'join': {
        if (!rooms.has(roomName)) {
          rooms.set(roomName, { members: new Set(), messages: [], host: userName });
        }
        const room = rooms.get(roomName);

        // Если пользователь уже в комнате (реконнект) — убрать старый ws
        for (const [oldWs, client] of clients) {
          if (client.userName === userName && client.roomName === roomName && oldWs !== ws) {
            room.members.delete(oldWs);
            clients.delete(oldWs);
            break;
          }
        }

        const alreadyInRoom = Array.from(room.members).some(
          (w) => clients.get(w)?.userName === userName
        );

        room.members.add(ws);
        clients.set(ws, { roomName, userName });

        // Отправить текущий список участников + историю сообщений
        ws.send(JSON.stringify({
          type: 'joined',
          roomName,
          userName,
          members: Array.from(room.members).map(w => clients.get(w)?.userName).filter(Boolean),
          history: room.messages,
          isHost: room.host === userName,
        }));

        // Уведомить остальных только если это новый вход (не реконнект)
        if (!alreadyInRoom) {
          broadcastRoom(roomName, {
            type: 'userJoined',
            userName,
            timestamp: Date.now(),
          }, ws);
        }
        break;
      }

      case 'message': {
        const client = clients.get(ws);
        if (!client) break;
        const room = rooms.get(client.roomName);
        if (!room) break;

        const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const msg = {
          type: 'message',
          id: msgId,
          userName: client.userName,
          content,
          contentType: contentType || 'text',
          imageData: imageData || null,
            audioData: audioData || null,
            audioDuration: audioDuration || null,
          timestamp: Date.now(),
        };
        room.messages.push(msg);
        broadcastRoom(client.roomName, msg, ws);
        break;
      }

      case 'editMessage': {
        const client = clients.get(ws);
        if (!client) break;
        const room = rooms.get(client.roomName);
        if (!room) break;

        const msgIndex = room.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) break;
        if (room.messages[msgIndex].userName !== client.userName) break;

        room.messages[msgIndex].content = newContent;
        room.messages[msgIndex].edited = true;

        broadcastRoom(client.roomName, {
          type: 'messageEdited',
          messageId,
          newContent,
        });
        break;
      }

      case 'deleteMessage': {
        const client = clients.get(ws);
        if (!client) break;
        const room = rooms.get(client.roomName);
        if (!room) break;

        const msgIndex = room.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) break;
        if (room.messages[msgIndex].userName !== client.userName) break;

        room.messages[msgIndex].deleted = true;

        broadcastRoom(client.roomName, {
          type: 'messageDeleted',
          messageId,
        });
        break;
      }

      case 'kickUser': {
        const client = clients.get(ws);
        if (!client) break;
        const room = rooms.get(client.roomName);
        if (!room) break;
        if (room.host !== client.userName) break; // только хост может кикать

        sendToUser(targetUser, { type: 'kicked', by: client.userName });

        // Отключить кикнутого
        for (const [targetWs, targetClient] of clients) {
          if (targetClient.userName === targetUser && targetClient.roomName === client.roomName) {
            broadcastRoom(client.roomName, {
              type: 'userLeft',
              userName: targetUser,
              timestamp: Date.now(),
            });
            room.members.delete(targetWs);
            clients.delete(targetWs);
            targetWs.close();
            break;
          }
        }
        break;
      }

      case 'private': {
        const sender = clients.get(ws);
        if (!sender) break;
        sendToUser(targetUser, {
          type: 'private',
          from: sender.userName,
          content,
          timestamp: Date.now(),
        });
        break;
      }

      case 'getRooms': {
        const roomList = Array.from(rooms.entries()).map(([name, r]) => ({
          name,
          members: r.members.size,
        }));
        ws.send(JSON.stringify({ type: 'rooms', list: roomList }));
        break;
      }

      case 'leave':
        handleDisconnect(ws);
        break;
    }
  } catch (e) {
    console.error('Message error:', e);
  }
}

function handleDisconnect(ws) {
  const client = clients.get(ws);
  if (client) {
    const { roomName, userName } = client;
    const room = rooms.get(roomName);
    if (room) {
      room.members.delete(ws);
      broadcastRoom(roomName, {
        type: 'userLeft',
        userName,
        timestamp: Date.now(),
      });
      if (room.members.size === 0) {
        rooms.delete(roomName);
      }
    }
    clients.delete(ws);
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => handleMessage(ws, data));
  ws.on('close', () => handleDisconnect(ws));
  ws.on('error', (err) => console.error('WS Error:', err));
});

const host = '0.0.0.0';
server.listen(PORT, host, () => {
  const ip = getLocalIP();
  console.log(`Server running on http://${ip}:${PORT}`);
  console.log(`WebSocket ready at ws://${ip}:${PORT}`);
});
