# Offline Chat Backend API

## Server Info
- **Port:** 8080
- **Protocol:** WebSocket
- **HTTP Health:** `GET /health`

## Connection
```javascript
const ws = new WebSocket('ws://192.168.X.X:8080');
```

## Messages

| TYPE | REQUEST BODY | RESPONSE BODY | DESCRIPTION |
|------|--------------|---------------|--------------|
| **join** | `{"type":"join","roomName":"room1","userName":"alice"}` | `{"type":"joined","roomName":"room1","userName":"alice","members":["alice"]}` | Join a chat room |
| **message** | `{"type":"message","content":"Hello world"}` | `{"type":"message","userName":"alice","content":"Hello world","timestamp":1234567890}` | Send message to room |
| **private** | `{"type":"private","targetUser":"bob","content":"Hi"}` | `{"type":"private","from":"alice","content":"Hi","timestamp":1234567890}` | Send private message |
| **getRooms** | `{"type":"getRooms"}` | `{"type":"rooms","list":[{"name":"room1","members":2}]}` | Get list of active rooms |
| **leave** | `{"type":"leave"}` | - | Leave current room |

## Events Received

| TYPE | BODY | DESCRIPTION |
|------|------|-------------|
| **userJoined** | `{"type":"userJoined","userName":"bob","timestamp":1234567890}` | User joined room |
| **userLeft** | `{"type":"userLeft","userName":"bob","timestamp":1234567890}` | User left room |

## Example Usage

```javascript
const ws = new WebSocket('ws://192.168.1.100:8080');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'join',
    roomName: 'chat',
    userName: 'Alice'
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg.type, msg);
};

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    content: 'Hello everyone!'
  }));
};
```
