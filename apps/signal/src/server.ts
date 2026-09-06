import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  ws: WebSocket;
  peerId: string;
  room: string;
}

const PORT = parseInt(process.env.PORT || '4444', 10);
const wss = new WebSocketServer({ port: PORT });
const clients = new Map<WebSocket, ClientConnection>();

console.log(`[Hermes-Signal] Signaling server listening on ws://localhost:${PORT}`);
console.log(`[Hermes-Signal] Note: Signaling carries ONLY peer connection negotiation (SDP/ICE), never document content.`);

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());
      const { type, room, peerId, targetPeerId } = message;

      if (type === 'join' && room && peerId) {
        clients.set(ws, { ws, peerId, room });
        console.log(`[Hermes-Signal] Peer ${peerId} joined room: ${room}`);

        // Notify other peers in the same room
        for (const [otherWs, client] of clients.entries()) {
          if (otherWs !== ws && client.room === room && otherWs.readyState === WebSocket.OPEN) {
            otherWs.send(JSON.stringify({ type: 'peer_joined', peerId }));
          }
        }
        return;
      }

      const sender = clients.get(ws);
      if (!sender) return;

      // Route targeted signals (offer, answer, candidate)
      if (targetPeerId) {
        for (const [targetWs, client] of clients.entries()) {
          if (
            client.peerId === targetPeerId &&
            client.room === sender.room &&
            targetWs.readyState === WebSocket.OPEN
          ) {
            targetWs.send(JSON.stringify({ ...message, fromPeerId: sender.peerId }));
          }
        }
      } else {
        // Broadcast signal to everyone else in the room
        for (const [otherWs, client] of clients.entries()) {
          if (
            otherWs !== ws &&
            client.room === sender.room &&
            otherWs.readyState === WebSocket.OPEN
          ) {
            otherWs.send(JSON.stringify({ ...message, fromPeerId: sender.peerId }));
          }
        }
      }
    } catch (err) {
      console.warn('[Hermes-Signal] Error processing signaling packet:', err);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`[Hermes-Signal] Peer ${client.peerId} disconnected from room: ${client.room}`);
      clients.delete(ws);

      // Notify remaining peers
      for (const [otherWs, otherClient] of clients.entries()) {
        if (otherClient.room === client.room && otherWs.readyState === WebSocket.OPEN) {
          otherWs.send(JSON.stringify({ type: 'peer_left', peerId: client.peerId }));
        }
      }
    }
  });
});
