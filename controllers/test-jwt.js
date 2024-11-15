const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Generate a JWT token for testing
router.get('/sign-token', (req, res) => {
  const user = {
    _id: 1,
    username: 'test',
    password: 'test',
  };

  // Sign a JWT with the test user data
  const token = jwt.sign({ user }, process.env.JWT_SECRET);
  res.json({ token });
});

// Verify a JWT token from the request headers
router.post('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

module.exports = router;
