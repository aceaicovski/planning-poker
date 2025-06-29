const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ 
  port: 3001,
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
  }
});

const rooms = new Map();
const clients = new Map();

function createRoom() {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const room = {
    id: roomId,
    participants: new Map(),
    votesRevealed: false,
    createdAt: Date.now()
  };
  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function addParticipant(roomId, userId, userName) {
  const room = getRoom(roomId);
  if (!room) return null;
  
  const participant = {
    id: userId,
    name: userName,
    vote: null,
    hasVoted: false
  };
  
  room.participants.set(userId, participant);
  return participant;
}

function removeParticipant(roomId, userId) {
  const room = getRoom(roomId);
  if (!room) return;
  
  room.participants.delete(userId);
  
  if (room.participants.size === 0) {
    rooms.delete(roomId);
  }
}

function setParticipantVote(roomId, userId, vote) {
  const room = getRoom(roomId);
  if (!room) return;
  
  const participant = room.participants.get(userId);
  if (!participant) return;
  
  participant.vote = vote;
  participant.hasVoted = vote !== null;
}

function getRoomState(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;
  
  const participants = Array.from(room.participants.values()).map(p => ({
    id: p.id,
    name: p.name,
    hasVoted: p.hasVoted,
    vote: room.votesRevealed ? p.vote : null
  }));
  
  return {
    id: room.id,
    participants,
    votesRevealed: room.votesRevealed
  };
}

function revealVotes(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  
  room.votesRevealed = true;
}

function resetVotes(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  
  room.votesRevealed = false;
  room.participants.forEach(participant => {
    participant.vote = null;
    participant.hasVoted = false;
  });
}

function broadcastToRoom(roomId, message, excludeWs = null) {
  const room = getRoom(roomId);
  if (!room) return;
  
  room.participants.forEach((participant, userId) => {
    const clientData = clients.get(userId);
    if (clientData && clientData.ws.readyState === WebSocket.OPEN && clientData.ws !== excludeWs) {
      clientData.ws.send(JSON.stringify(message));
    }
  });
}

function sendMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  const userId = uuidv4();
  console.log('New client connected:', userId);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const { type, payload, id } = message;
      
      switch (type) {
        case 'create-room': {
          const { userName } = payload;
          const room = createRoom();
          console.log('Room created:', { roomId: room.id, userName });
          
          addParticipant(room.id, userId, userName);
          
          // Store client info
          clients.set(userId, {
            ws,
            roomId: room.id,
            userName
          });
          
          sendMessage(ws, {
            type: 'create-room-response',
            id,
            payload: {
              success: true,
              roomId: room.id,
              userId
            }
          });
          
          // Send room update to all in room
          broadcastToRoom(room.id, {
            type: 'room-updated',
            payload: getRoomState(room.id)
          });
          break;
        }
        
        case 'join-room': {
          const { roomId, userName } = payload;
          const normalizedRoomId = roomId.toUpperCase();
          console.log('Join room request:', { roomId: normalizedRoomId, userName });
          
          const room = getRoom(normalizedRoomId);
          
          if (!room) {
            sendMessage(ws, {
              type: 'join-room-response',
              id,
              payload: {
                success: false,
                error: 'Room not found'
              }
            });
            return;
          }
          
          addParticipant(normalizedRoomId, userId, userName);
          
          // Store client info
          clients.set(userId, {
            ws,
            roomId: normalizedRoomId,
            userName
          });
          
          sendMessage(ws, {
            type: 'join-room-response',
            id,
            payload: {
              success: true,
              roomId: normalizedRoomId,
              userId
            }
          });
          
          // Send room update to all in room
          broadcastToRoom(normalizedRoomId, {
            type: 'room-updated',
            payload: getRoomState(normalizedRoomId)
          });
          break;
        }
        
        case 'vote': {
          const { vote } = payload;
          const clientData = clients.get(userId);
          if (!clientData || !clientData.roomId) return;
          
          setParticipantVote(clientData.roomId, userId, vote);
          
          broadcastToRoom(clientData.roomId, {
            type: 'room-updated',
            payload: getRoomState(clientData.roomId)
          });
          break;
        }
        
        case 'reveal-votes': {
          const clientData = clients.get(userId);
          if (!clientData || !clientData.roomId) return;
          
          revealVotes(clientData.roomId);
          
          broadcastToRoom(clientData.roomId, {
            type: 'room-updated',
            payload: getRoomState(clientData.roomId)
          });
          break;
        }
        
        case 'reset-votes': {
          const clientData = clients.get(userId);
          if (!clientData || !clientData.roomId) return;
          
          resetVotes(clientData.roomId);
          
          broadcastToRoom(clientData.roomId, {
            type: 'room-updated',
            payload: getRoomState(clientData.roomId)
          });
          break;
        }
        
        case 'get-room-state': {
          const clientData = clients.get(userId);
          if (!clientData || !clientData.roomId) {
            sendMessage(ws, {
              type: 'get-room-state-response',
              id,
              payload: {
                success: false,
                error: 'Not in a room'
              }
            });
            return;
          }
          
          const roomState = getRoomState(clientData.roomId);
          if (!roomState) {
            sendMessage(ws, {
              type: 'get-room-state-response',
              id,
              payload: {
                success: false,
                error: 'Room not found'
              }
            });
            return;
          }
          
          sendMessage(ws, {
            type: 'get-room-state-response',
            id,
            payload: {
              success: true,
              room: roomState
            }
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected:', userId);
    const clientData = clients.get(userId);
    
    if (clientData && clientData.roomId) {
      removeParticipant(clientData.roomId, userId);
      broadcastToRoom(clientData.roomId, {
        type: 'room-updated',
        payload: getRoomState(clientData.roomId)
      });
    }
    
    clients.delete(userId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server listening on port 3001');