const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors());

// Connect to MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- ADD THIS LINE BELOW ---
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/watch-progress', require('./routes/watchProgressRoutes'));
app.use('/api/video-reactions', require('./routes/videoReactionRoutes'));
// ---------------------------

app.get('/', (req, res) => {
  res.send("Server is up and running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});