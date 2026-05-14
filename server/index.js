const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cors());

const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/watch-progress', require('./routes/watchProgressRoutes'));
app.use('/api/video-reactions', require('./routes/videoReactionRoutes'));
app.use('/api/moment-reactions', require('./routes/momentReactionRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

app.get('/', (req, res) => {
  res.send("Server is up and running!");
});

// ── Watch Party rooms (in-memory) ──────────────────────────────────────────
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function leaveRoom(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  room.members = room.members.filter(m => m.socketId !== socket.id);
  socket.to(code).emit('party:member-left', { socketId: socket.id });
  socket.leave(code);
  socket.data.roomCode = undefined;

  if (room.members.length === 0) {
    rooms.delete(code);
  } else if (room.hostSocketId === socket.id) {
    room.hostSocketId = room.members[0].socketId;
    io.to(code).emit('party:host-changed', { socketId: room.members[0].socketId });
  }
}

io.on('connection', (socket) => {
  socket.on('party:create', ({ seriesId, episodeId, userId, userName, avatar }) => {
    let code;
    do { code = generateCode(); } while (rooms.has(code));

    const member = { socketId: socket.id, userId, userName, avatar };
    rooms.set(code, {
      hostSocketId: socket.id,
      members: [member],
      state: { isPlaying: false, currentTime: 0, seriesId, episodeId },
    });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('party:created', { roomCode: code });
    socket.emit('party:joined', { members: [member], state: rooms.get(code).state });
  });

  socket.on('party:join', ({ roomCode, userId, userName, avatar }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('party:error', { message: 'Room not found. Check the code and try again.' });
      return;
    }
    const member = { socketId: socket.id, userId, userName, avatar };
    room.members.push(member);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.to(roomCode).emit('party:member-joined', { member });
    socket.emit('party:joined', { members: room.members, state: room.state });
  });

  socket.on('party:play', ({ currentTime }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.state.isPlaying = true;
    room.state.currentTime = currentTime;
    socket.to(code).emit('party:play', { currentTime });
  });

  socket.on('party:pause', ({ currentTime }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.state.isPlaying = false;
    room.state.currentTime = currentTime;
    socket.to(code).emit('party:pause', { currentTime });
  });

  socket.on('party:seek', ({ currentTime }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.state.currentTime = currentTime;
    socket.to(code).emit('party:seek', { currentTime });
  });

  socket.on('party:change-episode', ({ episodeId }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.state.episodeId = episodeId;
    room.state.currentTime = 0;
    room.state.isPlaying = false;
    socket.to(code).emit('party:change-episode', { episodeId });
  });

  socket.on('party:leave', () => leaveRoom(socket));
  socket.on('disconnect', () => leaveRoom(socket));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});
