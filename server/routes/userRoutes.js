const express = require('express');
const router = express.Router();
const User = require('../models/user');
const WatchProgress = require('../models/WatchProgress');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. AUTH MIDDLEWARE: Verifies the digital ID (token) sent from the frontend
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token using your secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// 2. GET USER DATA ROUTE: This is what fixes the "refresh" logout issue
// http://localhost:5000/api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET FAVORITES
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('favorites');
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE SERIES FAVORITE
router.post('/favorites/series', auth, async (req, res) => {
  try {
    const { seriesId } = req.body;
    const user = await User.findById(req.user.id);
    const exists = user.favorites.seriesIds.includes(seriesId);
    await User.findByIdAndUpdate(req.user.id,
      exists
        ? { $pull:     { 'favorites.seriesIds': seriesId } }
        : { $addToSet: { 'favorites.seriesIds': seriesId } }
    );
    const updated = await User.findById(req.user.id).select('favorites');
    res.json(updated.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE VIDEO EPISODE BOOKMARK
router.post('/favorites/episodes/video', auth, async (req, res) => {
  try {
    const { seriesId, episodeId } = req.body;
    const user = await User.findById(req.user.id);
    const exists = user.favorites.videoEpisodes.some(
      e => e.seriesId === seriesId && e.episodeId === Number(episodeId)
    );
    await User.findByIdAndUpdate(req.user.id,
      exists
        ? { $pull:     { 'favorites.videoEpisodes': { seriesId, episodeId: Number(episodeId) } } }
        : { $addToSet: { 'favorites.videoEpisodes': { seriesId, episodeId: Number(episodeId) } } }
    );
    const updated = await User.findById(req.user.id).select('favorites');
    res.json(updated.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE DISPLAY NAME
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ msg: 'Name must be at least 2 characters' });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true }
    ).select('-password');
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE PASSWORD
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ msg: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE EMAIL
router.put('/email', auth, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !newEmail.trim())
      return res.status(400).json({ msg: 'Email is required' });
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
    const existing = await User.findOne({ email: newEmail.trim().toLowerCase() });
    if (existing) return res.status(400).json({ msg: 'Email already in use' });
    user.email = newEmail.trim().toLowerCase();
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE AVATAR
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || !avatar.startsWith('data:image/'))
      return res.status(400).json({ msg: 'Invalid image' });
    if (avatar.length > 200000)
      return res.status(400).json({ msg: 'Image too large (max ~150 KB)' });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select('-password');
    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ACCOUNT
router.delete('/account', auth, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Password is incorrect' });
    await Promise.all([
      WatchProgress.deleteMany({ userId: req.user.id }),
      Comment.deleteMany({ userId: req.user.id }),
      User.findByIdAndDelete(req.user.id),
    ]);
    res.json({ msg: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;