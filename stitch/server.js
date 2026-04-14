const { Server } = require('socket.io');
const { createServer } = require('http');
const { networkInterfaces } = require('os');

const users = new Map();
const messages = new Map();
let hostSocketId = null;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    const user = {
      id: socket.id,
      username: data.username,
      isOnline: true,
      status: data.asHost ? 'Host' : 'Online',
      socketId: socket.id,
      roomId: data.roomId || 'main',
      joinedAt: Date.now(),
    };

    users.set(socket.id, user);

    if (data.asHost) {
      hostSocketId = socket.id;
    }

    socket.join(data.roomId || 'main');
    io.emit('user_joined', user);
    broadcastUsers();
  });

  socket.on('message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: user.id,
      senderName: user.username,
      content: data.content || '',
      type: data.type || 'text',
      audioUri: data.audioUri,
      audioDuration: data.audioDuration,
      timestamp: Date.now(),
      roomId: data.roomId || user.roomId,
    };

    io.to(message.roomId).emit('message', message);
  });

  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit('typing', {
      userId: user.id,
      username: user.username,
      isTyping: data.isTyping,
    });
  });

  socket.on('join_room', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.leave(user.roomId);
    user.roomId = data.roomId;
    socket.join(data.roomId);

    io.emit('room_joined', {
      roomId: data.roomId,
      users: getUsersInRoom(data.roomId),
    });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('user_left', user.id);

      if (hostSocketId === socket.id) {
        hostSocketId = null;
      }
    }
    broadcastUsers();
  });
});

function broadcastUsers() {
  const usersList = Array.from(users.values()).map((u) => ({
    id: u.id,
    username: u.username,
    isOnline: u.isOnline,
    status: u.status,
    joinedAt: u.joinedAt,
  }));
  io.emit('users_list', usersList);
}

function getUsersInRoom(roomId) {
  const usersList = [];
  users.forEach((user) => {
    if (user.roomId === roomId) {
      usersList.push({
        id: user.id,
        username: user.username,
        isOnline: user.isOnline,
        status: user.status,
        joinedAt: user.joinedAt,
      });
    }
  });
  return usersList;
}

function getLocalIP() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://${getLocalIP()}:${PORT}`);
  console.log(`Share this IP with others to join the chat`);
});

httpServer.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});