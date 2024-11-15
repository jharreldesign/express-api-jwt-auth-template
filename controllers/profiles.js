const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { verifyToken,  } = require('../middleware/verify-token');

// Helper function to check if user has permissions
async function hasEditPermissions(req, userToEdit) {
  if (req.user.role === 'admin') return true; // Admins can edit any profile

  if (req.user._id === userToEdit._id.toString()) return true; // Users can edit their own profile

  // Team managers can edit profiles of users on their team
  if (req.user.role === 'teamManager' && req.user.teamId.toString() === userToEdit.teamId.toString()) {
    return true;
  }

  return false; // No permissions
}

// Route to update user profile (restricted by role and team association)
router.put('/:userId', verifyToken, async (req, res) => {
  try {
    const userToEdit = await User.findById(req.params.userId);
    if (!userToEdit) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if the current user has permission to edit this profile
    const hasPermission = await hasEditPermissions(req, userToEdit);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Update and return the user's profile
    const updatedUser = await User.findByIdAndUpdate(req.params.userId, req.body, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
