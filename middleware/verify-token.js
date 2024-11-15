const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if decoded contains the necessary user information
    if (!decoded || !decoded.role) {
      return res.status(401).json({ error: 'Token verification failed or invalid token.' });
    }
    
    req.user = decoded; // Set decoded user data to req.user
    next();
  } catch (error) {
    console.error('Token verification error:', error); // Log error for debugging
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// function authorizeRole(req, res, next) {
//   try {
//     const token = req.headers.authorization.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Check if decoded contains the necessary user information
//     if (!decoded || !decoded.role) {
//       return res.status(401).json({ error: 'Token verification failed or invalid token.' });
//     }
    
//     req.user = decoded; // Set decoded user data to req.user
//     next();
//   } catch (error) {
//     console.error('Token verification error:', error); // Log error for debugging
//     res.status(401).json({ error: 'Invalid token.' });
//   }
// }

module.exports = { verifyToken };
