const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
}

async function verifyToken(token) {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    );
    return decoded;
  } catch (error) {
    return null;
  }
}

module.exports = { authMiddleware, verifyToken };
