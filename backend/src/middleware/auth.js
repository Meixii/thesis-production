const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      groupId: decoded.groupId
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const isFinanceCoordinator = async (req, res, next) => {
  try {
    if (req.user.role !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Access denied. Finance Coordinator role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error while checking role.' });
  }
};

const isTreasurer = async (req, res, next) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error while checking role.' });
  }
};

const isStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Student role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error while checking role.' });
  }
};

module.exports = {
  authenticateToken,
  isFinanceCoordinator,
  isTreasurer,
  isStudent
}; 