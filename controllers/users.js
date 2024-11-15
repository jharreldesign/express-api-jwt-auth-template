const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const SALT_LENGTH = 12;

// Middleware to verify JWT and extract user data
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

// Middleware to verify admin access
function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Middleware to verify Team Manager or Admin access (restricted by team for Team Manager)
function verifyTeamManagerOrAdmin(req, res, next) {
  const { role, team } = req.user;
  const targetUserId = req.params.userId;

  if (role === 'admin') {
    // Admins have full access
    return next();
  } else if (role === 'teamManager') {
    // Check if the Team Manager manages the target user’s team
    User.findById(targetUserId)
      .then(targetUser => {
        if (targetUser && targetUser.team === team) {
          next();
        } else {
          return res.status(403).json({ error: 'Access denied. Team Managers can only manage their own team.' });
        }
      })
      .catch(() => res.status(404).json({ error: 'User not found.' }));
  } else {
    res.status(403).json({ error: 'Access denied.' });
  }
}

// Sign-up route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, role, team } = req.body;
    const hashedPassword = bcrypt.hashSync(password, SALT_LENGTH);
    const user = new User({ username, email, password: hashedPassword, role: role || 'teamManager', team: team || '' });
    await user.save();

    delete user.password;

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sign-in route
router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Invalid username or password.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CRUD operations

// Get all users - Admin and Team Manager (filtered by team for Team Manager)
router.get('/', authenticateToken, verifyTeamManagerOrAdmin, async (req, res) => {
  try {
    const users = req.user.role === 'admin' ? await User.find() : await User.find({ team: req.user.team });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a specific user by ID - Admin and Team Manager
router.get('/:userId', authenticateToken, verifyTeamManagerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update a user by ID - Admin and Team Manager (restricted by team for Team Manager)
router.put('/:userId', authenticateToken, verifyTeamManagerOrAdmin, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.userId, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user by ID - Admin and Team Manager (restricted by team for Team Manager)
router.delete('/:userId', authenticateToken, verifyTeamManagerOrAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userId);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Create a new user - Admin only
router.post('/', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { username, email, password, role, team } = req.body;
    const hashedPassword = bcrypt.hashSync(password, SALT_LENGTH);
    const newUser = new User({ username, email, password: hashedPassword, role, team });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;
