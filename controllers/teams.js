const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const User = require('../models/user');
const { verifyToken } = require('../middleware/verify-token'); // Ensure verifyToken is imported

// Middleware to allow access only to team managers
function verifyTeamManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'User authentication failed.' });
  }

  // Check if user role is team manager
  if (req.user.role !== 'teamManager') {
    return res.status(403).json({ error: 'Only team managers can manage teams.' });
  }
  next();
}

// Middleware to verify if the user is an admin
function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Route to create a team (restricted to team managers)
router.post('/', verifyToken, verifyTeamManager, async (req, res) => {
  try {
    const { teamName } = req.body;

    if (!teamName) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    // Create the team and associate it with the manager's ID
    const team = new Team({
      name: teamName,
      manager: req.user._id,
    });
    await team.save();

    // Update manager's profile to include the managed team
    await User.findByIdAndUpdate(req.user._id, { team: team._id });

    res.status(201).json({ team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for an admin to get all teams (full access)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const teams = await Team.find().populate('manager', 'username email'); // Populate manager details
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for team managers to view their own teams
router.get('/my-team', verifyToken, verifyTeamManager, async (req, res) => {
  try {
    const team = await Team.findOne({ manager: req.user._id }).populate('manager', 'username email');
    if (!team) {
      return res.status(404).json({ error: 'No team found for this manager.' });
    }
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for admin to get a single team by its ID (full access)
router.get('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('manager', 'username email');
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for team managers to update their own teams
router.put('/my-team', verifyToken, verifyTeamManager, async (req, res) => {
  try {
    const { teamName } = req.body;
    const team = await Team.findOne({ manager: req.user._id });

    if (!team) {
      return res.status(404).json({ error: 'No team found for this manager.' });
    }

    if (teamName) {
      team.name = teamName; // Update the team name
      await team.save();
    }

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for admin to update a team (full access)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { teamName } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    if (teamName) {
      team.name = teamName; // Update the team name
      await team.save();
    }

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for team managers to delete their own teams
router.delete('/my-team', verifyToken, verifyTeamManager, async (req, res) => {
  try {
    const team = await Team.findOne({ manager: req.user._id });

    if (!team) {
      return res.status(404).json({ error: 'No team found for this manager.' });
    }

    await team.remove();
    await User.findByIdAndUpdate(req.user._id, { team: null }); // Remove the team reference from the manager

    res.status(200).json({ message: 'Team successfully deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for admin to delete a team (full access)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    await team.remove();
    res.status(200).json({ message: 'Team successfully deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
