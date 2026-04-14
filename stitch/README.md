# Fluid Chat - Offline Local Network Chat App

A fully functional offline chat application built with React Native (Expo) that works over local Wi-Fi networks without internet connection.

## Prerequisites

- Node.js 18+
- npm or yarn

## Project Structure

```
stitch/                    # React Native (Expo) Frontend
├── app/
│   ├── theme.ts          # Colors, spacing, typography
│   ├── types.ts         # TypeScript interfaces
│   └── Navigation.tsx  # Stack navigation
├── screens/
│   ├── HomeScreen.tsx   # Entry point (Host/Join choice)
│   ├── HostScreen.tsx   # Create chat as host
│   ├── JoinScreen.tsx    # Join existing chat
│   ├── ChatScreen.tsx   # Main chat interface
│   └── UsersScreen.tsx  # Online users list
├── components/
│   ├── MessageBubble.tsx # Chat message bubbles
│   ├── InputBar.tsx     # Message input with voice
│   ├── UserItem.tsx     # User list item
│   ├── TopBar.tsx       # Top navigation bar
│   └── BottomNav.tsx    # Bottom navigation
├── services/
│   └── socket.ts       # WebSocket client service
├── hooks/
│   └── useChat.ts      # Chat state management
└── App.tsx            # App entry point

backend/                  # Node.js Backend (WebSocket Server)
├── server.js           # WebSocket chat server
└── package.json
```

## How to Run

### Step 1: Start the Backend

```bash
cd /Users/ernarelubaj/Desktop/offline\ chat/backend
npm install  # if not already installed
node server.js
```

The server will start on port 8080 and show your local IP address:
```
Server running on http://YOUR_IP:8080
WebSocket ready at ws://YOUR_IP:8080
```

### Step 2: Start the Expo App

```bash
cd /Users/ernarelubaj/Desktop/offline\ chat/stitch
npm install  # if not already installed
npx expo start
```

### Step 3: Connect

1. **As Host**: Enter your name + your local IP address (shown in terminal) → "Start as Host"
2. **As Client**: Enter your name + host's IP address → "Join Chat"

## Technical Details

### Backend (WebSocket Server)

- Port: 8080
- Protocol: Native WebSocket (ws library)
- Events:
  - `join` - Join a room
  - `message` - Send/receive messages
  - `userJoined` - User joined notification
  - `userLeft` - User left notification
  - `private` - Private messages
  - `getRooms` - Get room list

### Frontend Connection

- Protocol: Native WebSocket
- URL format: `ws://IP:8080`

### Voice Messages

Voice messages are recorded using expo-av and can be played back directly in the message bubble.

### Network Requirements

- All devices must be on the same local Wi-Fi network
- Firewall should allow connections on port 8080

## Design System

The app follows the "Fluid Communication Protocol" design system:
- **Colors**: Navy blues (#0058bc, #0070eb), whites (#f8f9fa)
- **Typography**: System fonts
- **Components**: Glassmorphism, ambient shadows, tonal layering

## License

MIT